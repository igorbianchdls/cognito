import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { processErpFinancialRecurrences } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({})) as { ate?: string; limite?: number }
    return NextResponse.json(await processErpFinancialRecurrences({
      tenantId: tenant.tenantId,
      actorId: tenant.sharedUserId,
      throughDate: body.ate,
      limit: body.limite,
    }))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel processar recorrencias.' }, { status: 400 })
  }
}
