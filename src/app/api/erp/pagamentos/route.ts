import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { listErpPayments } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('tipo') === 'pagar' ? 'pagar' : 'receber'
    const accountId = Number(url.searchParams.get('conta_id'))
    if (!Number.isInteger(accountId) || accountId <= 0) throw new Error('Conta financeira de origem invalida.')
    const records = await listErpPayments({ tenantId: tenant.tenantId, type, accountId })
    return NextResponse.json({ records, total: records.length })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar os pagamentos.' }, { status: 400 })
  }
}
