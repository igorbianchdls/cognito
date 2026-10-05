import { withErpHttp } from '@/products/erp/api/http/handler'
import { NextResponse } from 'next/server'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { erpErrorResponse, erpFailure } from '@/products/erp/api/http/responses'
import { readStockCountSnapshot } from '@/products/erp/server/erpStockRepository'

 async function handleGET(request: Request) {
  const access = await resolveErpAccess('erp.estoque.ajustar')
  if (!access) return erpFailure('Acesso negado.', 403)
  try {
    const params = new URL(request.url).searchParams
    const records = await readStockCountSnapshot(access.tenantId, Number(params.get('local')), (params.get('produtos') || '').split(',').map(Number))
    return NextResponse.json({ records }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/estoque/contagem","authentication":"session","maxBodyBytes":1048576})
