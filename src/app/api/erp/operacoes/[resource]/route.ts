import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { createManagementOperation, listManagementOperation } from '@/products/erp/server/erpManagementRepository'
import { createStockOperation, listStockOperation } from '@/products/erp/server/erpStockRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const stockResources = new Set(['posicao-estoque', 'movimentacoes', 'locais-estoque', 'inventarios', 'transferencias', 'kits', 'conversoes-unidades'])

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
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  try {
    const { resource } = await context.params
    const records = stockResources.has(resource)
      ? await listStockOperation(tenant.tenantId, resource)
      : await listManagementOperation(tenant.tenantId, resource)
    const url = new URL(request.url)
    if (url.searchParams.get('format') === 'csv') {
      return new Response(`\uFEFF${toCsv(records)}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${resource}.csv"`,
        },
      })
    }
    return NextResponse.json({ records, total: records.length })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar o modulo.' }, { status: 400 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const { resource } = await context.params
    const body = (await request.json().catch(() => ({}))) as { values?: Record<string, unknown> }
    const idempotencyKey = request.headers.get('idempotency-key') || `${resource}:${Date.now()}`
    const record = stockResources.has(resource)
      ? await createStockOperation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, resource, values: body.values || {}, idempotencyKey })
      : await createManagementOperation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, resource, values: body.values || {}, idempotencyKey })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.' }, { status: 400 })
  }
}
