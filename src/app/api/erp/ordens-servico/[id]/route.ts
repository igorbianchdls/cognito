import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getServiceOrder } from '@/products/erp/server/erpProfessionalRepository'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const { id } = await context.params
    return NextResponse.json(await getServiceOrder(tenant.tenantId, Number(id)))
  } catch (error) { return erpErrorResponse(error) }
}

