import { auth } from '@clerk/nextjs/server'
import { setSoundEffectFavorite, soundEffectCategories, soundEffectIndex, soundEffectPage, type SoundEffectSort } from '@/products/marketing/server/soundEffects'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (status: number, body: object) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG = /^[a-z0-9-]{1,40}$/
const NAME = /^[\p{L}\p{N} &'.-]{1,60}$/u
const SORTS: SoundEffectSort[] = ['nome', 'curtos', 'longos', 'recentes']
const ms = (v: string | null) => v === null || v === '' ? undefined : Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : NaN

/**
 * GET ?categorias=1 — how many effects each of our categories has.
 * GET ?indice=1 — the Epidemic categories and subcategories, with how many effects each has.
 * GET ?categoria=&ecat=&esub=&favoritos=1&min=&max=&ordem=&busca=&inicio= — a page of effects, with signed URLs (one hour).
 * GET ?id=<uuid> — one effect, to sign its URL again.
 */
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return json(401, { erro: 'Entre para ver os efeitos.' })
  const q = new URL(request.url).searchParams
  const category = q.get('categoria') || undefined, id = q.get('id') || undefined
  const epidemicCategory = q.get('ecat') || undefined, epidemicSubcategory = q.get('esub') || undefined
  const minMs = ms(q.get('min')), maxMs = ms(q.get('max')), sort = (q.get('ordem') || 'nome') as SoundEffectSort
  if ((category && !SLUG.test(category)) || (id && !UUID.test(id)) || (epidemicCategory && !NAME.test(epidemicCategory)) || (epidemicSubcategory && !NAME.test(epidemicSubcategory))
    || Number.isNaN(minMs) || Number.isNaN(maxMs) || !SORTS.includes(sort)) return json(400, { erro: 'Parâmetros inválidos.' })
  try {
    if (q.get('categorias')) return json(200, { categorias: await soundEffectCategories(userId) })
    if (q.get('indice')) return json(200, { indice: await soundEffectIndex(userId) })
    return json(200, await soundEffectPage(userId, {
      category, id, epidemicCategory, epidemicSubcategory, favorites: q.get('favoritos') === '1', minMs, maxMs, sort,
      search: q.get('busca') ?? '', offset: Number(q.get('inicio')) || 0,
    }))
  } catch (error) {
    console.error(JSON.stringify({ scope: 'marketing', code: 'SOUND_EFFECTS_FAILED', message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível carregar os efeitos.' })
  }
}

/** POST { id, favorito } — marks or unmarks an effect as a favorite of the person. */
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return json(401, { erro: 'Entre para favoritar.' })
  const body = await request.json().catch(() => null) as { id?: unknown; favorito?: unknown } | null
  if (!body || typeof body.id !== 'string' || !UUID.test(body.id) || typeof body.favorito !== 'boolean') return json(400, { erro: 'Parâmetros inválidos.' })
  try {
    await setSoundEffectFavorite(userId, body.id, body.favorito)
    return json(200, { ok: true })
  } catch (error) {
    console.error(JSON.stringify({ scope: 'marketing', code: 'SOUND_EFFECT_FAVORITE_FAILED', message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível salvar o favorito.' })
  }
}
