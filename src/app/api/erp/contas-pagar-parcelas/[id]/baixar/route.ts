import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { settlePayableInstallment } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const installmentId = Number(id)
  if (!Number.isInteger(installmentId) || installmentId <= 0) {
    return NextResponse.json({ error: 'Parcela invalida.' }, { status: 400 })
  }

  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { values?: Record<string, unknown> }
    const result = await settlePayableInstallment({
      actorId: tenant.sharedUserId,
      id: installmentId,
      tenantId: tenant.tenantId,
      values: body.values || {},
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel baixar a parcela.' },
      { status: 400 },
    )
  }
}
