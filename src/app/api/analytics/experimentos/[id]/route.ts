import { contexto, responder } from '@/products/analytics/server/http'
import { resultadoExperimento } from '@/products/analytics/server/flags'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET: o resultado do experimento (quem viu cada variante, conversão e significância). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  return responder('experimento', ctx, db => resultadoExperimento(db, /^[0-9a-f-]{36}$/i.test(id) ? id : '00000000-0000-0000-0000-000000000000'))
}
