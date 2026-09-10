import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { processErpFinancialRecurrences } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await request.json().catch(() => ({})) as { ate?: string; limite?: number }
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
