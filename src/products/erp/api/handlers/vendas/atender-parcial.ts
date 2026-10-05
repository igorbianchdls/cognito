import { readErpIdempotencyKey } from '../../../shared/erpTransport'
import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { attendSaleItems } from '@/products/erp/server/erpProfessionalRepository'
import { partialStockActionSchema } from '@/products/erp/shared/professionalContracts'

 async function handlePOST(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const [{ id }, values] = await Promise.all([context.params, parseErpBody(request, partialStockActionSchema)])
    return NextResponse.json(await attendSaleItems({
      tenantId: tenant.tenantId,
      actorId: tenant.sharedUserId,
      saleId: Number(id),
      values,
      idempotencyKey: readErpIdempotencyKey(request.headers) || crypto.randomUUID(),
    }))
  } catch (error) { return erpErrorResponse(error) }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/vendas/[id]/atender-parcial","authentication":"session","maxBodyBytes":1048576})
