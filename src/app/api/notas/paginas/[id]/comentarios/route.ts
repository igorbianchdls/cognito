import { comentar, listarComentarios } from '@/products/notas/server/comentarios'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** GET — comentários da página (discussões e respostas). */
export async function GET(_request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Página inválida.' })
  return responder('NOTAS_COMMENTS_FAILED', () => listarComentarios(ctx, id))
}

/** POST { texto, discussao_id?, bloco_id?, trecho? } — comentar ou responder. */
export async function POST(request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<{ texto?: unknown; discussao_id?: unknown; bloco_id?: unknown; trecho?: unknown }>(request)
  if (!UUID.test(id) || !body || typeof body.texto !== 'string' || (body.discussao_id != null && (typeof body.discussao_id !== 'string' || !UUID.test(body.discussao_id)))
    || (body.bloco_id != null && (typeof body.bloco_id !== 'string' || body.bloco_id.length > 100)) || (body.trecho != null && typeof body.trecho !== 'string')) {
    return json(400, { erro: 'Parâmetros inválidos.' })
  }
  return responder('NOTAS_COMMENT_CREATE_FAILED', () => comentar(ctx, id, body as never), 201)
}
