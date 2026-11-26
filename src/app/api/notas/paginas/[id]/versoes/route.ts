import { listarVersoes } from '@/products/notas/server/versoes'
import { contexto, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — versões guardadas da página (mais recentes primeiro). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Página inválida.' })
  return responder('NOTAS_VERSIONS_FAILED', () => listarVersoes(ctx, id))
}
