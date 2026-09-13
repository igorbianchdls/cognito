import { NextResponse } from 'next/server'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { erpErrorResponse, erpFailure, ErpDomainError } from '@/products/erp/server/erpApi'
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
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!base || !key)
        throw new ErpDomainError(
          'STORAGE_UNAVAILABLE',
          'O armazenamento de anexos não está configurado.',
          503,
        )
      const path = [file.bucket, ...file.caminho.split('/')].map(encodeURIComponent).join('/')
      const response = await fetch(`${base}/storage/v1/object/sign/${path}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: 60 }),
        cache: 'no-store',
      })
      if (!response.ok)
        throw new ErpDomainError('FILE_UNAVAILABLE', 'Não foi possível acessar este anexo.', 503)
      const body = (await response.json()) as { signedURL?: string }
      if (!body.signedURL) throw new ErpDomainError('FILE_UNAVAILABLE', 'Anexo indisponível.', 503)
      const url = new URL(`${base}/storage/v1${body.signedURL}`)
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
