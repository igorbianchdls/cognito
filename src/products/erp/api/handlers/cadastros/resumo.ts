import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { getErpEntitySummary } from '@/products/erp/server/erpRepository'
import { getErpModuleCapability, isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

 async function handleGET(_request: Request, context: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await context.params
  if (!isErpConnectedModuleId(entityId)) return erpFailure('Modulo ERP nao encontrado.', 404)
  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'read'))
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    return NextResponse.json(await getErpEntitySummary(tenant.tenantId, entityId))
  } catch (error) {
    return erpErrorResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/[entityId]/resumo","authentication":"session","maxBodyBytes":1048576})
