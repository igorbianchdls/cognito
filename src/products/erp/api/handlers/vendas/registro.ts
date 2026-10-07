import { commercialDeleteBody } from '../../contracts/commercialDeletion'
import { deleteCommercialDraft } from '../../../server/erpCommercialDeletion'
import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpUpdateEnvelopeSchema } from '@/products/erp/shared/erpTransport'
import { parseErpBody } from '@/products/erp/api/http/responses'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { getErpSaleDetails, updateErpSaleDraft } from '@/products/erp/server/erpRepository'

 async function handleGET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Não autenticado.', 401)
  try {
    return NextResponse.json(await getErpSaleDetails(tenant.tenantId, (await context.params).id))
  } catch (error) {
    return erpFailureResponse(error)
  }
}

 async function handlePATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request,erpUpdateEnvelopeSchema)
    if (!Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) <= 0) return erpFailure('Versão da venda é obrigatória.', 400)
    return NextResponse.json(await updateErpSaleDraft({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      id: (await context.params).id, expectedVersion: Number(body.expectedVersion), values: body.values || {} }))
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/vendas/[id]","authentication":"session","maxBodyBytes":1048576})
export const PATCH = withErpHttp(handlePATCH, {"operation":"PATCH /api/erp/vendas/[id]","authentication":"session","maxBodyBytes":1048576})

async function handleDELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await resolveErpAccess('erp.vendas.gerenciar')
  await resolveErpAccess('erp.financeiro.visualizar')
  await resolveErpAccess('erp.estoque.visualizar')
  const body = await parseErpBody(request, commercialDeleteBody)
  return NextResponse.json(await deleteCommercialDraft({tenantId:access.tenantId,actorId:access.sharedUserId,type:'vendas',id:Number((await context.params).id),...body}))
}
export const DELETE = withErpHttp(handleDELETE, {operation:'DELETE /api/erp/vendas/[id]'})
