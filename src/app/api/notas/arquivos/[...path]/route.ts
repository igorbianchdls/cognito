import { podeLer, urlAssinada } from '@/products/notas/server/db'
import { contexto, json } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — confere que o arquivo é da empresa ativa e redireciona para uma URL assinada (uma hora). */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const partes = (await params).path
  if (partes.length !== 3 || partes[0] !== ctx.orgId || partes.some(p => p.includes('..'))) return json(404, { erro: 'Arquivo não encontrado.' })
  if (!(await podeLer(ctx))) return json(403, { erro: 'Você não tem acesso às notas desta empresa.' })
  const url = await urlAssinada(partes.join('/'))
  if (!url) return json(404, { erro: 'Arquivo não encontrado.' })
  return Response.redirect(url, 302)
}
