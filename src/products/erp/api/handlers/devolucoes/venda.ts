import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSaleReturn, listSaleReturns } from '../../../server/erpReturnsRepository'
import { saleReturnSchema } from '../../../shared/commercialPolicyContracts'
import { readErpIdempotencyKey } from '../../../shared/erpTransport'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

type Context = { params: Promise<{ id: string }> }
async function readSaleId(context: Context) {
  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) throw new ErpDomainError('NOT_FOUND', 'Venda não encontrada.', 404)
  return id
}
// Devoluções da venda.
async function handleGET(_request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.vendas.visualizar')
  return NextResponse.json(await listSaleReturns(access.tenantId, { vendaId: await readSaleId(context), pageSize: 100 }))
}
// Registra a devolução (Idempotency-Key obrigatória). O tratamento financeiro exige também a permissão financeira.
async function handlePOST(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.vendas.gerenciar'), saleId = await readSaleId(context)
  const key = readErpIdempotencyKey(request.headers, true)!
  const body = await parseErpBody(request, z.object({ values: saleReturnSchema }).strict())
  const result = await createSaleReturn({ tenantId: access.tenantId, actorId: access.sharedUserId, saleId, idempotencyKey: key, values: body.values })
  return NextResponse.json(result, { status: 'repetido' in result ? 200 : 201 })
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/vendas/[id]/devolucoes' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/vendas/[id]/devolucoes' })
