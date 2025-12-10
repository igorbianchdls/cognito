import { NextRequest, NextResponse } from 'next/server'
import { runQuery } from '@/lib/postgres'

type DateFilter = { type: string; startDate?: string; endDate?: string } | undefined

interface ScatterRequest {
  schema?: string
  table: string
  dimension?: string // optional label/group by
  xMeasure: string
  yMeasure: string
  limit?: number
  where?: string
  // Either dateFilter or filters.dateRange
  dateFilter?: { type: string; startDate?: string; endDate?: string }
  filters?: unknown
}

const sanitizeIdent = (s?: string) => (s ? s.replace(/[^a-zA-Z0-9_]/g, '') : '')

const buildMeasureExpression = (expr: string | undefined): string => {
  const s = String(expr || '').trim()
  if (!s) return '0'
  // allow expressions with functions; normalize known forms
  let out = s
  out = out.replace(/COUNT\s*\(\s*\*\s*\)/gi, 'COUNT(*)')
  out = out.replace(/COUNT_DISTINCT\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'COUNT(DISTINCT "$1")')
  out = out.replace(/SUM\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'SUM("$1")')
  out = out.replace(/AVG\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'AVG("$1")')
  out = out.replace(/MIN\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'MIN("$1")')
  out = out.replace(/MAX\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'MAX("$1")')
  out = out.replace(/COUNT\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'COUNT("$1")')
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    // plain column → default SUM
    out = `SUM("${s}")`
  }
  return out
}

function calculateDateRange(filter: DateFilter) {
  if (!filter) return undefined as undefined | { startDate: string; endDate: string }
  const today = new Date()
  const f = (d: Date) => d.toISOString().split('T')[0]
  switch (filter.type) {
    case 'today': return { startDate: f(today), endDate: f(today) }
    case 'yesterday': { const y = new Date(today); y.setDate(today.getDate() - 1); return { startDate: f(y), endDate: f(y) } }
    case 'last_7_days': { const d = new Date(today); d.setDate(today.getDate() - 6); return { startDate: f(d), endDate: f(today) } }
    case 'last_14_days': { const d = new Date(today); d.setDate(today.getDate() - 13); return { startDate: f(d), endDate: f(today) } }
    case 'last_30_days': { const d = new Date(today); d.setDate(today.getDate() - 29); return { startDate: f(d), endDate: f(today) } }
    case 'last_90_days': { const d = new Date(today); d.setDate(today.getDate() - 89); return { startDate: f(d), endDate: f(today) } }
    case 'current_month': { const first = new Date(today.getFullYear(), today.getMonth(), 1); return { startDate: f(first), endDate: f(today) } }
    case 'last_month': { const s = new Date(today.getFullYear(), today.getMonth() - 1, 1); const e = new Date(today.getFullYear(), today.getMonth(), 0); return { startDate: f(s), endDate: f(e) } }
    case 'custom': return { startDate: filter.startDate || f(today), endDate: filter.endDate || f(today) }
    default: { const d = new Date(today); d.setDate(today.getDate() - 29); return { startDate: f(d), endDate: f(today) } }
  }
}

const sanitizeWhere = (w?: string) => {
  if (!w) return ''
  return w.replace(/[^a-zA-Z0-9_\s=.'()\-:,]/g, '')
}

function getDateRangeFromFilters(f: unknown): { type: string; startDate?: string; endDate?: string } | undefined {
  if (!f || typeof f !== 'object') return undefined
  const maybe = (f as { dateRange?: unknown }).dateRange
  if (!maybe || typeof maybe !== 'object') return undefined
  const dr = maybe as { type?: unknown; startDate?: unknown; endDate?: unknown }
  if (typeof dr.type !== 'string') return undefined
  const out: { type: string; startDate?: string; endDate?: string } = { type: dr.type }
  if (typeof dr.startDate === 'string') out.startDate = dr.startDate
  if (typeof dr.endDate === 'string') out.endDate = dr.endDate
  return out
}

export async function POST(request: NextRequest) {
  try {
    const body: ScatterRequest = await request.json()
    const schema = body.schema || 'public'
    const table = body.table
    const dim = body.dimension
    const xMeasure = body.xMeasure
    const yMeasure = body.yMeasure
    const where = body.where
    const limit = Math.max(1, Math.min(500, body.limit ?? 100))

    if (!table || !xMeasure || !yMeasure) {
      return NextResponse.json({ success: false, error: 'Parâmetros obrigatórios ausentes (table, xMeasure, yMeasure).' }, { status: 400 })
    }

    const qSchema = sanitizeIdent(schema)
    const qTable = sanitizeIdent(table)
    const qDim = sanitizeIdent(dim)
    if (!qSchema || !qTable) {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos (schema/table).' }, { status: 400 })
    }

    const xExpr = buildMeasureExpression(xMeasure)
    const yExpr = buildMeasureExpression(yMeasure)

    // Build date WHERE
    const incomingDateFilter = body.dateFilter || getDateRangeFromFilters(body.filters)
    const dr = calculateDateRange(incomingDateFilter)
    let whereClause = ''
    if (dr) whereClause += ` AND "data_pedido" >= '${dr.startDate}' AND "data_pedido" <= '${dr.endDate}'`
    // Optional user WHERE (with placeholder substitution)
    let userWhere = sanitizeWhere(where)
    if (userWhere) {
      if (dr) {
        userWhere = userWhere
          .replace(/:start_date/gi, `'${dr.startDate}'`)
          .replace(/:end_date/gi, `'${dr.endDate}'`)
      }
      whereClause += ` AND (${userWhere})`
    }

    const qualifiedTable = `"${qSchema}"."${qTable}"`
    let sql = ''
    if (qDim) {
      sql = `SELECT "${qDim}" AS label, (${xExpr}) AS x, (${yExpr}) AS y
             FROM ${qualifiedTable}
             WHERE 1=1${whereClause}
             GROUP BY "${qDim}"
             ORDER BY label
             LIMIT ${limit}`
    } else {
      sql = `SELECT (${xExpr}) AS x, (${yExpr}) AS y
             FROM ${qualifiedTable}
             WHERE 1=1${whereClause}`
    }

    type Row = { label?: string; x: number; y: number }
    const rows = await runQuery<Row>(sql)

    // Build series for Nivo ScatterPlot
    let series: Array<{ id: string; data: Array<{ x: number; y: number; label?: string }> }> = []
    if (qDim) {
      // Single series with many labeled points
      series = [
        {
          id: qDim,
          data: rows.map(r => ({ x: Number(r.x || 0), y: Number(r.y || 0), label: String(r.label || '') })),
        },
      ]
    } else {
      const r = rows[0] || { x: 0, y: 0 }
      series = [{ id: 'All', data: [{ x: Number(r.x || 0), y: Number(r.y || 0) }] }]
    }

    return NextResponse.json({ success: true, series, sql_query: sql })
  } catch (error) {
    console.error('❌ Error in scatter API:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

