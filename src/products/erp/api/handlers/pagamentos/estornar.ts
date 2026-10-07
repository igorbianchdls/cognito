import { readErpIdempotencyKey } from '../../../shared/erpTransport'
import { reversePaymentBody } from '../../contracts/routineExecution'
import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, parseErpBody, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { reverseErpPayment } from '@/products/erp/server/erpRepository'

type RouteContext = {
  params: Promise<{ id: string }>
}

 async function handlePOST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const paymentId = Number(id)
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return erpFailure('Pagamento inválido.', 400)
  }

  const tenant = await resolveErpAccess('erp.financeiro.estornar')
  if (!tenant) return erpFailure('Acesso negado.', 403)

  try {
    const body = await parseErpBody(request, reversePaymentBody)
    const result = await reverseErpPayment({
      actorId: tenant.sharedUserId,
      id: paymentId,
      idempotencyKey: readErpIdempotencyKey(request.headers),
      reason: typeof body.motivo === 'string' ? body.motivo : null,
      tenantId: tenant.tenantId,
    })
    return NextResponse.json(result)
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/pagamentos/[id]/estornar","authentication":"session","maxBodyBytes":1048576})
