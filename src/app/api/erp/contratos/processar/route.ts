import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { processDueSalesContracts } from '@/products/erp/server/erpManagementRepository'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = (await request.json().catch(() => ({}))) as { ate?: string }
    return NextResponse.json(await processDueSalesContracts({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, until: body.ate }))
  } catch (error) {
    return erpFailureResponse(error)
  }
}
