import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { listErpCategoryOptions } from '@/products/erp/server/erpRepository'

 async function handleGET(request: Request) {
  const tenant = await resolveErpAccess('erp.cadastros.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  const type = new URL(request.url).searchParams.get('tipo') || undefined
  return NextResponse.json({ options: await listErpCategoryOptions(tenant.tenantId, type, new URL(request.url).searchParams.get('identificador') === 'id') })
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/catalogos/categorias","authentication":"session","maxBodyBytes":1048576})
