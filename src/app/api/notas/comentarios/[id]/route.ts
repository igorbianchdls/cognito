import { alterarComentario, apagarComentario } from '@/products/notas/server/comentarios'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** PATCH { texto?, resolvido? } — editar o próprio comentário ou resolver/reabrir a discussão. */
export async function PATCH(request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<{ texto?: unknown; resolvido?: unknown }>(request)
  if (!UUID.test(id) || !body || (body.texto !== undefined && typeof body.texto !== 'string') || (body.resolvido !== undefined && typeof body.resolvido !== 'boolean')) {
    return json(400, { erro: 'Parâmetros inválidos.' })
  }
  return responder('NOTAS_COMMENT_UPDATE_FAILED', () => alterarComentario(ctx, id, body as never))
}

/** DELETE — apaga o próprio comentário (uma discussão leva as respostas junto). */
export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Comentário inválido.' })
  return responder('NOTAS_COMMENT_DELETE_FAILED', () => apagarComentario(ctx, id))
}
