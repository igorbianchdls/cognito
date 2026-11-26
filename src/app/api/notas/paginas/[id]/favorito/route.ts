import { favoritar } from '@/products/notas/server/paginas'
import { contexto, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }
async function marcar(id: string, favorita: boolean) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  if (!UUID.test(id)) return json(400, { erro: 'Página inválida.' })
  return responder('NOTAS_FAVORITE_FAILED', () => favoritar(ctx, id, favorita))
}
/** PUT — favorita; DELETE — tira dos favoritos. */
export async function PUT(_request: Request, { params }: Params) { return marcar((await params).id, true) }
export async function DELETE(_request: Request, { params }: Params) { return marcar((await params).id, false) }
