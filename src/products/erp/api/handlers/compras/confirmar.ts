import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { confirmErpPurchase } from '@/products/erp/server/erpRepository'

type RouteContext = {
  params: Promise<{ id: string }>
}

 async function handlePOST(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const purchaseId = Number(id)
  if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
    return erpFailure('Compra invalida.', 400)
  }

  const tenant = await resolveErpAccess('erp.compras.gerenciar')
  if (!tenant) {
    return erpFailure('Acesso negado.', 403)
  }

  try {
    const result = await confirmErpPurchase({
      actorId: tenant.sharedUserId,
      id: purchaseId,
      tenantId: tenant.tenantId,
    })

    return NextResponse.json(result)
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/compras/[id]/confirmar","authentication":"session","maxBodyBytes":1048576})
