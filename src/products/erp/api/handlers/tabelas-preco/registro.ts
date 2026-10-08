import { NextResponse } from 'next/server'
import { z } from 'zod'
import { deletePriceTable, getPriceTable, savePriceTable } from '../../../server/erpCommercialRepository'
import { priceTableSchema } from '../../../shared/commercialPolicyContracts'
import { erpVersionSchema } from '../../../shared/erpTransport'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

type Context = { params: Promise<{ id: string }> }
async function readId(context: Context) {
  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) throw new ErpDomainError('NOT_FOUND', 'Tabela de preço não encontrada.', 404)
  return id
}
async function handleGET(_request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.cadastros.visualizar')
  return NextResponse.json(await getPriceTable(access.tenantId, await readId(context)))
}
async function handlePATCH(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.cadastros.gerenciar'), id = await readId(context)
  const body = await parseErpBody(request, z.object({ expectedVersion: erpVersionSchema, values: priceTableSchema }).strict())
  return NextResponse.json(await savePriceTable({ tenantId: access.tenantId, actorId: access.sharedUserId, id, expectedVersion: body.expectedVersion, values: body.values }))
}
async function handleDELETE(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.cadastros.gerenciar'), id = await readId(context)
  const body = await parseErpBody(request, z.object({ expectedVersion: erpVersionSchema }).strict())
  return NextResponse.json(await deletePriceTable({ tenantId: access.tenantId, actorId: access.sharedUserId, id, expectedVersion: body.expectedVersion }))
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/tabelas-preco/[id]' })
export const PATCH = withErpHttp(handlePATCH, { operation: 'PATCH /api/erp/tabelas-preco/[id]' })
export const DELETE = withErpHttp(handleDELETE, { operation: 'DELETE /api/erp/tabelas-preco/[id]' })
