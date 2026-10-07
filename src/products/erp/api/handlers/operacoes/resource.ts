import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpCreateEnvelopeSchema, readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'
import { parseErpBody } from '@/products/erp/api/http/responses'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { ERP_STOCK_RESOURCES, getErpOperationCapability } from '@/products/erp/server/erpOperationAccess'
import { createManagementOperation, listManagementOperation } from '@/products/erp/server/erpManagementRepository'
import { createStockOperation, listStockOperation } from '@/products/erp/server/erpStockRepository'

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function toCsv(records: Record<string, unknown>[]) {
  if (!records.length) return ''
  const columns = Object.keys(records[0])
  return [columns.map(csvCell).join(';'), ...records.map((record) => columns.map((column) => csvCell(record[column])).join(';'))].join('\r\n')
}

 async function handleGET(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params
  const tenant = await resolveErpAccess(getErpOperationCapability(resource, false))
  if (!tenant) return erpFailure('Não autenticado.', 401)
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

 async function handlePOST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params
  try {
    const body = await parseErpBody(request,erpCreateEnvelopeSchema)
    const capability = resource === 'movimentacoes' && String(body.values?.tipo || '').startsWith('ajuste') ? 'erp.estoque.ajustar' : getErpOperationCapability(resource, true)
    const tenant = await resolveErpAccess(capability)
    if (!tenant) return erpFailure('Acesso negado.', 403)
    const requiresDurableOperation = ERP_STOCK_RESOURCES.has(resource) || resource === 'contratos' || resource === 'transferencias-financeiras' || resource === 'conciliar-transacao'
    const idempotencyKey = readErpIdempotencyKey(request.headers, requiresDurableOperation) || `${resource}:${Date.now()}`
    const record = ERP_STOCK_RESOURCES.has(resource)
      ? await createStockOperation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, resource, values: body.values || {}, idempotencyKey })
      : await createManagementOperation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, resource, values: body.values || {}, idempotencyKey })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/operacoes/[resource]","authentication":"session","maxBodyBytes":1048576})
export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/operacoes/[resource]","authentication":"session","maxBodyBytes":1048576})
