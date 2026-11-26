import { alterarBase, obterBase } from '@/products/notas/server/bases'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** GET — a base (esquema e visões) com os itens; ?sem_itens=1 só a base (página de um item). */
export async function GET(request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Base inválida.' })
  return responder('NOTAS_BASE_GET_FAILED', () => obterBase(ctx, id, new URL(request.url).searchParams.get('sem_itens') === '1'))
}

/** PATCH { esquema?, visoes? } — propriedades e visões (os valores dos itens são convertidos quando o tipo muda). */
export async function PATCH(request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<{ esquema?: unknown; visoes?: unknown }>(request)
  if (!UUID.test(id) || !body || (body.esquema === undefined && body.visoes === undefined) || JSON.stringify(body).length > 1_000_000) return json(400, { erro: 'Parâmetros inválidos.' })
  return responder('NOTAS_BASE_UPDATE_FAILED', () => alterarBase(ctx, id, body))
}
