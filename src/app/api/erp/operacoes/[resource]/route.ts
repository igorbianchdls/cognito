import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { ERP_STOCK_RESOURCES, getErpOperationCapability } from '@/products/erp/server/erpOperationAccess'
import { createManagementOperation, listManagementOperation } from '@/products/erp/server/erpManagementRepository'
import { createStockOperation, listStockOperation } from '@/products/erp/server/erpStockRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function toCsv(records: Record<string, unknown>[]) {
  if (!records.length) return ''
  const columns = Object.keys(records[0])
  return [columns.map(csvCell).join(';'), ...records.map((record) => columns.map((column) => csvCell(record[column])).join(';'))].join('\r\n')
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params
  const tenant = await resolveErpAccess(getErpOperationCapability(resource, false))
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  try {
    const url = new URL(request.url)
    const isCsv = url.searchParams.get('format') === 'csv'
    const input = {
      page: Number(url.searchParams.get('page') || 1),
      pageSize: Number(url.searchParams.get('pageSize') || 50),
      query: url.searchParams.get('query') || '',
      exportLimit: isCsv ? 10_000 : undefined,
    }
    const page = ERP_STOCK_RESOURCES.has(resource)
      ? await listStockOperation(tenant.tenantId, resource, input)
      : await listManagementOperation(tenant.tenantId, resource, input)
    if (isCsv) {
      return new Response(`\uFEFF${toCsv(page.records)}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${resource}.csv"`,
        },
      })
    }
    return NextResponse.json(page)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar o modulo.' }, { status: 400 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params
  const tenant = await resolveErpAccess(getErpOperationCapability(resource, true))
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = (await request.json().catch(() => ({}))) as { values?: Record<string, unknown> }
    const idempotencyKey = request.headers.get('idempotency-key') || `${resource}:${Date.now()}`
    const record = ERP_STOCK_RESOURCES.has(resource)
      ? await createStockOperation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, resource, values: body.values || {}, idempotencyKey })
      : await createManagementOperation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, resource, values: body.values || {}, idempotencyKey })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.' }, { status: 400 })
  }
}
