import { readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'
import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { createServiceOrder, listServiceOrders } from '@/products/erp/server/erpProfessionalRepository'
import { serviceOrderCreateSchema } from '@/products/erp/shared/professionalContracts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const url = new URL(request.url)
    return NextResponse.json({ records: await listServiceOrders({ tenantId: tenant.tenantId, query: url.searchParams.get('query') || '', status: url.searchParams.get('status') || '' }) })
  } catch (error) { return erpErrorResponse(error) }
}

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const values = await parseErpBody(request, serviceOrderCreateSchema)
    const record = await createServiceOrder({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, values, idempotencyKey: readErpIdempotencyKey(request.headers,true) })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) { return erpErrorResponse(error) }
}
