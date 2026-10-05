import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { attendStockForSale } from '@/products/erp/server/erpStockRepository'

 async function handlePOST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const { id } = await context.params
    return NextResponse.json(await attendStockForSale({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, saleId: Number(id) }))
  } catch (error) { return erpErrorResponse(error) }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/vendas/[id]/atender","authentication":"session","maxBodyBytes":1048576})
