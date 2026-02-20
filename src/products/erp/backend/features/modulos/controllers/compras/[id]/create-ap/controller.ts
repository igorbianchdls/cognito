import { createApFromCompra } from '@/inngest/compras'
import { emitCriticalEvent } from '@/products/erp/backend/shared/events/outbox'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // Expect: /api/modulos/compras/:id/create-ap
    const idParam = parts[parts.length - 2]
    const compraId = Number(idParam)
    if (!Number.isFinite(compraId)) {
      return Response.json({ success: false, message: 'id inválido' }, { status: 400 })
    }
    const result = await createApFromCompra(compraId)
    const eventDispatch = await emitCriticalEvent({
      eventName: 'financeiro/contas_a_pagar/criada',
      payload: {
        conta_pagar_id: result.apId,
        subtipo: 'principal',
      },
      origin: 'financeiro.contas_pagar',
      originId: result.apId,
    })

    return Response.json({
      success: true,
      ap_id: result.apId,
      event_sent: eventDispatch.sent,
      event_outbox_id: eventDispatch.outboxId,
      event_outbox_status: eventDispatch.status,
    })
  } catch (error) {
    console.error('🧾 API /api/modulos/compras/[id]/create-ap error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
