import { createHmac, timingSafeEqual } from 'node:crypto'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'

// Link temporário do DANFSe/XML para abrir fora da sessão do ERP (ex.: botão "Abrir PDF" no Claude ou no
// ChatGPT). O token carrega empresa, usuário que gerou o link, nota, tipo e validade, assinado com HMAC.
// A chave deriva do CLERK_SECRET_KEY com um rótulo próprio: não reaproveita a chave para outro fim.
export const SERVICE_INVOICE_LINK_TTL_SECONDS = 15 * 60
export const SERVICE_INVOICE_PUBLIC_PATH = '/api/public/nfse/'
export type ServiceInvoiceLink = { empresa: number; usuario: number; nota: number; tipo: 'pdf' | 'xml'; exp: number }

function key() {
  const secret = process.env.CLERK_SECRET_KEY?.trim()
  if (!secret) throw new ErpDomainError('UNAVAILABLE', 'Links temporários indisponíveis: configuração ausente.', 503)
  return createHmac('sha256', secret).update('cognito:nfse-link:v1').digest()
}
const sign = (payload: string) => createHmac('sha256', key()).update(payload).digest('base64url')

export function createServiceInvoiceLinkToken(link: Omit<ServiceInvoiceLink, 'exp'>, now = Date.now()) {
  const exp = Math.floor(now / 1000) + SERVICE_INVOICE_LINK_TTL_SECONDS
  const payload = Buffer.from(JSON.stringify({ ...link, exp })).toString('base64url')
  return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(exp * 1000).toISOString() }
}

export function verifyServiceInvoiceLinkToken(token: string, now = Date.now()): ServiceInvoiceLink {
  const invalid = new ErpDomainError('NOT_FOUND', 'Link inválido ou expirado. Peça um novo link na conversa ou abra a nota no ERP.', 404)
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(payload + signature)) throw invalid
  const expected = Buffer.from(sign(payload)), given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw invalid
  let link: ServiceInvoiceLink
  try { link = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) } catch { throw invalid }
  const ok = [link.empresa, link.usuario, link.nota, link.exp].every(value => Number.isSafeInteger(value) && value > 0) && ['pdf', 'xml'].includes(link.tipo)
  if (!ok || link.exp * 1000 <= now) throw invalid
  return link
}
