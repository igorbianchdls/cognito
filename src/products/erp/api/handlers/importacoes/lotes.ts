import { withErpHttp } from '@/products/erp/api/http/handler'
import { NextResponse } from 'next/server'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { erpErrorResponse, erpFailure } from '@/products/erp/api/http/responses'
import { getImportDetails, listImportErrorLines } from '@/products/erp/server/erpImportRepository'
 async function handleGET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveErpAccess('erp.cadastros.visualizar')
    if (!access) return erpFailure('Acesso negado.', 403)
    const { id } = await context.params,
      params = new URL(request.url).searchParams
    const detail = await getImportDetails(access.tenantId, id, Number(params.get('page') || 1))
    if (params.get('format') === 'csv') {
      const rows = await listImportErrorLines(access.tenantId,id)
      const cell = (v: unknown) =>
        `"${String(v ?? '')
          .replace(/^[=+@-]/, "'$&")
          .replaceAll('"', '""')}"`
      const csv = [
        'Linha;Situação;Erros',
        ...rows.map((r) => [r.numero_linha, r.status, JSON.stringify(r.erros)].map(cell).join(';')),
      ].join('\r\n')
      return new Response(`\uFEFF${csv}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="erros-${id}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    return NextResponse.json(detail, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return erpErrorResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/importacoes/lotes/[id]","authentication":"session","maxBodyBytes":4194304})
