import { comPropriedade } from '@/products/analytics/server/http'
import { eventosConhecidos, paginasComCliques, propriedadesConhecidas, valoresDoCampo } from '@/products/analytics/server/motor'
import { AnalyticsError } from '@/products/analytics/server/pg'
import { campo } from '@/products/analytics/shared/consulta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET ?propriedade&tipo=eventos|propriedades|valores|paginas|instalacao (&evento, &campo, &busca): o que alimenta os seletores. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  return comPropriedade('catalogo', q.get('propriedade'), async (db, id) => {
    switch (q.get('tipo')) {
      case 'eventos': return { eventos: await eventosConhecidos(db, id) }
      case 'propriedades': return { propriedades: await propriedadesConhecidas(db, id, q.get('evento') || undefined) }
      case 'valores': return { valores: await valoresDoCampo(db, id, campo().parse(q.get('campo')), (q.get('busca') ?? '').slice(0, 100)) }
      case 'paginas': return { paginas: await paginasComCliques(db, id) }
      case 'instalacao': {
        const [r] = await db.query<{ ultimo: string | null; hora: number; dia: number }>(`SELECT max("timestamp") AS ultimo, (count(*) FILTER (WHERE "timestamp" >= now() - interval '1 hour'))::int AS hora,
          (count(*) FILTER (WHERE "timestamp" >= now() - interval '1 day'))::int AS dia FROM analytics.events WHERE property_id = $1 AND "timestamp" >= now() - interval '30 days'`, [id])
        return { ultimo_evento: r?.ultimo ?? null, eventos_ultima_hora: r?.hora ?? 0, eventos_ultimo_dia: r?.dia ?? 0 }
      }
      default: throw new AnalyticsError('Tipo desconhecido.')
    }
  })
}
