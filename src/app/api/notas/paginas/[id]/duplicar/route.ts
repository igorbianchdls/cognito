import { duplicarPagina } from '@/products/notas/server/paginas'
import { contexto, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST — duplicar a página (com as subpáginas). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Página inválida.' })
  return responder('NOTAS_DUPLICAR_FAILED', () => duplicarPagina(ctx, id))
}
