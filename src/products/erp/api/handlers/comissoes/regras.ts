import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listCommissionRules, saveCommissionRule } from '../../../server/erpCommercialRepository'
import { commissionRuleSchema } from '../../../shared/commercialPolicyContracts'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.vendas.visualizar'), params = new URL(request.url).searchParams
  return NextResponse.json(await listCommissionRules(access.tenantId, { page: Number(params.get('page') || 1), pageSize: Number(params.get('pageSize') || 20) }))
}
async function handlePOST(request: Request) {
  const access = await resolveErpApiAccess('erp.vendas.gerenciar')
  const body = await parseErpBody(request, z.object({ values: commissionRuleSchema }).strict())
  return NextResponse.json(await saveCommissionRule({ tenantId: access.tenantId, actorId: access.sharedUserId, values: body.values }), { status: 201 })
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/comissoes/regras' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/comissoes/regras' })
