import { NextResponse } from 'next/server'
import { readFinancialTitleWithVersion, changeFinancialTitle } from '../../../server/erpFinancialTitles'
import { readFinancialSide, financialTitleBody, financialTitleDeleteBody, readTitlePrecondition } from '../../contracts/financialTitles'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

type Context = { params: Promise<{ side: string; id: string }> }
async function handleGET(_request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.financeiro.visualizar'), { side: rawSide, id } = await context.params
  const result = await readFinancialTitleWithVersion({ tenantId: access.tenantId, actorId: access.sharedUserId, side: readFinancialSide(rawSide), id: Number(id) })
  return NextResponse.json(result, { headers: { ETag: `"${result.versao}"` } })
}
async function handlePATCH(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.financeiro.gerenciar'), { side: rawSide, id } = await context.params, side = readFinancialSide(rawSide)
  const expected = readTitlePrecondition(request.headers), body = await parseErpBody(request, financialTitleBody(side, true))
  const result = await changeFinancialTitle({ tenantId: access.tenantId, actorId: access.sharedUserId, side, id: Number(id), expected, values: body.values })
  return NextResponse.json(result, { headers: { ETag: `"${'versao' in result ? result.versao : ''}"` } })
}
async function handleDELETE(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.financeiro.gerenciar'), { side: rawSide, id } = await context.params
  const expected = readTitlePrecondition(request.headers), body = await parseErpBody(request, financialTitleDeleteBody)
  return NextResponse.json(await changeFinancialTitle({ tenantId: access.tenantId, actorId: access.sharedUserId, side: readFinancialSide(rawSide), id: Number(id), expected, values: body, remove: true }))
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/titulos/[side]/[id]' })
export const PATCH = withErpHttp(handlePATCH, { operation: 'PATCH /api/erp/titulos/[side]/[id]' })
export const DELETE = withErpHttp(handleDELETE, { operation: 'DELETE /api/erp/titulos/[side]/[id]' })
