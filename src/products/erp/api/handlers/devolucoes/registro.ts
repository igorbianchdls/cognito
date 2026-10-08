import { NextResponse } from 'next/server'
import { getSaleReturn } from '../../../server/erpReturnsRepository'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiAccess } from '../../http/access'
import { withErpHttp } from '../../http/handler'

type Context = { params: Promise<{ id: string }> }
async function handleGET(_request: Request, context: Context) {
  const access = await resolveErpApiAccess('erp.vendas.visualizar')
  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) throw new ErpDomainError('NOT_FOUND', 'Devolução não encontrada.', 404)
  return NextResponse.json(await getSaleReturn(access.tenantId, id))
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/devolucoes/[id]' })
