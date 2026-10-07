import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'
import { erpCreateEnvelopeSchema, readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { createErpEntityRecord, listErpEntityPage } from '@/products/erp/server/erpRepository'
import { getErpModuleCapability, isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

type RouteContext = {
  params: Promise<{ entityId: string }>
}

const createSchema = erpCreateEnvelopeSchema

function parseFilters(searchParams: URLSearchParams) {
  const filters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter.')) {
      filters[key.slice('filter.'.length)] = value
    }
  })
  return filters
}

 async function handleGET(request: Request, context: RouteContext) {
  const { entityId } = await context.params
  if (!isErpConnectedModuleId(entityId)) {
    return erpFailure('Módulo ERP não encontrado.', 404)
  }

  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'read'))
  if (!tenant) {
    return erpFailure('Acesso negado.', 403)
  }

  try {
    const url = new URL(request.url)
    const page = await listErpEntityPage({
      entityId,
      tenantId: tenant.tenantId,
      query: url.searchParams.get('query') || '',
      filters: parseFilters(url.searchParams),
      page: Number(url.searchParams.get('page') || 1),
      pageSize: Number(url.searchParams.get('pageSize') || 50),
    })

    return NextResponse.json(page)
  } catch (error) {
    return erpErrorResponse(error)
  }
}

 async function handlePOST(request: Request, context: RouteContext) {
  const { entityId } = await context.params
  if (!isErpConnectedModuleId(entityId)) {
    return erpFailure('Módulo ERP não encontrado.', 404)
  }

  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'manage'))
  if (!tenant) {
    return erpFailure('Acesso negado.', 403)
  }

  try {
    const body = await parseErpBody(request, createSchema)
    const record = await createErpEntityRecord({
      actorId: tenant.sharedUserId,
      entityId,
      tenantId: tenant.tenantId,
      values: body.values,
      idempotencyKey: readErpIdempotencyKey(request.headers),
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return erpErrorResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/[entityId]","authentication":"session","maxBodyBytes":1048576})
export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/[entityId]","authentication":"session","maxBodyBytes":1048576})
