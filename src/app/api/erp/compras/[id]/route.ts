import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getErpPurchaseDetails, updateErpPurchaseDraft } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.compras.visualizar')
  if (!tenant) return erpFailure('Nao autenticado.', 401)
  try {
    return NextResponse.json(await getErpPurchaseDetails(tenant.tenantId, (await context.params).id))
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.compras.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await request.json().catch(() => ({})) as { values?: Record<string, unknown>; expectedVersion?: number }
    if (!Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) <= 0) return erpFailure('Versao da compra e obrigatoria.', 400)
    return NextResponse.json(await updateErpPurchaseDraft({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      id: (await context.params).id, expectedVersion: Number(body.expectedVersion), values: body.values || {} }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar a compra.'
    return NextResponse.json({ error: message.replace(/^CONFLITO_VERSAO:\s*/, '') }, { status: message.startsWith('CONFLITO_VERSAO:') ? 409 : 400 })
  }
}
