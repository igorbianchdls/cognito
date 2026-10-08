import { NextResponse } from 'next/server'
import { z } from 'zod'
import { payCommissions } from '../../../server/erpCommercialRepository'
import { commissionPaymentSchema } from '../../../shared/commercialPolicyContracts'
import { readErpIdempotencyKey } from '../../../shared/erpTransport'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

// Gera a conta a pagar das comissões liberadas do vendedor até a data (Idempotency-Key obrigatória).
async function handlePOST(request: Request) {
  const access = await resolveErpApiAccess('erp.financeiro.gerenciar')
  const key = readErpIdempotencyKey(request.headers, true)!
  const body = await parseErpBody(request, z.object({ values: commissionPaymentSchema }).strict())
  const result = await payCommissions({ tenantId: access.tenantId, actorId: access.sharedUserId, idempotencyKey: key, values: body.values })
  return NextResponse.json(result, { status: 'repetido' in result ? 200 : 201 })
}
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/comissoes/pagar' })
