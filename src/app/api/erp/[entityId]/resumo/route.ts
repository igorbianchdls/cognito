import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getErpEntitySummary } from '@/products/erp/server/erpRepository'
import { getErpModuleCapability, isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ entityId: string }> }) {
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
