import { NextResponse } from 'next/server'
import { erpReadService } from '../../../server/erpReadService'
import { createFinancialTitle } from '../../../server/erpFinancialTitles'
import { readErpIdempotencyKey } from '../../../shared/erpTransport'
import { readFinancialSide, financialTitleBody } from '../../contracts/financialTitles'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

type Context = { params: Promise<{ side: string }> }
async function handleGET(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.financeiro.visualizar')
  const side = readFinancialSide((await context.params).side), params = new URL(request.url).searchParams
  const filters = Object.fromEntries(['status','vencimento_inicio','vencimento_fim'].filter(key => params.get(key)).map(key => [key, params.get(key)!]))
  return NextResponse.json(await erpReadService.page(access.tenantId, side === 'pagar' ? 'contas-a-pagar' : 'contas-a-receber', {
    page: Number(params.get('page') || 1), pageSize: Number(params.get('pageSize') || 20), query: params.get('query') || '', filters,
  }))
}
async function handlePOST(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.financeiro.gerenciar'), side = readFinancialSide((await context.params).side)
  const key = readErpIdempotencyKey(request.headers, true)!, body = await parseErpBody(request, financialTitleBody(side))
  const result = await createFinancialTitle({ tenantId: access.tenantId, actorId: access.sharedUserId, side, key, values: body.values })
  return NextResponse.json(result, { status: result.reused ? 200 : 201, headers: { ETag: `"${result.versao}"` } })
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/titulos/[side]' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/titulos/[side]' })
