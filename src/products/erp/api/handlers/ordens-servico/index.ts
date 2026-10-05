import { withErpHttp } from '@/products/erp/api/http/handler'
import { readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { createServiceOrder, listServiceOrders } from '@/products/erp/server/erpProfessionalRepository'
import { serviceOrderCreateSchema } from '@/products/erp/shared/professionalContracts'

 async function handleGET(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const url = new URL(request.url)
    return NextResponse.json({ records: await listServiceOrders({ tenantId: tenant.tenantId, query: url.searchParams.get('query') || '', status: url.searchParams.get('status') || '' }) })
  } catch (error) { return erpErrorResponse(error) }
}

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const values = await parseErpBody(request, serviceOrderCreateSchema)
    const record = await createServiceOrder({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, values, idempotencyKey: readErpIdempotencyKey(request.headers,true) })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/ordens-servico","authentication":"session","maxBodyBytes":1048576})
export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/ordens-servico","authentication":"session","maxBodyBytes":1048576})
