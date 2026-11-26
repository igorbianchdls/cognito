import { alterarItem } from '@/products/notas/server/bases'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** PATCH { titulo?, propriedades?, posicao? } — células, nome ou posição de um item de base. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<{ titulo?: unknown; propriedades?: unknown; posicao?: unknown }>(request)
  if (!UUID.test(id) || !body || (body.titulo != null && typeof body.titulo !== 'string') || (body.posicao != null && !Number.isFinite(body.posicao))
    || (body.propriedades != null && (typeof body.propriedades !== 'object' || Array.isArray(body.propriedades)))) return json(400, { erro: 'Parâmetros inválidos.' })
  return responder('NOTAS_ITEM_UPDATE_FAILED', () => alterarItem(ctx, id, body as never))
}
