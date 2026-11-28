// O que as rotas públicas (chamadas pelo otto.js nos sites) têm em comum: CORS sem preflight (corpo text/plain),
// limite por visitante, chave pública → site e domínio permitido.
import { isBot, originAllowed } from './capture'
import { propertyByKey, type PublicProperty } from './database'

export const cors = (origin: string | null) => ({
  'access-control-allow-origin': origin ?? '*', 'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400', vary: 'origin',
})
export const responder = (status: number, origin: string | null, body?: object) =>
  new Response(body ? JSON.stringify(body) : null, { status, headers: { ...cors(origin), ...(body ? { 'content-type': 'application/json' } : {}) } })

const hits = new Map<string, { count: number; until: number }>()
/** Melhor esforço por instância: no máximo `max` pedidos por minuto de uma conexão. */
export function limitado(chave: string, max = 120) {
  const now = Date.now(), hit = hits.get(chave)
  if (!hit || hit.until < now) { if (hits.size > 5000) hits.clear(); hits.set(chave, { count: 1, until: now + 60000 }); return false }
  return ++hit.count > max
}

/** Lê o corpo, confere tamanho, robô, limite, chave e domínio. Devolve o site e o corpo, ou a resposta de erro. */
export async function entrada(request: Request, max: number, limite = 120): Promise<{ site: PublicProperty; corpo: unknown; origin: string | null } | Response> {
  const origin = request.headers.get('origin')
  const raw = await request.text()
  if (raw.length > max) return responder(413, origin, { erro: 'Grande demais.' })
  let corpo: unknown
  try { corpo = JSON.parse(raw) } catch { return responder(400, origin, { erro: 'JSON inválido.' }) }
  const k = (corpo as { k?: unknown })?.k
  if (typeof k !== 'string' || !/^otto_[0-9a-f]{32}$/.test(k)) return responder(400, origin, { erro: 'Chave inválida.' })
  if (isBot(request.headers.get('user-agent') ?? '')) return responder(204, origin)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  if (limitado(`${new URL(request.url).pathname}:${k}:${ip}`, limite)) return responder(429, origin, { erro: 'Muitos envios.' })
  const site = await propertyByKey(k).catch(() => undefined)
  if (site === undefined) return responder(503, origin, { erro: 'Indisponível.' })
  if (!site) return responder(404, origin, { erro: 'Chave desconhecida.' })
  if (!originAllowed(site, origin)) return responder(403, origin, { erro: 'Este site não está nos domínios da propriedade.' })
  return { site, corpo, origin }
}
