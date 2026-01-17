import { createCrFromPedido } from '@/inngest/vendas'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // Path: /api/modulos/vendas/pedidos/{id}/create-cr -> id is the penultimate segment
    const idStr = parts[parts.length - 2] || ''
    const pedidoId = Number(idStr)
    if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
      return Response.json({ success: false, message: 'pedido_id inválido' }, { status: 400 })
    }
    const result = await createCrFromPedido(pedidoId)
    return Response.json({ success: true, cr_id: result.crId })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

