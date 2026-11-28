import { comPropriedade, json } from '@/products/analytics/server/http'
import { executar } from '@/products/analytics/server/motor'
import { consulta } from '@/products/analytics/shared/consulta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** POST { propriedade, consulta }: tendência, funil, retenção ou caminhos. */
export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null) as { propriedade?: string; consulta?: unknown } | null
  if (!corpo?.consulta) return json(400, { erro: 'Envie a consulta.' })
  return comPropriedade('consulta', corpo.propriedade ?? null, (db, id) => executar(db, consulta.parse(corpo.consulta), id))
}
