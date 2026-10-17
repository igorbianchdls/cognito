import { createHash } from 'node:crypto'
import { AppsError, validatePackage, type AppPackage } from '../shared/contracts'

export const hash = (text: string) => createHash('sha256').update(text).digest('hex')
function configuration() {
  const db = new URL(process.env.SUPABASE_DB_URL ?? 'postgresql://localhost')
  const ref = decodeURIComponent(db.username).match(/^postgres\.([a-z0-9]{20})$/)?.[1]
  const base = process.env.APPS_SUPABASE_URL ?? (ref ? `https://${ref}.supabase.co` : '')
  const key = process.env.APPS_SUPABASE_SERVICE_ROLE_KEY ?? process.env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY ?? process.env.TABLES_SUPABASE_SERVICE_ROLE_KEY
  if (!ref || !key || new URL(base).origin !== `https://${ref}.supabase.co` || new URL(base).pathname !== '/') throw new AppsError('STORAGE_UNAVAILABLE', 'O armazenamento de Apps não está configurado.', 503)
  if (key.startsWith('eyJ')) {
    try { const c = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()) as { ref?: string; role?: string }; if (c.ref !== ref || c.role !== 'service_role') throw Error() }
    catch { throw new AppsError('STORAGE_UNAVAILABLE', 'O armazenamento precisa pertencer ao banco de Apps.', 503) }
  }
  return { base: new URL(base).origin, key }
}
export async function storageRequest(path: string, init: RequestInit = {}) {
  const { base, key } = configuration()
  try {
    const r = await fetch(`${base}/storage/v1/${path}`, { ...init, headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, ...init.headers }, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) })
    if (!r.ok) throw Error()
    return r
  } catch { throw new AppsError('STORAGE_UNAVAILABLE', 'Não foi possível acessar os arquivos. Tente novamente.', 503) }
}
function objectPath(path: string) {
  if (!/^\d+\/[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.json$/.test(path)) throw new AppsError('INVALID_FILE', 'Caminho de arquivo inválido.')
  return 'apps-files/' + path
}
export type PackageStore = { put: (path: string, data: AppPackage) => Promise<{ tamanho: number; hash: string }>; get: (path: string, digest: string) => Promise<AppPackage> }
export const storage: PackageStore = {
  async put(path, data) {
    const body = JSON.stringify(validatePackage(data))
    await storageRequest('object/' + objectPath(path), { method: 'POST', body, headers: { 'x-upsert': 'false' } })
    return { tamanho: Buffer.byteLength(body), hash: hash(body) }
  },
  async get(path, digest) {
    const r = await storageRequest('object/authenticated/' + objectPath(path))
    if (Number(r.headers.get('content-length')) > 2_000_000) throw new AppsError('INVALID_FILE', 'Arquivo inválido.', 409)
    const text = await r.text()
    if (Buffer.byteLength(text) > 2_000_000 || hash(text) !== digest) throw new AppsError('INVALID_FILE', 'A integridade do arquivo não pôde ser confirmada.', 409)
    return validatePackage(JSON.parse(text))
  },
}
