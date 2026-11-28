import { contexto, json, responder } from '@/products/analytics/server/http'
import { alterar, apagar, ler } from '@/products/analytics/server/dados'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type P = { params: Promise<{ recurso: string; id: string }> }
const UUID = /^[0-9a-f-]{36}$/i

async function com(params: P['params'], fn: (recurso: string, id: string) => (db: Parameters<Parameters<typeof responder>[2]>[0]) => Promise<unknown>, codigo: string) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { recurso, id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Id inválido.' })
  return responder(codigo, ctx, fn(recurso, id))
}

export async function GET(_request: Request, { params }: P) {
  return com(params, (recurso, id) => db => ler(db, recurso, id), 'dados-ler')
}
export async function PATCH(request: Request, { params }: P) {
  const corpo = await request.json().catch(() => null)
  if (!corpo || typeof corpo !== 'object') return json(400, { erro: 'Envie os dados.' })
  return com(params, (recurso, id) => db => alterar(db, recurso, id, corpo as Record<string, unknown>), 'dados-alterar')
}
export async function DELETE(_request: Request, { params }: P) {
  return com(params, (recurso, id) => db => apagar(db, recurso, id), 'dados-apagar')
}
