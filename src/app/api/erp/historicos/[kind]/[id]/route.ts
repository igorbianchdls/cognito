import { NextResponse } from 'next/server'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { erpErrorResponse, erpFailure } from '@/products/erp/server/erpApi'
import { signErpDocumentFile } from '@/products/erp/server/erpStorage'
import {
  getDocumentFile,
  getDocumentHistory,
  getBillingHistory,
} from '@/products/erp/server/erpHistoryRepository'

export const runtime = 'nodejs'
export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const { kind, id } = await context.params
    const capability = ['contas-pagar', 'contas-receber', 'cobrancas'].includes(kind)
      ? 'erp.financeiro.visualizar'
      : ['compras', 'notas-compra'].includes(kind)
        ? 'erp.compras.visualizar'
        : 'erp.vendas.visualizar'
    const access = await resolveErpAccess(capability)
    if (!access) return erpFailure('Acesso negado.', 403)
    const params = new URL(request.url).searchParams
    if (kind === 'cobrancas')
      return NextResponse.json(
        await getBillingHistory(access.tenantId, id, Number(params.get('page') || 1)),
        { headers: { 'Cache-Control': 'no-store' } },
      )
    if (params.has('arquivo')) {
      const file = await getDocumentFile(access.tenantId, kind, id, params.get('arquivo')!)
      const url = await signErpDocumentFile(file)
      if (params.get('download') === '1') url.searchParams.set('download', file.nome)
      return NextResponse.json(
        { url: url.toString() },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return NextResponse.json(
      await getDocumentHistory(access.tenantId, kind, id, Number(params.get('page') || 1)),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return erpErrorResponse(error)
  }
}
