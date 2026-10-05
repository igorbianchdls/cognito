import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { getErpOperationCapability } from '@/products/erp/server/erpOperationAccess'
import { searchErpOperationsCatalog, type ErpOperationCatalogSource } from '@/products/erp/server/erpManagementRepository'

 async function handleGET(request: Request) {
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

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/operacoes/catalogos","authentication":"session","maxBodyBytes":1048576})
