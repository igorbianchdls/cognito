import { after } from 'next/server'
import { batchSchema, isBot, MAX_BODY, originAllowed, toRows } from '@/products/analytics/server/capture'
import { gravarEventos } from '@/products/analytics/server/coleta'
import { propertyByKey } from '@/products/analytics/server/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Public: any site with the script sends here. The body is text/plain (sendBeacon), so browsers skip the preflight.
const cors = (origin: string | null) => ({
  'access-control-allow-origin': origin ?? '*', 'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400', vary: 'origin',
})
const answer = (status: number, origin: string | null, body?: object) =>
  new Response(body ? JSON.stringify(body) : null, { status, headers: { ...cors(origin), ...(body ? { 'content-type': 'application/json' } : {}) } })

export function OPTIONS(request: Request) {
  return answer(204, request.headers.get('origin'))
}

const hits = new Map<string, { count: number; until: number }>()
/** Best effort per instance: at most 120 batches a minute from one visitor connection. */
function limited(key: string) {
  const now = Date.now(), hit = hits.get(key)
  if (!hit || hit.until < now) { if (hits.size > 5000) hits.clear(); hits.set(key, { count: 1, until: now + 60000 }); return false }
  return ++hit.count > 120
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const raw = await request.text()
  if (raw.length > MAX_BODY) return answer(413, origin, { erro: 'Lote grande demais.' })
  let body: unknown
  try { body = JSON.parse(raw) } catch { return answer(400, origin, { erro: 'JSON inválido.' }) }
  const parsed = batchSchema.safeParse(body)
  if (!parsed.success) return answer(400, origin, { erro: 'Eventos inválidos.' })
  const ua = request.headers.get('user-agent') ?? ''
  if (isBot(ua)) return answer(204, origin)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  if (limited(`${parsed.data.k}:${ip}`)) return answer(429, origin, { erro: 'Muitos envios.' })

  const property = await propertyByKey(parsed.data.k).catch(() => undefined)
  if (property === undefined) return answer(503, origin, { erro: 'Indisponível.' })
  if (!property) return answer(404, origin, { erro: 'Chave desconhecida.' })
  if (!originAllowed(property, origin)) return answer(403, origin, { erro: 'Este site não está nos domínios da propriedade.' })

  const rows = toRows(property, parsed.data, { ua, country: request.headers.get('x-vercel-ip-country'), region: request.headers.get('x-vercel-ip-country-region') })
  // The browser doesn't wait for the database.
  after(async () => {
    try { await gravarEventos(rows) } catch (error) {
      console.error(JSON.stringify({ scope: 'analytics', code: 'CAPTURE_FAILED', rows: rows.length, message: (error as Error).message }))
    }
  })
  return answer(202, origin, { gravado: true, eventos: rows.length })
}
