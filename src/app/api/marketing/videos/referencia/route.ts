import { enviarReferencia } from '@/products/marketing/server/videos'
import { contexto, falha, respostaJson } from '@/products/marketing/server/videosHttp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST (multipart, campo "imagem") — guarda a imagem de referência e devolve { path, url }. */
export async function POST(request: Request) {
  const ctx = await contexto(request)
  if (ctx instanceof Response) return ctx
  const form = await request.formData().catch(() => null)
  const imagem = form?.get('imagem')
  if (!(imagem instanceof File)) return respostaJson(400, { erro: 'Envie uma imagem.' })
  try {
    return respostaJson(201, await enviarReferencia(ctx, { tipo: imagem.type, conteudo: await imagem.arrayBuffer() }))
  } catch (error) { return falha(error, 'VIDEO_REFERENCE_FAILED') }
}
