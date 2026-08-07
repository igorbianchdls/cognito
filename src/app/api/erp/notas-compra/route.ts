import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { importErpPurchaseInvoice, listErpPurchaseInvoices } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.compras.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const records = await listErpPurchaseInvoices(tenant.tenantId)
    return NextResponse.json({ records, total: records.length })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel carregar as notas.' }, { status: 400 })
  }
}

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.compras.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({})) as { values?: Record<string, unknown> }
    const result = await importErpPurchaseInvoice({
      tenantId: tenant.tenantId,
      actorId: tenant.sharedUserId,
      values: body.values || {},
    })
    return NextResponse.json(result, { status: result.reused ? 200 : 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel importar a NF-e.' }, { status: 400 })
  }
}
