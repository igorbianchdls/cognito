import { contexto, json, responder } from '@/products/editor/server/http'
import { pedirIa } from '@/products/editor/server/ia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** POST { pedido, projeto, historico }: as ações da linha do tempo que atendem o pedido e a resposta para a pessoa. */
export async function POST(request: Request) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const corpo = await request.json().catch(() => null) as { pedido?: string; projeto?: unknown; historico?: { de: 'voce' | 'ia'; texto: string }[] } | null
  if (!corpo?.pedido?.trim() || !corpo.projeto) return json(400, { erro: 'Escreva o pedido.' })
  if (JSON.stringify(corpo.projeto).length > 200_000) return json(413, { erro: 'Projeto grande demais para a IA.' })
  return responder('ia', () => pedirIa(corpo.pedido!, corpo.projeto, Array.isArray(corpo.historico) ? corpo.historico : []))
}
