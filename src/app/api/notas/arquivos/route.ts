import { enviarArquivo } from '@/products/notas/server/paginas'
import { contexto, json, responder } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST (multipart, campo "arquivo") — guarda a imagem ou arquivo e devolve { url } estável. */
export async function POST(request: Request) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const arquivo = (await request.formData().catch(() => null))?.get('arquivo')
  if (!(arquivo instanceof File)) return json(400, { erro: 'Envie um arquivo.' })
  return responder('NOTAS_UPLOAD_FAILED', async () => enviarArquivo(ctx, { nome: arquivo.name, tipo: arquivo.type, conteudo: await arquivo.arrayBuffer() }), 201)
}
