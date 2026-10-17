import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Database, TablesSession } from './database'
import { lockRecord, readRecord, requireRole, requireTable } from './repository'
import { TablesError } from '../shared/contracts'

export const attachmentInputSchema = z.object({ nome: z.string().trim().min(1).max(200), tamanho: z.number().int().positive().max(50 * 1024 * 1024), mime_type: z.string().min(1).max(150), campo_id: z.string().uuid(), expectedVersion: z.number().int().positive() }).strict()

function configuration() {
  const db = new URL(process.env.SUPABASE_DB_URL ?? 'postgresql://localhost')
  const ref = decodeURIComponent(db.username).match(/^postgres\.([a-z0-9]{20})$/)?.[1]
  const base = process.env.TABLES_SUPABASE_URL ?? (ref ? `https://${ref}.supabase.co` : undefined)
  const key = process.env.TABLES_SUPABASE_SERVICE_ROLE_KEY ?? process.env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key || !ref) throw new TablesError('STORAGE_UNAVAILABLE', 'O envio de arquivos ainda não está disponível neste ambiente.', 503)
  if (key.startsWith('eyJ')) {
    try {
      const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')) as { ref?: string; role?: string }
      if (claims.ref !== ref || claims.role !== 'service_role') throw new Error('Storage project mismatch')
    } catch { throw new TablesError('STORAGE_UNAVAILABLE', 'O armazenamento não está disponível.', 503) }
  }
  const origin = new URL(base)
  if (origin.origin !== `https://${ref}.supabase.co` || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash) throw new TablesError('STORAGE_UNAVAILABLE', 'O armazenamento não está disponível.', 503)
  return { base: origin.origin, key }
}

async function storageRequest(path: string, init: RequestInit = {}, missingAllowed = false) {
  const { base, key } = configuration()
  let response: Response
  try { response = await fetch(`${base}/storage/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) }) }
  catch { throw new TablesError('STORAGE_UNAVAILABLE', 'Não foi possível acessar o arquivo. Tente novamente.', 503) }
  if (!response.ok && !(missingAllowed && response.status === 404)) throw new TablesError('STORAGE_UNAVAILABLE', 'Não foi possível acessar o arquivo. Tente novamente.', 503)
  return { response, base }
}

export async function removeStoredAttachment(path: string) {
  // Signed upload URLs last two hours. Maintenance waits at least 24 hours.
  pathFor(path)
  await storageRequest('object/tables-anexos', { method: 'DELETE', body: JSON.stringify({ prefixes: [path] }) }, true)
}

function pathFor(path: string) {
  const parts = path.split('/')
  if (parts.some(p => !p || p === '.' || p === '..' || /[\\\u0000-\u001f]/.test(p))) throw new TablesError('INVALID_FILE', 'Arquivo inválido.')
  return ['tables-anexos', ...parts].map(encodeURIComponent).join('/')
}

export async function prepareAttachment(db: Database, session: TablesSession, recordId: string, input: z.infer<typeof attachmentInputSchema>) {
  configuration()
  const record = await readRecord(db, session, recordId)
  const table = await requireTable(db, session, record.tabela_id); await requireRole(db, session, table.base_id, 'editor')
  const id = randomUUID(), path = `${session.tenantId}/${table.base_id}/${recordId}/${id}`
  await db.query('INSERT INTO tables.anexos(id,empresa_id,tabela_id,registro_id,campo_id,caminho,nome,mime_type,tamanho,criado_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [id, session.tenantId, table.id, recordId, input.campo_id, path, input.nome, input.mime_type, input.tamanho, session.sharedUserId])
  const { response, base } = await storageRequest(`object/upload/sign/${pathFor(path)}`, { method: 'POST', body: '{}' })
  const result = await response.json() as { url?: string }
  const url = new URL('/storage/v1' + result.url, base)
  if (!result.url?.startsWith('/object/upload/sign/') || url.pathname !== `/storage/v1/object/upload/sign/${pathFor(path)}` || !url.searchParams.get('token')) throw new TablesError('INVALID_FILE', 'Não foi possível preparar o envio.', 503)
  return { anexo_id: id, upload_url: url.toString() }
}

export async function attachmentAction(db: Database, session: TablesSession, id: string, action: 'download' | 'confirmar' | 'excluir') {
  const file = (await db.query("SELECT * FROM tables.anexos WHERE empresa_id=$1 AND id=$2 AND estado<>'excluido'", [session.tenantId, id])).rows[0]
  if (!file) throw new TablesError('NOT_FOUND', 'Arquivo não encontrado.', 404)
  const record = await readRecord(db, session, file.registro_id)
  const fileTable = await requireTable(db, session, record.tabela_id)
  if (action !== 'download') await requireRole(db, session, fileTable.base_id, 'editor')
  const path = pathFor(file.caminho)
  if (action === 'download') {
    if (file.estado !== 'confirmado') throw new TablesError('PENDING_FILE', 'O envio deste arquivo ainda não terminou.')
    const { response, base } = await storageRequest(`object/sign/${path}`, { method: 'POST', body: JSON.stringify({ expiresIn: 60, download: file.nome }) })
    const result = await response.json() as { signedURL?: string }
    const url = new URL('/storage/v1' + result.signedURL, base)
    if (!result.signedURL?.startsWith('/object/sign/') || url.pathname !== `/storage/v1/object/sign/${path}` || !url.searchParams.get('token')) throw new TablesError('INVALID_FILE', 'Não foi possível preparar o download.', 503)
    url.searchParams.set('download', file.nome)
    return { url: url.toString() }
  }
  await lockRecord(db, session, file.registro_id)
  const current = (await db.query("SELECT estado,criado_em < now()-interval '24 hours' expirado FROM tables.anexos WHERE empresa_id=$1 AND id=$2 AND estado<>'excluido' FOR UPDATE", [session.tenantId, id])).rows[0]
  if (!current) throw new TablesError('NOT_FOUND', 'Arquivo não encontrado.', 404)
  if (action === 'confirmar') {
    if (current.estado === 'confirmado') return { ok: true }
    if (current.expirado) throw new TablesError('EXPIRED_UPLOAD', 'O prazo deste envio terminou. Envie o arquivo novamente.', 409)
    const { response } = await storageRequest(`object/authenticated/${path}`, { method: 'HEAD' })
    if (Number(response.headers.get('content-length')) !== Number(file.tamanho)) throw new TablesError('INVALID_FILE', 'O arquivo enviado não corresponde ao tamanho informado.')
    await db.query("UPDATE tables.anexos SET estado='confirmado' WHERE empresa_id=$1 AND id=$2 AND estado='pendente'", [session.tenantId, id])
  } else await db.query("UPDATE tables.anexos SET estado='excluido' WHERE empresa_id=$1 AND id=$2", [session.tenantId, id])
  return { ok: true }
}
