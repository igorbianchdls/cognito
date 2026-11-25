import { cancelarVideo, excluirVideo, obterVideo, salvarVideo } from '@/products/marketing/server/videos'
import { contexto, falha, respostaJson, UUID } from '@/products/marketing/server/videosHttp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** GET — um vídeo (a tela consulta enquanto ele está sendo gerado). */
export async function GET(request: Request, { params }: Params) {
  const ctx = await contexto(request)
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return respostaJson(400, { erro: 'Vídeo inválido.' })
  try { return respostaJson(200, { video: await obterVideo(ctx, id) }) } catch (error) { return falha(error, 'VIDEO_GET_FAILED') }
}

/** PATCH { acao: 'salvar' | 'tirar_dos_salvos' | 'cancelar' } */
export async function PATCH(request: Request, { params }: Params) {
  const ctx = await contexto(request)
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await request.json().catch(() => null) as { acao?: unknown } | null
  if (!UUID.test(id) || !body || !['salvar', 'tirar_dos_salvos', 'cancelar'].includes(String(body.acao))) return respostaJson(400, { erro: 'Parâmetros inválidos.' })
  try {
    if (body.acao === 'cancelar') await cancelarVideo(ctx, id)
    else await salvarVideo(ctx, id, body.acao === 'salvar')
    return respostaJson(200, { video: await obterVideo(ctx, id) })
  } catch (error) { return falha(error, 'VIDEO_UPDATE_FAILED') }
}

/** DELETE — exclui da galeria. */
export async function DELETE(request: Request, { params }: Params) {
  const ctx = await contexto(request)
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return respostaJson(400, { erro: 'Vídeo inválido.' })
  try { await excluirVideo(ctx, id); return respostaJson(200, { ok: true }) } catch (error) { return falha(error, 'VIDEO_DELETE_FAILED') }
}
