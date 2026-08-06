import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { listReconciliationRules, saveReconciliationRule } from '@/products/erp/server/erpProfessionalRepository'
import { reconciliationRuleSchema } from '@/products/erp/shared/professionalContracts'

export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try { return NextResponse.json({ records: await listReconciliationRules(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const values = await parseErpBody(request, reconciliationRuleSchema)
    return NextResponse.json({ record: await saveReconciliationRule({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, values }) })
  } catch (error) { return erpErrorResponse(error) }
}

