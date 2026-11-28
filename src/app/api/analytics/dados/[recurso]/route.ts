import { contexto, json, responder } from '@/products/analytics/server/http'
import { criar, listar } from '@/products/analytics/server/dados'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type P = { params: Promise<{ recurso: string }> }

/** GET ?propriedade: a lista (sites, insights, paineis, coortes, flags, experimentos). */
export async function GET(request: Request, { params }: P) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { recurso } = await params
  return responder('dados-listar', ctx, async db => ({ itens: await listar(db, recurso, new URL(request.url).searchParams.get('propriedade')) }))
}

/** POST: cria (com property_id para o que é de um site). */
export async function POST(request: Request, { params }: P) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { recurso } = await params
  const corpo = await request.json().catch(() => null)
  if (!corpo || typeof corpo !== 'object') return json(400, { erro: 'Envie os dados.' })
  return responder('dados-criar', ctx, db => criar(db, ctx, recurso, corpo as Record<string, unknown>))
}
