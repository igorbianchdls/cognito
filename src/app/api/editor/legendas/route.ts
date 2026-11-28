import { contexto, EditorError, json, responder } from '@/products/editor/server/http'
import { transcrever } from '@/products/editor/server/transcricao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** POST (multipart: audio = WAV do trecho, segundos = duração): as palavras faladas, cada uma com início e fim. */
export async function POST(request: Request) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const form = await request.formData().catch(() => null)
  const audio = form?.get('audio')
  const segundos = Number(form?.get('segundos') ?? 0)
  if (!(audio instanceof File) || !(segundos > 0)) return json(400, { erro: 'Envie o trecho de áudio.' })
  return responder('legendas', async () => {
    if (segundos > 120) throw new EditorError('Trecho longo demais.')
    return { palavras: await transcrever(audio, segundos) }
  })
}
