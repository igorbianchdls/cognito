import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getErpSaleDetails, updateErpSaleDraft } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  try {
    return NextResponse.json(await getErpSaleDetails(tenant.tenantId, (await context.params).id))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar a venda.' }, { status: 404 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({})) as { values?: Record<string, unknown>; expectedVersion?: number }
    if (!Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) <= 0) return NextResponse.json({ error: 'Versao da venda e obrigatoria.' }, { status: 400 })
    return NextResponse.json(await updateErpSaleDraft({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      id: (await context.params).id, expectedVersion: Number(body.expectedVersion), values: body.values || {} }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar a venda.'
    return NextResponse.json({ error: message.replace(/^CONFLITO_VERSAO:\s*/, '') }, { status: message.startsWith('CONFLITO_VERSAO:') ? 409 : 400 })
  }
}
