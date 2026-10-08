import { NextResponse } from 'next/server'
import { z } from 'zod'
import { salesGoalsReport, saveSalesGoal } from '../../../server/erpBudget'
import { erpToday } from '../../../server/erpBusinessDate'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

// Metas de venda: GET atingimento (?inicio&fim); POST define a meta do mês (geral ou por vendedor).
const bodySchema = z.object({ values: z.object({ vendedor_id: z.number().int().positive().nullable().optional(),
  mes: z.string().regex(/^\d{4}-\d{2}/), valor: z.number().positive().max(1e12) }).strict() }).strict()

async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.vendas.visualizar'), params = new URL(request.url).searchParams, today = erpToday()
  return NextResponse.json({ records: await salesGoalsReport(access.tenantId, params.get('inicio') || `${today.slice(0, 4)}-01-01`, params.get('fim') || `${today.slice(0, 4)}-12-31`) })
}
async function handlePOST(request: Request) {
  const access = await resolveErpApiAccess('erp.vendas.gerenciar')
  const body = await parseErpBody(request, bodySchema)
  return NextResponse.json(await saveSalesGoal({ tenantId: access.tenantId, actorId: access.sharedUserId, values: body.values }), { status: 201 })
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/metas-vendas' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/metas-vendas' })
