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

interface MeasureRatioDef {
  numerator: MeasureDef
  denominator: MeasureDef
  label?: string
  round?: number
}

type CompareTopic = 'novos_clientes' | 'faturamento' | 'ticket_medio'

interface CompareRequest {
  schema?: string
  table: string
  dimension: string
  where?: string
  limit?: number
  // Standardized measures (preferred)
  measureGoal?: string
  measureActual?: string
  measure1?: MeasureDef
  measure2?: MeasureDef
  measure1Ratio?: MeasureRatioDef
  measure2Ratio?: MeasureRatioDef
  topic?: CompareTopic
  meta?: CompareTopic // alias para topic
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
    const incomingTopic = (body.topic ?? body.meta) as string | undefined
    const topic: CompareTopic | undefined = incomingTopic && ['novos_clientes','faturamento','ticket_medio'].includes(String(incomingTopic))
      ? (incomingTopic as CompareTopic)
      : undefined
    const m1: MeasureDef = body.measure1 || { field: 'valor_meta', aggregation: 'SUM', label: 'Meta' }
    const m2: MeasureDef = body.measure2 || { field: 'cliente_id', aggregation: 'COUNT_DISTINCT', label: 'Realizado' }
    const m1Ratio: MeasureRatioDef | undefined = body.measure1Ratio
    const m2Ratio: MeasureRatioDef | undefined = body.measure2Ratio

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

    const ratioExpr = (mr: MeasureRatioDef) => {
      const round = Number.isFinite(mr.round) ? mr.round! : 2
      const num = aggExpr(mr.numerator)
      const den = aggExpr(mr.denominator)
      return `ROUND( (${num})::numeric / NULLIF((${den})::numeric, 0), ${round} )`
    }

    let m1Expr = m1Ratio ? ratioExpr(m1Ratio) : aggExpr(m1)
    let m2Expr = m2Ratio ? ratioExpr(m2Ratio) : aggExpr(m2)

    // Preferred: dimension + measureGoal + measureActual (no agg in payload)
    if (!topic && (body.measureGoal || body.measureActual)) {
      const goal = sanitizeIdent(body.measureGoal || '')
      const actual = sanitizeIdent(body.measureActual || '')
      // Default aggregation heuristic
      const aggFor = (field: string): Aggregation => {
        if (!field) return 'SUM'
        if (field.endsWith('_id')) return 'COUNT'
        // metas devem usar MAX para evitar somar linhas repetidas
        if (field.startsWith('meta_')) return 'MAX'
        return 'SUM'
      }

      if (goal) m1Expr = aggExpr({ field: goal, aggregation: aggFor(goal) })

      if (actual === 'novos_clientes') {
        m2Expr = 'COUNT(DISTINCT "cliente_id")'
      } else if (actual === 'ticket_medio') {
        m2Expr = 'ROUND(COALESCE(SUM("subtotal"),0)::numeric / NULLIF(COUNT(DISTINCT "pedido_id"), 0), 2)'
      } else if (actual) {
        const aggA = aggFor(actual)
        if (aggA === 'COUNT') {
          m2Expr = `COUNT(DISTINCT "${actual}")`
        } else {
          m2Expr = `${aggA}("${actual}")`
        }
      }
    } else if (topic) {
      // Legacy: topic/meta
      switch (topic) {
        case 'novos_clientes':
          m1Expr = 'COALESCE(SUM("valor_meta"),0)'
          m2Expr = 'COUNT(DISTINCT "cliente_id")'
          break
        case 'faturamento':
          m1Expr = 'COALESCE(SUM("valor_meta"),0)'
          m2Expr = 'COALESCE(SUM("subtotal"),0)'
          break
        case 'ticket_medio':
          m1Expr = 'COALESCE(AVG("valor_meta"),0)'
          m2Expr = 'ROUND(COALESCE(SUM("subtotal"),0)::numeric / NULLIF(COUNT(DISTINCT "pedido_id"), 0), 2)'
          break
      }
    }
    const whereClauseUser = sanitizeWhere(where)
    // Resolve meta type from measures when topic is not provided
    let inferredTopic: CompareTopic | undefined = topic
    if (!inferredTopic && (body.measureGoal || body.measureActual)) {
      const actual = sanitizeIdent(body.measureActual || '')
      if (actual === 'novos_clientes') inferredTopic = 'novos_clientes'
      else if (actual === 'ticket_medio') inferredTopic = 'ticket_medio'
      else if (actual) inferredTopic = 'faturamento'
    }
    // Build default WHERE for topics
    // Only apply tipo_meta filter when the table actually supports it (e.g., vw_metas_detalhe)
    const applyTopic = !(qTable === 'vw_vendas_metas')
    const whereClauseTopic = applyTopic && inferredTopic ? `"tipo_meta" = '${inferredTopic}'` : ''
    const whereClause = [whereClauseTopic, whereClauseUser].filter(Boolean).join(' AND ')

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
    const defaultLabelsByTopic: Record<string, { m1: string; m2: string }> = {
      novos_clientes: { m1: 'Meta', m2: 'Realizado' },
      faturamento: { m1: 'Meta', m2: 'Realizado' },
      ticket_medio: { m1: 'Meta', m2: 'Realizado' },
    }
    const labels = topic ? defaultLabelsByTopic[topic] : undefined
    const series = [
      { key: 'meta', label: labels?.m1 || (m1Ratio?.label || m1.label) || 'Meta', color: SERIES_COLORS[0] },
      { key: 'realizado', label: labels?.m2 || (m2Ratio?.label || m2.label) || 'Realizado', color: SERIES_COLORS[1] },
    ]


    return NextResponse.json({ success: true, items, series, sql_query: sql, metadata: { schema: qSchema, table: qTable, dimension: qDim } })
  } catch (error) {
    console.error('❌ Error in compare API:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
