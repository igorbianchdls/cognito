import { randomUUID } from 'node:crypto'
import { runQuery, withTransaction } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { checkErpStoredFile, signErpDocumentFile, signErpUploadFile } from './erpStorage'

// Anexos (Fase 2B). O navegador envia o arquivo direto ao bucket privado por um link assinado; o banco registra o
// arquivo como pendente e só o lista depois da confirmação. Permissões e empresa são conferidas pelas funções
// erp.anexar_arquivo / anexo_acessivel / listar_anexos / remover_anexo (migração 20261009110000).

export const ATTACHMENT_DOCUMENTS = ['conta_pagar', 'conta_receber', 'pagamento', 'venda', 'compra', 'contrato', 'ordem_servico'] as const
export type AttachmentDocument = typeof ATTACHMENT_DOCUMENTS[number]
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const ATTACHMENT_TYPES: Record<string, string> = {
  'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
  'application/xml': 'xml', 'text/xml': 'xml',
}
// Limite total por empresa (MB), configurável; padrão 1 GB.
const companyLimitBytes = () => Math.max(10, Number(process.env.ERP_ANEXOS_LIMITE_MB || 1024)) * 1024 * 1024

function safeName(name: string) {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return (base || 'arquivo').slice(-80)
}

export async function prepareAttachmentUpload(input: { tenantId: number; documento: AttachmentDocument; registroId: number; nome: string; mimeType: string; tamanho: number; finalidade?: string }) {
  const extension = ATTACHMENT_TYPES[input.mimeType]
  if (!extension) throw new ErpDomainError('VALIDATION_ERROR', 'Envie PDF, imagem (PNG, JPG, WEBP) ou XML.', 422)
  if (!(input.tamanho > 0) || input.tamanho > ATTACHMENT_MAX_BYTES) throw new ErpDomainError('VALIDATION_ERROR', 'O anexo deve ter até 10 MB.', 422)
  const nome = String(input.nome || '').trim().slice(0, 200) || `anexo.${extension}`
  const caminho = `${input.tenantId}/${input.documento}/${input.registroId}/${randomUUID()}-${safeName(nome)}`
  // O link é assinado dentro da transação: se o armazenamento falhar, o registro pendente não fica.
  const { arquivoId, uploadUrl } = await withTransaction(async client => {
    const result = await client.query('SELECT erp.anexar_arquivo(empresa_id => $1, p_tipo => $2, p_registro_id => $3, p_caminho => $4, p_nome => $5, p_mime_type => $6, p_tamanho => $7, p_finalidade => $8, p_limite_bytes => $9) AS id',
      [input.tenantId, input.documento, input.registroId, caminho, nome, input.mimeType, input.tamanho, input.finalidade || null, companyLimitBytes()])
    return { arquivoId: Number(result.rows[0].id), uploadUrl: await signErpUploadFile({ bucket: 'erp-anexos', caminho, nome }) }
  }).catch(error => { throw attachmentError(error) })
  return { arquivo_id: arquivoId, upload_url: uploadUrl.toString(), metodo: 'PUT', content_type: input.mimeType }
}

export async function confirmAttachment(tenantId: number, arquivoId: number, hash?: string | null) {
  const file = await accessibleFile(tenantId, arquivoId, true)
  const stored = await checkErpStoredFile(file)
  if (!stored.exists) throw new ErpDomainError('FILE_UNAVAILABLE', 'O arquivo ainda não chegou ao armazenamento. Envie de novo.', 409)
  if (stored.size !== null && stored.size > ATTACHMENT_MAX_BYTES) {
    await withTransaction(client => client.query('SELECT erp.remover_anexo(empresa_id => $1, p_arquivo_id => $2)', [tenantId, arquivoId]))
    throw new ErpDomainError('VALIDATION_ERROR', 'O anexo deve ter até 10 MB.', 422)
  }
  await withTransaction(client => client.query('SELECT erp.confirmar_anexo(empresa_id => $1, p_arquivo_id => $2, p_hash => $3)', [tenantId, arquivoId, hash && /^[a-f0-9]{64}$/.test(hash) ? hash : null]))
  return { arquivo_id: arquivoId, confirmado: true }
}

export async function listAttachments(tenantId: number, documento: AttachmentDocument, registroId: number) {
  const rows = await runQuery<Record<string, unknown>>('SELECT id::text, nome, mime_type, tamanho_bytes, finalidade, criado_em, criado_por FROM erp.listar_anexos(empresa_id => $1, p_tipo => $2, p_registro_id => $3)', [tenantId, documento, registroId])
  return rows.map(row => ({ ...row, id: String(row.id), tamanho_bytes: Number(row.tamanho_bytes || 0) }))
}

export async function attachmentDownload(tenantId: number, arquivoId: number) {
  const file = await accessibleFile(tenantId, arquivoId, false)
  if (file.pendente) throw new ErpDomainError('FILE_UNAVAILABLE', 'Este anexo ainda não terminou de ser enviado.', 409)
  const url = await signErpDocumentFile(file)
  return { url: url.toString(), nome: file.nome, mime_type: file.mime_type, expira_em_segundos: 60 }
}

export async function removeAttachment(tenantId: number, arquivoId: number) {
  await withTransaction(client => client.query('SELECT erp.remover_anexo(empresa_id => $1, p_arquivo_id => $2)', [tenantId, arquivoId])).catch(error => { throw attachmentError(error) })
  return { arquivo_id: arquivoId, removido: true }
}

async function accessibleFile(tenantId: number, arquivoId: number, write: boolean) {
  const [file] = await runQuery<{ id: string; bucket: string; caminho: string; nome: string; mime_type: string; pendente: boolean }>(
    'SELECT id::text, bucket, caminho, nome, mime_type, pendente FROM erp.anexo_acessivel(empresa_id => $1, p_arquivo_id => $2, p_escrita => $3)', [tenantId, arquivoId, write])
  if (!file) throw new ErpDomainError('NOT_FOUND', 'Anexo não encontrado.', 404)
  return file
}

// Erros das funções do banco com mensagem de negócio clara.
function attachmentError(error: unknown) {
  const source = error as { code?: string; message?: string }
  if (source?.code === '42501') return new ErpDomainError('ACCESS_DENIED', 'Você não tem permissão para anexar neste documento.', 403)
  if (source?.code === '22023') return new ErpDomainError('VALIDATION_ERROR', source.message || 'Anexo inválido.', 422)
  return error
}
