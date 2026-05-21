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

function optionalSearchParam(req: NextRequest, key: string) {
  return String(req.nextUrl.searchParams.get(key) || '').trim() || undefined
}

export async function GET(req: NextRequest) {
  try {
    const kind = normalizeKind(req.nextUrl.searchParams.get('kind'))
    const de = optionalSearchParam(req, 'de')
    const ate = optionalSearchParam(req, 'ate')
    const tenantId = resolveTenantId(req.headers, 1)
    const paramsIn = {
      de,
      ate,
      categoria_id: optionalSearchParam(req, 'categoria_id'),
      categoria: optionalSearchParam(req, 'categoria'),
      centro_custo_id: optionalSearchParam(req, 'centro_custo_id'),
      centro_lucro_id: optionalSearchParam(req, 'centro_lucro_id'),
      centro: optionalSearchParam(req, 'centro'),
      fornecedor_id: optionalSearchParam(req, 'fornecedor_id'),
      cliente_id: optionalSearchParam(req, 'cliente_id'),
      conta_contabil_codigo: optionalSearchParam(req, 'conta_contabil_codigo'),
      linha_dre: optionalSearchParam(req, 'linha_dre'),
    }
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
