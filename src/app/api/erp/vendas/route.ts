import { erpCreateEnvelopeSchema, readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'
import { parseErpBody } from '@/products/erp/server/erpApi'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { createErpEntityRecord, listErpEntityPage } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

function parseFilters(searchParams: URLSearchParams) {
  const filters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter.')) filters[key.slice('filter.'.length)] = value
  })
  return filters
}

export async function GET(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Nao autenticado.', 401)

  try {
    const url = new URL(request.url)
    const page = await listErpEntityPage({
      entityId: 'pedidos',
      tenantId: tenant.tenantId,
      query: url.searchParams.get('query') || '',
      filters: parseFilters(url.searchParams),
      page: Number(url.searchParams.get('page') || 1),
      pageSize: Number(url.searchParams.get('pageSize') || 50),
    })
    return NextResponse.json(page)
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)

  try {
    const body = await parseErpBody(request,erpCreateEnvelopeSchema)
    const record = await createErpEntityRecord({
      actorId: tenant.sharedUserId,
      entityId: 'pedidos',
      tenantId: tenant.tenantId,
      values: body.values || {},
      idempotencyKey: readErpIdempotencyKey(request.headers,true),
    })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return erpFailureResponse(error)
  }
}
