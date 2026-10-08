import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listPriceTables, savePriceTable } from '../../../server/erpCommercialRepository'
import { priceTableSchema } from '../../../shared/commercialPolicyContracts'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.cadastros.visualizar'), params = new URL(request.url).searchParams
  return NextResponse.json(await listPriceTables(access.tenantId, { page: Number(params.get('page') || 1), pageSize: Number(params.get('pageSize') || 20), query: params.get('query') || '' }))
}
async function handlePOST(request: Request) {
  const access = await resolveErpApiAccess('erp.cadastros.gerenciar')
  const body = await parseErpBody(request, z.object({ values: priceTableSchema }).strict())
  return NextResponse.json(await savePriceTable({ tenantId: access.tenantId, actorId: access.sharedUserId, values: body.values }), { status: 201 })
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/tabelas-preco' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/tabelas-preco' })
