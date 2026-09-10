import { erpUpdateEnvelopeSchema } from '@/products/erp/shared/erpTransport'
import { parseErpBody } from '@/products/erp/server/erpApi'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getErpSaleDetails, updateErpSaleDraft } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Nao autenticado.', 401)
  try {
    return NextResponse.json(await getErpSaleDetails(tenant.tenantId, (await context.params).id))
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request,erpUpdateEnvelopeSchema)
    if (!Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) <= 0) return erpFailure('Versao da venda e obrigatoria.', 400)
    return NextResponse.json(await updateErpSaleDraft({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      id: (await context.params).id, expectedVersion: Number(body.expectedVersion), values: body.values || {} }))
  } catch (error) {
    return erpFailureResponse(error)
  }
}
