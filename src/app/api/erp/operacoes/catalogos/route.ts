import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { listErpOperationsCatalogs } from '@/products/erp/server/erpManagementRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  try {
    return NextResponse.json(await listErpOperationsCatalogs(tenant.tenantId))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar os catalogos.' }, { status: 400 })
  }
}
