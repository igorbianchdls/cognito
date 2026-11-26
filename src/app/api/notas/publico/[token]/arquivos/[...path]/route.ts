import { arquivoPublico } from '@/products/notas/server/publico'
import { NotasError } from '@/products/notas/server/db'
import { json } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — imagem ou arquivo usado numa página publicada (redireciona para uma URL assinada curta). */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string; path: string[] }> }) {
  const { token, path } = await params
  try {
    const url = await arquivoPublico(token, path.map(decodeURIComponent).join('/'))
    return url ? Response.redirect(url, 302) : json(404, { erro: 'Arquivo não encontrado.' })
  } catch (error) {
    if (error instanceof NotasError) return json(error.status, { erro: error.message })
    return json(500, { erro: 'Não foi possível abrir o arquivo.' })
  }
}
