import { NextResponse } from 'next/server'
import { listSaleReturns } from '../../../server/erpReturnsRepository'
import { resolveErpApiAccess } from '../../http/access'
import { withErpHttp } from '../../http/handler'

// Lista de devoluções (filtros: cliente_id, venda_id, com_credito=1 para créditos ainda disponíveis).
async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.vendas.visualizar'), params = new URL(request.url).searchParams
  const optional = (key: string) => { const n = Number(params.get(key)); return Number.isInteger(n) && n > 0 ? n : undefined }
  return NextResponse.json(await listSaleReturns(access.tenantId, {
    clienteId: optional('cliente_id'), vendaId: optional('venda_id'), comCredito: params.get('com_credito') === '1',
    page: Number(params.get('page') || 1), pageSize: Number(params.get('pageSize') || 20),
  }))
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/devolucoes' })
