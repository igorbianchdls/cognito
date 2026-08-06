import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { closeErpPeriod, listErpPeriodClosures, reopenErpPeriod } from '@/products/erp/server/erpPeriodRepository'
import { periodCloseSchema, periodReopenSchema } from '@/products/erp/shared/professionalContracts'

export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try { return NextResponse.json({ records: await listErpPeriodClosures(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const values = await parseErpBody(request, periodCloseSchema)
    return NextResponse.json({ record: await closeErpPeriod({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}

export async function PATCH(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const values = await parseErpBody(request, periodReopenSchema)
    return NextResponse.json({ record: await reopenErpPeriod({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, id: values.id }) })
  } catch (error) { return erpErrorResponse(error) }
}
