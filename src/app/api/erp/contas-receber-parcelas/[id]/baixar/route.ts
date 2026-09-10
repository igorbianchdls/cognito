import { NextResponse } from 'next/server'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { settleReceivableInstallment } from '@/products/erp/server/erpRepository'
import { ErpDomainError, erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { erpCreateEnvelopeSchema, readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
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
