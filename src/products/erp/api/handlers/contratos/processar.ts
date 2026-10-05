import { contractExecutionBody } from '../../contracts/routineExecution'
import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, parseErpBody, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { processDueSalesContracts } from '@/products/erp/server/erpManagementRepository'

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request, contractExecutionBody)
    return NextResponse.json(await processDueSalesContracts({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, until: body.ate }))
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/contratos/processar","authentication":"session","maxBodyBytes":1048576})
