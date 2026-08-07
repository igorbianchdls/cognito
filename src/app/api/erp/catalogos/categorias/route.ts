import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { listErpCategoryOptions } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const tenant = await resolveErpAccess('erp.cadastros.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  const type = new URL(request.url).searchParams.get('tipo') || undefined
  return NextResponse.json({ options: await listErpCategoryOptions(tenant.tenantId, type) })
}
