import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { closeErpPeriod, listErpPeriodClosures, reopenErpPeriod } from '@/products/erp/server/erpPeriodRepository'
import { periodCloseSchema, periodReopenSchema } from '@/products/erp/shared/professionalContracts'

 async function handleGET() {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try { return NextResponse.json({ records: await listErpPeriodClosures(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const values = await parseErpBody(request, periodCloseSchema)
    return NextResponse.json({ record: await closeErpPeriod({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}

 async function handlePATCH(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const values = await parseErpBody(request, periodReopenSchema)
    return NextResponse.json({ record: await reopenErpPeriod({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, id: values.id, reason: values.motivo }) })
  } catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/fechamentos","authentication":"session","maxBodyBytes":1048576})
export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/fechamentos","authentication":"session","maxBodyBytes":1048576})
export const PATCH = withErpHttp(handlePATCH, {"operation":"PATCH /api/erp/fechamentos","authentication":"session","maxBodyBytes":1048576})
