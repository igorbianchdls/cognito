import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getErpOperationCapability } from '@/products/erp/server/erpOperationAccess'
import { searchErpOperationsCatalog, type ErpOperationCatalogSource } from '@/products/erp/server/erpManagementRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const resource = new URL(request.url).searchParams.get('resource') || ''
  const params = new URL(request.url).searchParams
  const source = params.get('source') as ErpOperationCatalogSource | null
  if (!resource) return erpFailure('Recurso obrigatorio.', 400)
  if (!source || !['products', 'services', 'customers', 'accounts', 'locations', 'payments'].includes(source)) {
    return erpFailure('Catalogo invalido.', 400)
  }
  const tenant = await resolveErpAccess(getErpOperationCapability(resource, false))
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    return NextResponse.json({ records: await searchErpOperationsCatalog({
      tenantId: tenant.tenantId,
      source,
      query: params.get('q') || '',
      limit: Number(params.get('limit') || 20),
    }) })
  } catch (error) {
    return erpFailureResponse(error)
  }
}
