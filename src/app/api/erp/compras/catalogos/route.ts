import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { listErpPurchaseCatalogs } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.compras.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

  try {
    return NextResponse.json(await listErpPurchaseCatalogs(tenant.tenantId))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel carregar os catalogos de compras.' },
      { status: 400 },
    )
  }
}
