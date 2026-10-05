import { ErpDomainError } from '../shared/erpErrors'

type DocumentFile = { bucket: string; caminho: string; nome: string }
type Configuration = { base?: string; key?: string; send?: typeof fetch }

/** Call only after resolving a document and its linked file in the current tenant. */
export async function signErpDocumentFile(file: DocumentFile, configuration: Configuration = {}) {
  const base = configuration.base ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = configuration.key ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new ErpDomainError('STORAGE_UNAVAILABLE', 'O armazenamento de anexos não está configurado.', 503)
  let origin: URL
  try { origin = new URL(base) } catch { throw new ErpDomainError('STORAGE_UNAVAILABLE', 'Confira a configuração de armazenamento.', 503) }
  if (origin.protocol !== 'https:' || !/^[a-z0-9]{20}\.supabase\.co$/.test(origin.hostname) || origin.username || origin.password || origin.search || origin.hash || !['', '/'].includes(origin.pathname)) {
    throw new ErpDomainError('STORAGE_UNAVAILABLE', 'Confira a configuração de armazenamento.', 503)
  }
  const segments = file.caminho.split('/')
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(file.bucket) || !segments.length || segments.some(segment => !segment || ['.', '..'].includes(segment) || /[\u0000-\u001f\\]/.test(segment))) {
    throw new ErpDomainError('FILE_UNAVAILABLE', 'O caminho deste anexo é inválido.', 422)
  }
  const path = [file.bucket, ...segments].map(encodeURIComponent).join('/')
  try {
    const response = await (configuration.send || fetch)(`${origin.origin}/storage/v1/object/sign/${path}`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 60 }), cache: 'no-store', signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error('Storage refused request')
    const body = await response.json() as { signedURL?: string }
    if (!body.signedURL?.startsWith('/object/sign/')) throw new Error('Invalid signed path')
    const url = new URL('/storage/v1' + body.signedURL, origin.origin)
    if (url.origin !== origin.origin || url.pathname !== `/storage/v1/object/sign/${path}` || !url.searchParams.get('token')) throw new Error('Invalid signed target')
    return url
  } catch { throw new ErpDomainError('FILE_UNAVAILABLE', 'Não foi possível acessar este anexo. Tente novamente.', 503) }
}
