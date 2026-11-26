import { criarItem } from '@/products/notas/server/bases'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { titulo?, propriedades?, posicao?, modelo_id?, e_modelo? } — item novo na base (a partir de um modelo, ou um modelo novo). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<{ titulo?: unknown; propriedades?: unknown; posicao?: unknown; modelo_id?: unknown; e_modelo?: unknown }>(request) ?? {}
  if (!UUID.test(id) || (body.titulo != null && typeof body.titulo !== 'string') || (body.posicao != null && !Number.isFinite(body.posicao))
    || (body.propriedades != null && (typeof body.propriedades !== 'object' || Array.isArray(body.propriedades)))
    || (body.modelo_id != null && (typeof body.modelo_id !== 'string' || !UUID.test(body.modelo_id))) || (body.e_modelo != null && typeof body.e_modelo !== 'boolean')) return json(400, { erro: 'Parâmetros inválidos.' })
  return responder('NOTAS_ITEM_CREATE_FAILED', () => criarItem(ctx, id, body as never), 201)
}
