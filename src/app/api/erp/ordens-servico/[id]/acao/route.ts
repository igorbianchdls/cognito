import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { runServiceOrderAction } from '@/products/erp/server/erpProfessionalRepository'
import { serviceOrderActionSchema } from '@/products/erp/shared/professionalContracts'

export const runtime = 'nodejs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const [{ id }, values] = await Promise.all([context.params, parseErpBody(request, serviceOrderActionSchema)])
    return NextResponse.json({ result: await runServiceOrderAction({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, orderId: Number(id), ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}

