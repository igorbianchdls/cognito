import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { cancelErpSale } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const saleId = Number(id)
  if (!Number.isInteger(saleId) || saleId <= 0) {
    return NextResponse.json({ error: 'Venda invalida.' }, { status: 400 })
  }

  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const result = await cancelErpSale({
      actorId: tenant.sharedUserId,
      id: saleId,
      tenantId: tenant.tenantId,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel cancelar a venda.' },
      { status: 400 },
    )
  }
}
