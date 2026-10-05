import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { listReconciliationRules, saveReconciliationRule } from '@/products/erp/server/erpProfessionalRepository'
import { reconciliationRuleSchema } from '@/products/erp/shared/professionalContracts'

 async function handleGET() {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try { return NextResponse.json({ records: await listReconciliationRules(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const values = await parseErpBody(request, reconciliationRuleSchema)
    return NextResponse.json({ record: await saveReconciliationRule({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, values }) })
  } catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/conciliacao/regras","authentication":"session","maxBodyBytes":1048576})
export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/conciliacao/regras","authentication":"session","maxBodyBytes":1048576})
