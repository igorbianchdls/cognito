import { criarItem } from '@/products/notas/server/bases'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { titulo?, propriedades?, posicao? } — item novo na base. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<{ titulo?: unknown; propriedades?: unknown; posicao?: unknown }>(request) ?? {}
  if (!UUID.test(id) || (body.titulo != null && typeof body.titulo !== 'string') || (body.posicao != null && !Number.isFinite(body.posicao))
    || (body.propriedades != null && (typeof body.propriedades !== 'object' || Array.isArray(body.propriedades)))) return json(400, { erro: 'Parâmetros inválidos.' })
  return responder('NOTAS_ITEM_CREATE_FAILED', () => criarItem(ctx, id, body as never), 201)
}
