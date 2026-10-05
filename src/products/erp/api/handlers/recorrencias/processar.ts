import { recurrenceExecutionBody } from '../../contracts/routineExecution'
import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, parseErpBody, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { processErpFinancialRecurrences } from '@/products/erp/server/erpRepository'

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request, recurrenceExecutionBody)
    return NextResponse.json(await processErpFinancialRecurrences({
      tenantId: tenant.tenantId,
      actorId: tenant.sharedUserId,
      throughDate: body.ate,
      limit: body.limite,
    }))
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/recorrencias/processar","authentication":"session","maxBodyBytes":1048576})
