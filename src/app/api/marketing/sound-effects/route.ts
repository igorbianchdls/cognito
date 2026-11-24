import { auth } from '@clerk/nextjs/server'
import { soundEffectCategories, soundEffectPage } from '@/products/marketing/server/soundEffects'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (status: number, body: object) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG = /^[a-z0-9-]{1,40}$/

/**
 * GET ?categorias=1 — how many effects each category has.
 * GET ?categoria=transicoes&busca=whoosh&inicio=0 — a page of effects, with signed URLs (one hour) to play and download.
 * GET ?id=<uuid> — one effect, to sign its URL again.
 */
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return json(401, { erro: 'Entre para ver os efeitos.' })
  const q = new URL(request.url).searchParams
  const category = q.get('categoria') || undefined, id = q.get('id') || undefined
  if ((category && !SLUG.test(category)) || (id && !UUID.test(id))) return json(400, { erro: 'Parâmetros inválidos.' })
  try {
    if (q.get('categorias')) return json(200, { categorias: await soundEffectCategories(userId) })
    return json(200, await soundEffectPage(userId, { category, id, search: q.get('busca') ?? '', offset: Number(q.get('inicio')) || 0 }))
  } catch (error) {
    console.error(JSON.stringify({ scope: 'marketing', code: 'SOUND_EFFECTS_FAILED', message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível carregar os efeitos.' })
  }
}
