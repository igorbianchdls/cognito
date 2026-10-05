import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { listAutomationExecutions } from '../../../server/erpAutomationSchedule'
import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { runErpAutomation } from '@/products/erp/server/erpProfessionalRepository'
import { automationRunSchema } from '@/products/erp/shared/professionalContracts'

 async function handleGET(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const page=Math.max(1,Math.min(10000,Math.floor(Number(new URL(request.url).searchParams.get('page')))||1))
    return NextResponse.json(await listAutomationExecutions(tenant.tenantId,page))
  } catch (error) { return erpErrorResponse(error) }
}

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const values = await parseErpBody(request, automationRunSchema)
    return NextResponse.json({ result: await runErpAutomation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/automacoes","authentication":"session","maxBodyBytes":1048576})
export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/automacoes","authentication":"session","maxBodyBytes":1048576})
