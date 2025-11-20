import { NextRequest, NextResponse } from 'next/server'
import { runQuery } from '@/lib/postgres'

// Colors for series
const SERIES_COLORS = ['#60a5fa', '#10b981', '#f59e0b', '#ef4444']

type Aggregation = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'

interface MeasureDef {
  field?: string
  aggregation?: Aggregation
  label?: string
  // Optional semantic measure mapping (not used in v1)
  measure?: 'faturamento' | 'quantidade' | 'pedidos' | 'itens'
}

interface CompareRequest {
  schema?: string
  table: string
  dimension: string
  where?: string
  limit?: number
  measure1?: MeasureDef
  measure2?: MeasureDef
  // Optional date filters passthrough (not applied in v1)
  filters?: unknown
}

const sanitizeIdent = (s?: string) => {
  if (!s) return ''
  return s.replace(/[^a-zA-Z0-9_]/g, '')
}

const sanitizeWhere = (w?: string) => {
  if (!w) return ''
  // Allow a conservative set of characters to avoid SQL injection in simple equals clauses
  const safe = w.replace(/[^a-zA-Z0-9_\s=.'()\-]/g, '')
  return safe
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json()
    const schema = body.schema || 'public'
    const table = body.table
    const dimension = body.dimension
    const where = body.where
    const limit = Math.max(1, Math.min(100, body.limit ?? 20))

    if (!table || !dimension) {
      return NextResponse.json({ success: false, error: 'Parâmetros obrigatórios ausentes (table, dimension).' }, { status: 400 })
    }

    // Defaults tailored for "novos_clientes" use case
    const m1: MeasureDef = body.measure1 || { field: 'valor_meta', aggregation: 'SUM', label: 'Meta' }
    const m2: MeasureDef = body.measure2 || { field: 'cliente_id', aggregation: 'COUNT_DISTINCT', label: 'Realizado' }

    const qSchema = sanitizeIdent(schema)
    const qTable = sanitizeIdent(table)
    const qDim = sanitizeIdent(dimension)
    if (!qSchema || !qTable || !qDim) {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos (schema/table/dimension).' }, { status: 400 })
    }

    const aggExpr = (m: MeasureDef) => {
      const field = sanitizeIdent(m.field || '')
      const agg = (m.aggregation || 'SUM') as Aggregation
      if (!field) return '0'
      if (agg === 'COUNT_DISTINCT') return `COUNT(DISTINCT "${field}")`
      if (agg === 'COUNT') return `COUNT("${field}")`
      return `${agg}("${field}")`
    }

    const m1Expr = aggExpr(m1)
    const m2Expr = aggExpr(m2)
    const whereClause = sanitizeWhere(where)

    const qualifiedTable = `"${qSchema}"."${qTable}"`
    const sql = `SELECT "${qDim}" AS label, ${m1Expr} AS m1, ${m2Expr} AS m2
                 FROM ${qualifiedTable}
                 WHERE 1=1${whereClause ? ` AND (${whereClause})` : ''}
                 GROUP BY "${qDim}"
                 ORDER BY label
                 LIMIT ${limit}`

    type Row = { label: string; m1: number; m2: number }
    const rows = await runQuery<Row>(sql)

    const items = rows.map(r => ({ label: r.label, meta: Number(r.m1 || 0), realizado: Number(r.m2 || 0) }))
    const series = [
      { key: 'meta', label: m1.label || 'Meta', color: SERIES_COLORS[0] },
      { key: 'realizado', label: m2.label || 'Realizado', color: SERIES_COLORS[1] },
    ]

    return NextResponse.json({ success: true, items, series, sql_query: sql, metadata: { schema: qSchema, table: qTable, dimension: qDim } })
  } catch (error) {
    console.error('❌ Error in compare API:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

