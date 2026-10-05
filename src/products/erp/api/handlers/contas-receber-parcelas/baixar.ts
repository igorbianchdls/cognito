import { withErpHttp } from '@/products/erp/api/http/handler'
import { NextResponse } from 'next/server'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { settleReceivableInstallment } from '@/products/erp/server/erpRepository'
import { ErpDomainError, erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { erpCreateEnvelopeSchema, readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'
type RouteContext = { params: Promise<{ id: string }> }

 async function handlePOST(request: Request, context: RouteContext) {
  try {
    const id = Number((await context.params).id)
    if (!Number.isSafeInteger(id) || id <= 0) throw new ErpDomainError('INVALID_REFERENCE', 'Parcela inválida.')
    const tenant = await resolveErpAccess('erp.financeiro.baixar')
    if (!tenant) throw new ErpDomainError('ACCESS_DENIED', 'Você não tem permissão para registrar pagamentos.', 403)
    const key = readErpIdempotencyKey(request.headers, true)
    const body = await parseErpBody(request, erpCreateEnvelopeSchema)
    return NextResponse.json(await settleReceivableInstallment({
      actorId: tenant.sharedUserId, tenantId: tenant.tenantId, id,
      idempotencyKey: key, values: body.values,
    }))
  } catch (error) { return erpErrorResponse(error) }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/contas-receber-parcelas/[id]/baixar","authentication":"session","maxBodyBytes":1048576})
