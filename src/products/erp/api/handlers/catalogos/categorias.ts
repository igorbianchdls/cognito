import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { listErpCategoryOptions, listFinancialCategoryStructure, listRegistrationCategoryRoots } from '@/products/erp/server/erpRepository'

 async function handleGET(request: Request) {
  const tenant = await resolveErpAccess('erp.cadastros.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  const type = new URL(request.url).searchParams.get('tipo') || undefined
  // Tela de categorias financeiras: grupos da DRE e categorias principais.
  if (new URL(request.url).searchParams.get('estrutura') === 'cadastro') return NextResponse.json({ raizes: await listRegistrationCategoryRoots(tenant.tenantId) })
  if (new URL(request.url).searchParams.get('estrutura') === '1') return NextResponse.json(await listFinancialCategoryStructure(tenant.tenantId))
  return NextResponse.json({ options: await listErpCategoryOptions(tenant.tenantId, type, new URL(request.url).searchParams.get('identificador') === 'id') })
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/catalogos/categorias","authentication":"session","maxBodyBytes":1048576})
