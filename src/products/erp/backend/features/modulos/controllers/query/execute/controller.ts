import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type DataQuery = {
  query?: string
  xField?: string
  yField?: string
  keyField?: string
  filters?: Record<string, unknown>
  limit?: number
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function toFiniteNumber(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function normalizeParamValue(value: unknown): unknown {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') {
    return value.trim() === '' ? null : value
  }
  if (Array.isArray(value)) {
    const normalized = value.map((item) => normalizeParamValue(item)).filter((item) => item !== null)
    return normalized.length ? normalized : null
  }
  return value
}

function normalizeAndAssertSafeSelectQuery(sql: string): string {
  const cleaned = sql.trim().replace(/;+\s*$/g, '')
  if (!cleaned) {
    throw new Error('query vazia')
  }
  if (cleaned.includes(';')) {
    throw new Error('apenas uma query é permitida')
  }
  if (/\$\d+/.test(cleaned)) {
    throw new Error('placeholders posicionais ($1, $2, ...) não são permitidos; use {{nome_parametro}}')
  }
  if (!/^\s*(select|with)\b/i.test(cleaned)) {
    throw new Error('somente SELECT/CTE (WITH) é permitido')
  }
  const blocked =
    /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|vacuum|call|do|copy|merge|execute|prepare|deallocate)\b/i
  if (blocked.test(cleaned)) {
    throw new Error('query contém comando não permitido')
  }
  return cleaned
}

function bindNamedParams(sql: string, paramsSource: Record<string, unknown>) {
  const params: unknown[] = []
  const compiled = sql.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, rawName: string) => {
    const name = String(rawName || '').trim()
    const value = normalizeParamValue(paramsSource[name])
    params.push(value)
    return `$${params.length}`
  })
  return { sql: compiled, params }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const dqRaw = body?.dataQuery as unknown
    if (!isObject(dqRaw)) {
      return Response.json({ success: false, message: 'dataQuery inválido' }, { status: 400 })
    }

    const dq = dqRaw as DataQuery
    const rawQuery = typeof dq.query === 'string' ? dq.query.trim() : ''
    if (!rawQuery) {
      return Response.json({ success: false, message: 'dataQuery.query é obrigatório' }, { status: 400 })
    }
    const query = normalizeAndAssertSafeSelectQuery(rawQuery)

    const tenantId = resolveTenantId(req.headers)
    const rawFilters = isObject(dq.filters) ? dq.filters : {}
    const filters: Record<string, unknown> =
      typeof rawFilters.tenant_id === 'number' ? rawFilters : { ...rawFilters, tenant_id: tenantId }

    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(2000, limitRaw ?? 1000))

    const { sql: boundSql, params } = bindNamedParams(query, filters)
    const finalSql = `SELECT * FROM (${boundSql}) AS q LIMIT $${params.length + 1}::int`
    const finalParams = [...params, limit]

    const rawRows = await runQuery<Record<string, unknown>>(finalSql, finalParams)

    const xField = typeof dq.xField === 'string' ? dq.xField.trim() : ''
    const yField = typeof dq.yField === 'string' ? dq.yField.trim() : ''
    const keyField = typeof dq.keyField === 'string' ? dq.keyField.trim() : ''

    let rows: Array<Record<string, unknown>> = rawRows
    if (xField && yField) {
      rows = rawRows.map((r) => {
        const x = (r as Record<string, unknown>)[xField]
        const y = (r as Record<string, unknown>)[yField]
        const keyValue = keyField ? (r as Record<string, unknown>)[keyField] : x
        const numeric = toFiniteNumber(y) ?? 0
        return {
          ...r,
          key: keyValue ?? (x ?? ''),
          label: String(x ?? ''),
          value: numeric,
        }
      })
    } else if (yField) {
      rows = rawRows.map((r) => {
        const y = (r as Record<string, unknown>)[yField]
        const numeric = toFiniteNumber(y) ?? 0
        return {
          ...r,
          value: numeric,
        }
      })
    }

    return Response.json({
      success: true,
      rows,
      sql_query: finalSql,
      sql_params: finalParams,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 400 },
    )
  }
}
