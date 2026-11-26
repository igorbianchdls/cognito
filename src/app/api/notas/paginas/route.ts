import { criarPagina } from '@/products/notas/server/paginas'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { parent_id?, espaco?, titulo?, icone? } — nova página. */
export async function POST(request: Request) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const body = await corpo<{ parent_id?: unknown; espaco?: unknown; titulo?: unknown; icone?: unknown }>(request) ?? {}
  if ((body.parent_id != null && (typeof body.parent_id !== 'string' || !UUID.test(body.parent_id))) || (body.espaco != null && !['equipe', 'particular'].includes(String(body.espaco)))
    || (body.titulo != null && typeof body.titulo !== 'string') || (body.icone != null && typeof body.icone !== 'string')) return json(400, { erro: 'Parâmetros inválidos.' })
  return responder('NOTAS_CREATE_FAILED', () => criarPagina(ctx, body as never), 201)
}
