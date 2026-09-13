import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { runQuery } from '@/lib/postgres'
import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { runErpAutomation } from '@/products/erp/server/erpProfessionalRepository'
import { automationRunSchema } from '@/products/erp/shared/professionalContracts'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const page=Math.max(1,Math.min(10000,Math.floor(Number(new URL(request.url).searchParams.get('page')))||1))
    const records = await runQuery(`SELECT id::text, tipo, competencia, status, tentativas, resultado, erro, iniciado_em, finalizado_em,historico_estados,evento_cobranca_id::text FROM erp.execucoes_automacao WHERE tenant_id = $1 ORDER BY criado_em DESC,id DESC LIMIT 31 OFFSET $2`, [tenant.tenantId,(page-1)*30])
    return NextResponse.json({ records:records.slice(0,30),hasMore:records.length>30 },{headers:{'Cache-Control':'no-store'}})
  } catch (error) { return erpErrorResponse(error) }
}

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const values = await parseErpBody(request, automationRunSchema)
    return NextResponse.json({ result: await runErpAutomation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}
