import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getErpOperationCapability } from '@/products/erp/server/erpOperationAccess'
import { listErpOperationsCatalogs } from '@/products/erp/server/erpManagementRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const resource = new URL(request.url).searchParams.get('resource') || ''
  if (!resource) return NextResponse.json({ error: 'Recurso obrigatorio.' }, { status: 400 })
  const tenant = await resolveErpAccess(getErpOperationCapability(resource, false))
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    return NextResponse.json(await listErpOperationsCatalogs(tenant.tenantId))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar os catalogos.' }, { status: 400 })
  }
}
