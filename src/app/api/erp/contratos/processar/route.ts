import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { processDueSalesContracts } from '@/products/erp/server/erpManagementRepository'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = (await request.json().catch(() => ({}))) as { ate?: string }
    return NextResponse.json(await processDueSalesContracts({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, until: body.ate }))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel processar os contratos.' }, { status: 400 })
  }
}
