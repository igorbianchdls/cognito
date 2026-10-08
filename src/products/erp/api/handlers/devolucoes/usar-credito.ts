import { NextResponse } from 'next/server'
import { z } from 'zod'
import { useCustomerCredit } from '../../../server/erpReturnsRepository'
import { creditUseSchema } from '../../../shared/commercialPolicyContracts'
import { readErpIdempotencyKey } from '../../../shared/erpTransport'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

type Context = { params: Promise<{ id: string }> }
// Usa o crédito da devolução numa parcela a receber do mesmo cliente (baixa sem dinheiro).
async function handlePOST(request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.financeiro.baixar')
  const returnId = Number((await context.params).id)
  if (!Number.isInteger(returnId) || returnId <= 0) throw new ErpDomainError('NOT_FOUND', 'Devolução não encontrada.', 404)
  const key = readErpIdempotencyKey(request.headers, true)!
  const body = await parseErpBody(request, z.object({ values: creditUseSchema }).strict())
  return NextResponse.json(await useCustomerCredit({ tenantId: access.tenantId, actorId: access.sharedUserId, returnId, idempotencyKey: key, values: body.values }))
}
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/devolucoes/[id]/usar-credito' })
