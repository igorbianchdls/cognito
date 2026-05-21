import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'
import {
  buildFinancialStatementQuery,
  resolveFinancialPeriod,
} from '@/products/mcp-apps/server/domainTools'
import type { TableStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

type FinancialStatementKind = 'dre' | 'cash_flow'

function normalizeKind(value: string | null): FinancialStatementKind {
  const kind = String(value || '').trim().toLowerCase()
  if (kind === 'dre') return 'dre'
  if (kind === 'cash_flow' || kind === 'cashflow' || kind === 'fluxo_de_caixa' || kind === 'fluxo-caixa') return 'cash_flow'
  return 'dre'
}

function buildSubtitle(kind: FinancialStatementKind, period: { de: string; ate: string }) {
  return kind === 'dre'
    ? `DRE consolidada no periodo ${period.de} a ${period.ate}`
    : `Fluxo de caixa consolidado no periodo ${period.de} a ${period.ate}`
}

export async function GET(req: NextRequest) {
  try {
    const kind = normalizeKind(req.nextUrl.searchParams.get('kind'))
    const de = String(req.nextUrl.searchParams.get('de') || '').trim() || undefined
    const ate = String(req.nextUrl.searchParams.get('ate') || '').trim() || undefined
    const tenantId = resolveTenantId(req.headers, 1)
    const paramsIn = { de, ate }
    const built = buildFinancialStatementQuery(kind, paramsIn, tenantId)
    const period = resolveFinancialPeriod(kind, paramsIn)
    const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
    const columns = built.columns ?? (rows.length ? Object.keys(rows[0] || {}).filter((column) => !column.startsWith('_')) : [])
    const table: TableStructuredContent & { kind: FinancialStatementKind; sql_query: string; sql_params: unknown[] } = {
      ok: true,
      tool: 'financial_statement',
      view: 'table',
      kind,
      variant: built.variant,
      title: built.title,
      subtitle: buildSubtitle(kind, period),
      columns,
      rows,
      count: rows.length,
      sql_query: built.sql,
      sql_params: built.params,
    }

    return Response.json({ ok: true, table })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: (error as Error)?.message || String(error),
      },
      { status: 500 },
    )
  }
}
