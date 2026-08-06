import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { fulfillStockForSale } from '@/products/erp/server/erpStockRepository'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const { id } = await context.params
    return NextResponse.json(await fulfillStockForSale({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, saleId: Number(id) }))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel faturar a venda.' }, { status: 400 })
  }
}
