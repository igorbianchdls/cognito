import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { reverseErpPayment } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const paymentId = Number(id)
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return NextResponse.json({ error: 'Pagamento invalido.' }, { status: 400 })
  }

  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  try {
    const body = (await request.json().catch(() => ({}))) as { motivo?: unknown }
    const result = await reverseErpPayment({
      actorId: tenant.sharedUserId,
      id: paymentId,
      idempotencyKey: request.headers.get('idempotency-key') || undefined,
      reason: typeof body.motivo === 'string' ? body.motivo : null,
      tenantId: tenant.tenantId,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel estornar o pagamento.' },
      { status: 400 },
    )
  }
}
