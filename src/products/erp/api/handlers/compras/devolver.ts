import { z } from 'zod'
import { withErpHttp } from '../../http/handler'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { returnErpPurchase } from '../../../server/erpRepository'
import { erpIdempotencyKeySchema, erpVersionSchema } from '../../../shared/erpTransport'

export const POST = withErpHttp(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const access = await resolveErpApiAccess('erp.compras.gerenciar')
  await resolveErpApiAccess('erp.financeiro.gerenciar')
  await resolveErpApiAccess('erp.estoque.movimentar')
  const id = z.coerce.number().int().positive().safe().parse((await context.params).id)
  const body = await parseErpBody(request, z.object({ expectedVersion: erpVersionSchema, motivo: z.string().trim().min(3).max(1000) }).strict())
  return Response.json(await returnErpPurchase({ tenantId: access.tenantId, actorId: access.sharedUserId, id, ...body, idempotencyKey: erpIdempotencyKeySchema.parse(request.headers.get('Idempotency-Key')) }))
}, { operation: 'POST /api/erp/compras/[id]/devolver' })
