import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { attendStockForSale } from '@/products/erp/server/erpStockRepository'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const { id } = await context.params
    return NextResponse.json(await attendStockForSale({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, saleId: Number(id) }))
  } catch (error) { return erpErrorResponse(error) }
}
