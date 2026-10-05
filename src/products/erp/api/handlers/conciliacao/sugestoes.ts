import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { suggestBankReconciliations } from '@/products/erp/server/erpProfessionalRepository'

 async function handleGET() {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try { return NextResponse.json({ records: await suggestBankReconciliations(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/conciliacao/sugestoes","authentication":"session","maxBodyBytes":1048576})
