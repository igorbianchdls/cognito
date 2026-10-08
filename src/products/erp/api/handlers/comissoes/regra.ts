import { NextResponse } from 'next/server'
import { z } from 'zod'
import { deleteCommissionRule, saveCommissionRule } from '../../../server/erpCommercialRepository'
import { commissionRuleSchema } from '../../../shared/commercialPolicyContracts'
import { erpVersionSchema } from '../../../shared/erpTransport'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

type Context = { params: Promise<{ id: string }> }
async function readId(context: Context) {
  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) throw new ErpDomainError('NOT_FOUND', 'Regra de comissão não encontrada.', 404)
  return id
}
async function handlePATCH(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.vendas.gerenciar'), id = await readId(context)
  const body = await parseErpBody(request, z.object({ expectedVersion: erpVersionSchema, values: commissionRuleSchema }).strict())
  return NextResponse.json(await saveCommissionRule({ tenantId: access.tenantId, actorId: access.sharedUserId, id, expectedVersion: body.expectedVersion, values: body.values }))
}
async function handleDELETE(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.vendas.gerenciar'), id = await readId(context)
  const body = await parseErpBody(request, z.object({ expectedVersion: erpVersionSchema }).strict())
  return NextResponse.json(await deleteCommissionRule({ tenantId: access.tenantId, actorId: access.sharedUserId, id, expectedVersion: body.expectedVersion }))
}
export const PATCH = withErpHttp(handlePATCH, { operation: 'PATCH /api/erp/comissoes/regras/[id]' })
export const DELETE = withErpHttp(handleDELETE, { operation: 'DELETE /api/erp/comissoes/regras/[id]' })
