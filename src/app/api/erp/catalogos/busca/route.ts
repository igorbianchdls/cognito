import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { searchErpCatalog } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const catalogTypes = ['cliente', 'fornecedor', 'produto', 'servico', 'categoria'] as const

export async function GET(request: Request) {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  const params = new URL(request.url).searchParams
  const type = params.get('tipo')
  if (!catalogTypes.some((value) => value === type)) return NextResponse.json({ error: 'Tipo de catalogo invalido.' }, { status: 400 })
  return NextResponse.json({ records: await searchErpCatalog({
    tenantId: tenant.tenantId,
    type: type as (typeof catalogTypes)[number],
    query: params.get('q') || '',
    categoryType: params.get('categoria_tipo') || undefined,
    limit: Number(params.get('limite') || 30),
  }) })
}
