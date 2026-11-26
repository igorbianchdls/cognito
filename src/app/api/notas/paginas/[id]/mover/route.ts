import { moverPagina } from '@/products/notas/server/paginas'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { parent_id, espaco, posicao } — move a página (com as subpáginas). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<{ parent_id?: unknown; espaco?: unknown; posicao?: unknown }>(request)
  if (!UUID.test(id) || !body || (body.parent_id !== null && (typeof body.parent_id !== 'string' || !UUID.test(body.parent_id)))
    || !['equipe', 'particular'].includes(String(body.espaco)) || typeof body.posicao !== 'number') return json(400, { erro: 'Parâmetros inválidos.' })
  return responder('NOTAS_MOVE_FAILED', () => moverPagina(ctx, id, { parent_id: body.parent_id as string | null, espaco: body.espaco as 'equipe' | 'particular', posicao: body.posicao as number }))
}
