import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { receivePurchaseItems } from '@/products/erp/server/erpProfessionalRepository'
import { partialStockActionSchema } from '@/products/erp/shared/professionalContracts'

export const runtime = 'nodejs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.compras.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const [{ id }, values] = await Promise.all([context.params, parseErpBody(request, partialStockActionSchema)])
    return NextResponse.json(await receivePurchaseItems({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, purchaseId: Number(id), values, idempotencyKey: request.headers.get('idempotency-key') || crypto.randomUUID() }))
  } catch (error) { return erpErrorResponse(error) }
}

