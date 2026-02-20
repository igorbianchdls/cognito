import { createCrFromPedido } from '@/inngest/vendas'
import { emitCriticalEvent } from '@/products/erp/backend/shared/events/outbox'

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
    const eventDispatch = await emitCriticalEvent({
      eventName: 'financeiro/contas_a_receber/criada',
      payload: { conta_receber_id: result.crId },
      origin: 'financeiro.contas_receber',
      originId: result.crId,
    })
    return Response.json({
      success: true,
      cr_id: result.crId,
      event_sent: eventDispatch.sent,
      event_outbox_id: eventDispatch.outboxId,
      event_outbox_status: eventDispatch.status,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
