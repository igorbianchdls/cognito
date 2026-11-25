import { gerarVideo, listarVideos, type Aba } from '@/products/marketing/server/videos'
import { contexto, falha, respostaJson } from '@/products/marketing/server/videosHttp'
import { MODELOS_VIDEO, type SituacaoVideo } from '@/products/marketing/shared/videoModels'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ABAS: Aba[] = ['todos', 'salvos', 'meus']
const SITUACOES: SituacaoVideo[] = ['na_fila', 'gerando', 'pronto', 'erro', 'cancelado']
const FORMATOS = ['16:9', '9:16', '1:1']

/** GET ?aba=todos|salvos|meus&modelo=&formato=&situacao=&inicio= — página de vídeos da empresa e a cota do mês. */
export async function GET(request: Request) {
  const ctx = await contexto(request)
  if (ctx instanceof Response) return ctx
  const q = new URL(request.url).searchParams
  const aba = (q.get('aba') || 'todos') as Aba, modelo = q.get('modelo') || undefined, formato = q.get('formato') || undefined
  const situacao = (q.get('situacao') || undefined) as SituacaoVideo | undefined, inicio = Number(q.get('inicio') || 0)
  if (!ABAS.includes(aba) || (modelo && !MODELOS_VIDEO.some(m => m.id === modelo)) || (formato && !FORMATOS.includes(formato))
    || (situacao && !SITUACOES.includes(situacao)) || !Number.isSafeInteger(inicio) || inicio < 0) return respostaJson(400, { erro: 'Parâmetros inválidos.' })
  try {
    return respostaJson(200, await listarVideos(ctx, { aba, modelo, formato, situacao, inicio }))
  } catch (error) { return falha(error, 'VIDEOS_LIST_FAILED') }
}

/** POST { prompt, modelo, formato, duracao, estilo, referenciaPath? } — gera um vídeo. */
export async function POST(request: Request) {
  const ctx = await contexto(request)
  if (ctx instanceof Response) return ctx
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.prompt !== 'string' || typeof body.modelo !== 'string' || typeof body.formato !== 'string'
    || typeof body.duracao !== 'number' || typeof body.estilo !== 'string' || (body.referenciaPath != null && typeof body.referenciaPath !== 'string')) {
    return respostaJson(400, { erro: 'Parâmetros inválidos.' })
  }
  try {
    const video = await gerarVideo(ctx, { prompt: body.prompt, modelo: body.modelo, formato: body.formato, duracao: body.duracao,
      estilo: body.estilo, referenciaPath: body.referenciaPath as string | null | undefined })
    return respostaJson(201, { video })
  } catch (error) { return falha(error, 'VIDEO_CREATE_FAILED') }
}
