import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { searchErpCatalog } from '@/products/erp/server/erpRepository'

const catalogTypes = ['cliente', 'fornecedor', 'produto', 'servico', 'categoria'] as const

 async function handleGET(request: Request) {
  const tenant = await resolveErpAccess('erp.cadastros.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  const params = new URL(request.url).searchParams
  const type = params.get('tipo')
  if (!catalogTypes.some((value) => value === type)) return erpFailure('Tipo de catalogo invalido.', 400)
  return NextResponse.json({ records: await searchErpCatalog({
    tenantId: tenant.tenantId,
    type: type as (typeof catalogTypes)[number],
    query: params.get('q') || '',
    categoryType: params.get('categoria_tipo') || undefined,
    limit: Number(params.get('limite') || 30),
  }) })
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/catalogos/busca","authentication":"session","maxBodyBytes":1048576})
