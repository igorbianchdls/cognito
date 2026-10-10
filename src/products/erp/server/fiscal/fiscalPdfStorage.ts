import { createHash } from 'node:crypto'
import { ErpDomainError } from '../../shared/erpErrors'

export const FISCAL_PDF_BUCKET = 'erp-fiscal'
export const FISCAL_PDF_MAX_BYTES = 2 * 1024 * 1024
type Configuration = { base?: string; key?: string; databaseUrl?: string; send?: typeof fetch }
export type FiscalPdfFile = { empresaId: number; notaId: number; versao: number; layoutVersao: number; caminho: string; tamanho: number; hash: string }

export function fiscalPdfPath(company: number, note: number, version: number, layout: number, hash: string) {
  if (![company, note, version, layout].every(value => Number.isSafeInteger(value) && value > 0) || !/^[a-f0-9]{64}$/.test(hash))
    throw new ErpDomainError('VALIDATION_ERROR', 'Referência do documento fiscal inválida.', 422)
  return `${company}/notas/${note}/v${version}/layout-${layout}/${hash}.pdf`
}

export function fiscalStorageConfiguration(configuration: Configuration = {}) {
  const base = configuration.base ?? process.env.ERP_FISCAL_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = configuration.key ?? process.env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  const databaseUrl = configuration.databaseUrl ?? process.env.SUPABASE_DB_URL
  if (!base || !key || !databaseUrl) throw new ErpDomainError('STORAGE_UNAVAILABLE', 'O armazenamento fiscal não está configurado.', 503)
  try {
    const origin = new URL(base), database = new URL(databaseUrl)
    const ref = decodeURIComponent(database.username).match(/^postgres\.([a-z0-9]{20})$/)?.[1]
    if (!ref || origin.protocol !== 'https:' || origin.hostname !== `${ref}.supabase.co` || origin.username || origin.password || origin.search || origin.hash || !['', '/'].includes(origin.pathname)) throw new Error()
    if (key.startsWith('eyJ')) {
      const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))
      if (claims.ref !== ref || claims.role !== 'service_role') throw new Error()
    } else if (!key.startsWith('sb_secret_')) throw new Error()
    return { origin: origin.origin, key, send: configuration.send ?? fetch }
  } catch { throw new ErpDomainError('STORAGE_UNAVAILABLE', 'O armazenamento fiscal deve pertencer ao mesmo projeto do banco do ERP.', 503) }
}

function target(file: FiscalPdfFile, configuration: Configuration) {
  if (file.caminho !== fiscalPdfPath(file.empresaId, file.notaId, file.versao, file.layoutVersao, file.hash) || !Number.isSafeInteger(file.tamanho) || file.tamanho < 100 || file.tamanho > FISCAL_PDF_MAX_BYTES)
    throw new ErpDomainError('FILE_UNAVAILABLE', 'Metadados do documento fiscal inválidos.', 422)
  const config = fiscalStorageConfiguration(configuration)
  return { ...config, path: [FISCAL_PDF_BUCKET, ...file.caminho.split('/')].map(encodeURIComponent).join('/') }
}

export async function readFiscalPdf(file: FiscalPdfFile, configuration: Configuration = {}) {
  const config = target(file, configuration)
  try {
    const response = await config.send(`${config.origin}/storage/v1/object/authenticated/${config.path}`, {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    })
    if (!response.ok || !response.body) throw new Error()
    const declared = Number(response.headers.get('content-length'))
    if (declared > FISCAL_PDF_MAX_BYTES) { await response.body.cancel(); throw new Error() }
    const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0
    try { for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.length
      if (size > FISCAL_PDF_MAX_BYTES) { await reader.cancel(); throw new Error() } chunks.push(part.value)
    } } finally { reader.releaseLock() }
    const bytes = Buffer.concat(chunks)
    if (size !== file.tamanho || createHash('sha256').update(bytes).digest('hex') !== file.hash || bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error()
    return bytes
  } catch { throw new ErpDomainError('FILE_UNAVAILABLE', 'Não foi possível conferir ou baixar o PDF fiscal. Tente novamente.', 503) }
}

/** Repeated or uncertain uploads are accepted only after reading and verifying identical bytes. Never upserts. */
export async function uploadFiscalPdf(file: FiscalPdfFile, bytes: Buffer, configuration: Configuration = {}) {
  const config = target(file, configuration)
  if (bytes.length !== file.tamanho || createHash('sha256').update(bytes).digest('hex') !== file.hash || bytes.subarray(0, 5).toString() !== '%PDF-')
    throw new ErpDomainError('VALIDATION_ERROR', 'Conteúdo do PDF fiscal inválido.', 422)
  try {
    await config.send(`${config.origin}/storage/v1/object/${config.path}`, {
      method: 'POST', headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/pdf', 'x-upsert': 'false', 'Cache-Control': 'private, no-store' },
      body: new Uint8Array(bytes), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    })
  } catch { /* A timeout may follow a successful upload. Verify the deterministic target before retrying. */ }
  await readFiscalPdf(file, configuration)
}
