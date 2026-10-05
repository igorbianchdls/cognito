import { NextResponse } from 'next/server'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { erpErrorResponse, erpFailure } from '@/products/erp/server/erpApi'
import { readStockCountSnapshot } from '@/products/erp/server/erpStockRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const access = await resolveErpAccess('erp.estoque.ajustar')
  if (!access) return erpFailure('Acesso negado.', 403)
  try {
    const params = new URL(request.url).searchParams
    const records = await readStockCountSnapshot(access.tenantId, Number(params.get('local')), (params.get('produtos') || '').split(',').map(Number))
    return NextResponse.json({ records }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return erpErrorResponse(error) }
}
