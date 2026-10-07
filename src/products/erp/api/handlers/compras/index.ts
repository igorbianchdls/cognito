import { erpCreateEnvelopeSchema, readErpIdempotencyKey } from '../../../shared/erpTransport'
import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, parseErpBody, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { createErpEntityRecord, listErpEntityPage } from '@/products/erp/server/erpRepository'

function parseFilters(searchParams: URLSearchParams) {
  const filters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter.')) filters[key.slice('filter.'.length)] = value
  })
  return filters
}

 async function handleGET(request: Request) {
  const tenant = await resolveErpAccess('erp.compras.visualizar')
  if (!tenant) return erpFailure('Não autenticado.', 401)

  try {
    const url = new URL(request.url)
    const page = await listErpEntityPage({
      entityId: 'pedidos-compra',
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

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.compras.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)

  try {
    const body = await parseErpBody(request, erpCreateEnvelopeSchema)
    const record = await createErpEntityRecord({
      actorId: tenant.sharedUserId,
      entityId: 'pedidos-compra',
      tenantId: tenant.tenantId,
      values: body.values || {},
      idempotencyKey: readErpIdempotencyKey(request.headers),
    })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/compras","authentication":"session","maxBodyBytes":1048576})
export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/compras","authentication":"session","maxBodyBytes":1048576})
