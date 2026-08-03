import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { getErpEntitySummary } from '@/products/erp/server/erpRepository'
import { isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await context.params
  if (!isErpConnectedModuleId(entityId)) return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  try {
    return NextResponse.json(await getErpEntitySummary(tenant.tenantId, entityId))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar o resumo.' }, { status: 400 })
  }
}
