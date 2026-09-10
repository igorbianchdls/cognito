import { erpCreateEnvelopeSchema, readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'
import { parseErpBody } from '@/products/erp/server/erpApi'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
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
  if (!tenant) return erpFailure('Nao autenticado.', 401)
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
    return erpFailureResponse(error)
  }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params
  const tenant = await resolveErpAccess(getErpOperationCapability(resource, true))
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request,erpCreateEnvelopeSchema)
    const idempotencyKey = readErpIdempotencyKey(request.headers,resource==='contratos') || `${resource}:${Date.now()}`
    const record = ERP_STOCK_RESOURCES.has(resource)
      ? await createStockOperation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, resource, values: body.values || {}, idempotencyKey })
      : await createManagementOperation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, resource, values: body.values || {}, idempotencyKey })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return erpFailureResponse(error)
  }
}
