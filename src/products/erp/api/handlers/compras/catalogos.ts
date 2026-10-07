import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { listErpPurchaseCatalogs } from '@/products/erp/server/erpRepository'

 async function handleGET() {
  const tenant = await resolveErpAccess('erp.compras.visualizar')
  if (!tenant) return erpFailure('Não autenticado.', 401)

  try {
    return NextResponse.json(await listErpPurchaseCatalogs(tenant.tenantId))
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/compras/catalogos","authentication":"session","maxBodyBytes":1048576})
