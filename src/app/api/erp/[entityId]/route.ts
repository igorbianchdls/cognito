import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { createErpEntityRecord, listErpEntityPage } from '@/products/erp/server/erpRepository'
import { isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ entityId: string }>
}

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

  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) {
    return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel carregar dados do ERP.' },
      { status: 400 },
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { entityId } = await context.params
  if (!isErpConnectedModuleId(entityId)) {
    return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  }

  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { values?: Record<string, unknown> }
    const record = await createErpEntityRecord({
      actorId: tenant.sharedUserId,
      entityId,
      tenantId: tenant.tenantId,
      values: body.values || {},
      idempotencyKey: request.headers.get('idempotency-key') || undefined,
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel salvar no ERP.' },
      { status: 400 },
    )
  }
}
