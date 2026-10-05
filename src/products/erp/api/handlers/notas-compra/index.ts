import { erpCreateEnvelopeSchema } from '../../../shared/erpTransport'
import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, parseErpBody, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { importErpPurchaseInvoice, listErpPurchaseInvoices } from '@/products/erp/server/erpRepository'

 async function handleGET() {
  const tenant = await resolveErpAccess('erp.compras.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const records = await listErpPurchaseInvoices(tenant.tenantId)
    return NextResponse.json({ records, total: records.length })
  } catch (error) {
    return erpFailureResponse(error)
  }
}

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.compras.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request, erpCreateEnvelopeSchema)
    const result = await importErpPurchaseInvoice({
      tenantId: tenant.tenantId,
      actorId: tenant.sharedUserId,
      values: body.values || {},
    })
    return NextResponse.json(result, { status: result.reused ? 200 : 201 })
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/notas-compra","authentication":"session","maxBodyBytes":1048576})
export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/notas-compra","authentication":"session","maxBodyBytes":1048576})
