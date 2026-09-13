import { NextResponse } from 'next/server'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { erpErrorResponse, erpFailure } from '@/products/erp/server/erpApi'
import { getImportDetails } from '@/products/erp/server/erpImportRepository'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveErpAccess('erp.cadastros.visualizar')
    if (!access) return erpFailure('Acesso negado.', 403)
    const { id } = await context.params,
      params = new URL(request.url).searchParams
    const detail = await getImportDetails(access.tenantId, id, Number(params.get('page') || 1))
    if (params.get('format') === 'csv') {
      const rows = await runQuery(
        `SELECT numero_linha,status,erros FROM erp.importacoes_dados_linhas WHERE tenant_id=$1 AND importacao_id=$2 AND status='erro' ORDER BY numero_linha`,
        [access.tenantId, id],
      )
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
