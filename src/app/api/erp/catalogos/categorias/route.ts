import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { listErpCategoryOptions } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  const type = new URL(request.url).searchParams.get('tipo') || undefined
  return NextResponse.json({ options: await listErpCategoryOptions(tenant.tenantId, type) })
}
