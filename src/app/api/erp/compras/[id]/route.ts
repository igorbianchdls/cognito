import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { getErpPurchaseDetails, updateErpPurchaseDraft } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  try {
    return NextResponse.json(await getErpPurchaseDetails(tenant.tenantId, (await context.params).id))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar a compra.' }, { status: 404 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({})) as { values?: Record<string, unknown>; expectedVersion?: number }
    if (!Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) <= 0) return NextResponse.json({ error: 'Versao da compra e obrigatoria.' }, { status: 400 })
    return NextResponse.json(await updateErpPurchaseDraft({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      id: (await context.params).id, expectedVersion: Number(body.expectedVersion), values: body.values || {} }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar a compra.'
    return NextResponse.json({ error: message.replace(/^CONFLITO_VERSAO:\s*/, '') }, { status: message.startsWith('CONFLITO_VERSAO:') ? 409 : 400 })
  }
}
