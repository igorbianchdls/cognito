import { comPropriedade, json } from '@/products/analytics/server/http'
import { membrosDaCoorte } from '@/products/analytics/server/motor'
import { definicaoCoorte } from '@/products/analytics/shared/consulta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { propriedade, definicao }: quantas pessoas cabem na coorte agora (prévia ao montar as regras). */
export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null) as { propriedade?: string; definicao?: unknown } | null
  if (!corpo?.definicao) return json(400, { erro: 'Envie as regras.' })
  return comPropriedade('coorte-membros', corpo.propriedade ?? null, (db, id) => membrosDaCoorte(db, id, definicaoCoorte.parse(corpo.definicao)))
}
