import { readErpIdempotencyKey } from '../../../shared/erpTransport'
import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { receivePurchaseItems } from '@/products/erp/server/erpProfessionalRepository'
import { partialStockActionSchema } from '@/products/erp/shared/professionalContracts'

 async function handlePOST(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.compras.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const [{ id }, values] = await Promise.all([context.params, parseErpBody(request, partialStockActionSchema)])
    return NextResponse.json(await receivePurchaseItems({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, purchaseId: Number(id), values, idempotencyKey: readErpIdempotencyKey(request.headers) || crypto.randomUUID() }))
  } catch (error) { return erpErrorResponse(error) }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/compras/[id]/receber","authentication":"session","maxBodyBytes":1048576})
