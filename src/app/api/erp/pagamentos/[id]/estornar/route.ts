import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { reverseErpPayment } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const paymentId = Number(id)
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return erpFailure('Pagamento invalido.', 400)
  }

  const tenant = await resolveErpAccess('erp.financeiro.estornar')
  if (!tenant) return erpFailure('Acesso negado.', 403)

  try {
    const body = (await request.json().catch(() => ({}))) as { motivo?: unknown }
    const result = await reverseErpPayment({
      actorId: tenant.sharedUserId,
      id: paymentId,
      idempotencyKey: request.headers.get('idempotency-key') || undefined,
      reason: typeof body.motivo === 'string' ? body.motivo : null,
      tenantId: tenant.tenantId,
    })
    return NextResponse.json(result)
  } catch (error) {
    return erpFailureResponse(error)
  }
}
