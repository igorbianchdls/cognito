import { comPropriedade } from '@/products/analytics/server/http'
import { mapaDeCalor } from '@/products/analytics/server/motor'
import { AnalyticsError } from '@/products/analytics/server/pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET ?propriedade&pagina=/precos&aparelho=desktop&dias=30: cliques, elementos mais clicados e até onde rolam. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  return comPropriedade('mapa', q.get('propriedade'), (db, id) => {
    const pagina = (q.get('pagina') ?? '').slice(0, 500), aparelho = q.get('aparelho') ?? 'desktop', dias = Math.min(400, Math.max(1, Number(q.get('dias') ?? 30) || 30))
    if (!pagina.startsWith('/')) throw new AnalyticsError('Escolha a página.')
    if (!['desktop', 'mobile', 'tablet'].includes(aparelho)) throw new AnalyticsError('Aparelho inválido.')
    const ate = new Date(), de = new Date(ate.getTime() - dias * 86400000)
    return mapaDeCalor(db, id, { pagina, aparelho: aparelho as 'desktop', de, ate })
  })
}
