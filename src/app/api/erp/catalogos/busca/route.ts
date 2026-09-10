import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { searchErpCatalog } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const catalogTypes = ['cliente', 'fornecedor', 'produto', 'servico', 'categoria'] as const

export async function GET(request: Request) {
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
