import { NextResponse } from 'next/server'

import { runQuery } from '@/lib/postgres'
import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { runErpAutomation } from '@/products/erp/server/erpProfessionalRepository'
import { automationRunSchema } from '@/products/erp/shared/professionalContracts'

export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const records = await runQuery(`SELECT id::text, tipo, competencia, status, tentativas, resultado, erro, iniciado_em, finalizado_em FROM erp.execucoes_automacao WHERE tenant_id = $1 ORDER BY criado_em DESC LIMIT 100`, [tenant.tenantId])
    return NextResponse.json({ records })
  } catch (error) { return erpErrorResponse(error) }
}

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const values = await parseErpBody(request, automationRunSchema)
    return NextResponse.json({ result: await runErpAutomation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}

