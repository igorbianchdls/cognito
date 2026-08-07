import { NextResponse } from 'next/server'
import { z } from 'zod'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { createErpEntityRecord, listErpEntityPage } from '@/products/erp/server/erpRepository'
import { getErpModuleCapability, isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ entityId: string }>
}

const createSchema = z.object({ values: z.record(z.string(), z.unknown()).default({}) })

function parseFilters(searchParams: URLSearchParams) {
  const filters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter.')) {
      filters[key.slice('filter.'.length)] = value
    }
  })
  return filters
}

export async function GET(request: Request, context: RouteContext) {
  const { entityId } = await context.params
  if (!isErpConnectedModuleId(entityId)) {
    return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  }

  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'read'))
  if (!tenant) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
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

export async function POST(request: Request, context: RouteContext) {
  const { entityId } = await context.params
  if (!isErpConnectedModuleId(entityId)) {
    return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  }

  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'manage'))
  if (!tenant) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const body = await parseErpBody(request, createSchema)
    const record = await createErpEntityRecord({
      actorId: tenant.sharedUserId,
      entityId,
      tenantId: tenant.tenantId,
      values: body.values,
      idempotencyKey: request.headers.get('idempotency-key') || undefined,
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return erpErrorResponse(error)
  }
}
