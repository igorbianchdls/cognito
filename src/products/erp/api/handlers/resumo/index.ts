import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { getErpOverview } from '@/products/erp/server/erpRepository'

 async function handleGET() {
  const tenant = await resolveErpAccess('erp.relatorios.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    return NextResponse.json(await getErpOverview(tenant.tenantId))
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/resumo","authentication":"session","maxBodyBytes":1048576})
