import { criarBase } from '@/products/notas/server/bases'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Pedido = { parent_id?: unknown; espaco?: unknown; titulo?: unknown; modelo?: unknown; visao?: unknown; converter?: unknown; importacao?: unknown }
const id = (v: unknown) => v == null || (typeof v === 'string' && UUID.test(v))

/** POST { parent_id?, espaco?, titulo?, modelo: vazia|tarefas, visao: tabela|quadro|lista, converter? } — base nova (ou transforma a página vazia). */
export async function POST(request: Request) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const body = await corpo<Pedido>(request) ?? {}
  const modelo = body.modelo === 'tarefas' ? 'tarefas' : 'vazia'
  const visao = body.visao === 'quadro' || body.visao === 'lista' || body.visao === 'galeria' || body.visao === 'calendario' ? body.visao : 'tabela'
  if (!id(body.parent_id) || !id(body.converter) || (body.espaco != null && !['equipe', 'particular'].includes(String(body.espaco)))
    || (body.titulo != null && typeof body.titulo !== 'string') || (body.importacao != null && (typeof body.importacao !== 'object' || JSON.stringify(body.importacao).length > 5_000_000))) {
    return json(400, { erro: 'Parâmetros inválidos.' })
  }
  return responder('NOTAS_BASE_CREATE_FAILED', () => criarBase(ctx, { ...(body as object), modelo, visao }), 201)
}
