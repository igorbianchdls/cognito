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
  const tenant = await resolveErpAccess('erp.compras.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel carregar compras.' },
      { status: 400 },
    )
  }
}

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.compras.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  try {
    const body = (await request.json().catch(() => ({}))) as { values?: Record<string, unknown> }
    const record = await createErpEntityRecord({
      actorId: tenant.sharedUserId,
      entityId: 'pedidos-compra',
      tenantId: tenant.tenantId,
      values: body.values || {},
      idempotencyKey: request.headers.get('idempotency-key') || undefined,
    })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel salvar a compra.' },
      { status: 400 },
    )
  }
}
