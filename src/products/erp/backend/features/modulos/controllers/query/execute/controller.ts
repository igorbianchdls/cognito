import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'
import { getAppsTableCatalog } from '@/products/bi/shared/queryCatalog'

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

type QueryTableRef = {
  table: string
  alias?: string
}

function isBlankFilterValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

function isSafeSqlIdentifier(value: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)
}

function extractQueryTableRefs(sql: string): QueryTableRef[] {
  const refs: QueryTableRef[] = []
  const pattern = /\b(from|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:as\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(sql)) !== null) {
    const schema = String(match[2] || '').trim()
    const table = String(match[3] || '').trim()
    const aliasRaw = String(match[4] || '').trim()
    if (!schema || !table) continue
    refs.push({
      table: `${schema}.${table}`,
      ...(aliasRaw ? { alias: aliasRaw } : {}),
    })
  }
  return refs
}

function resolveMarkerTarget(sql: string, alias?: string): { table: string; ref: string } | null {
  const refs = extractQueryTableRefs(sql)
  if (!refs.length) return null
  if (alias) {
    const found = refs.find((entry) => entry.alias === alias)
    if (!found) return null
    return { table: found.table, ref: alias }
  }
  const primary = refs[0]
  return {
    table: primary.table,
    ref: primary.alias || primary.table,
  }
}

function buildFilterPredicate(field: string, value: unknown, ref: string): string | null {
  if (!isSafeSqlIdentifier(field)) return null
  if (field === 'tenant_id') return `${ref}.tenant_id = {{tenant_id}}`
  if (field === 'de' || field === 'ate' || field === 'dateRange' || field === 'compare_de' || field === 'compare_ate' || field === 'comparison_mode') {
    return null
  }
  if (isBlankFilterValue(value)) return null
  if (typeof value === 'object' && !Array.isArray(value)) return null
  if (Array.isArray(value)) {
    const numericArray = value.every((item) => {
      if (item === null || item === undefined || item === '') return false
      return Number.isFinite(Number(item))
    })
    const cast = numericArray ? '::int[]' : '::text[]'
    return `${ref}.${field} = ANY({{${field}}}${cast})`
  }
  return `${ref}.${field} = {{${field}}}`
}

function buildMarkerPredicates(sql: string, filters: Record<string, unknown>, alias?: string): string {
  const target = resolveMarkerTarget(sql, alias)
  if (!target) {
    throw new Error(alias ? `não foi possível resolver alias do marcador de filtros: ${alias}` : 'não foi possível resolver tabela base do marcador de filtros')
  }

  const catalog = getAppsTableCatalog(target.table)
  const allowedFields = catalog ? new Set(catalog.filters.map((filter) => filter.field)) : null
  const predicates: string[] = []

  if (!isBlankFilterValue(filters.tenant_id)) {
    predicates.push(`${target.ref}.tenant_id = {{tenant_id}}`)
  }

  for (const [field, rawValue] of Object.entries(filters)) {
    if (field === 'tenant_id' || field.startsWith('__')) continue
    if (allowedFields && !allowedFields.has(field)) continue
    const predicate = buildFilterPredicate(field, rawValue, target.ref)
    if (predicate) predicates.push(predicate)
  }

  if (predicates.length === 0) return ''
  return predicates.map((predicate, index) => `${index === 0 ? '' : '\n      '}AND ${predicate}`).join('')
}

function expandFilterMarkers(sql: string, filters: Record<string, unknown>): string {
  return sql.replace(/\{\{\s*filters(?:\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*))?\s*\}\}/g, (_, rawAlias?: string) => {
    const alias = typeof rawAlias === 'string' ? rawAlias.trim() : ''
    return buildMarkerPredicates(sql, filters, alias || undefined)
  })
}

function bindNamedParams(sql: string, paramsSource: Record<string, unknown>) {
  const params: unknown[] = []
  const paramIndexByName = new Map<string, number>()
  const compiled = sql.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, rawName: string) => {
    const name = String(rawName || '').trim()
    const lowerName = name.toLowerCase()
    const suffix = lowerName === 'de' || lowerName === 'ate' ? '::date' : ''
    const existing = paramIndexByName.get(lowerName)
    if (existing) return `$${existing}${suffix}`
    const value = normalizeParamValue(
      Object.prototype.hasOwnProperty.call(paramsSource, name)
        ? paramsSource[name]
        : paramsSource[lowerName],
    )
    params.push(value)
    const nextIndex = params.length
    paramIndexByName.set(lowerName, nextIndex)
    return `$${nextIndex}${suffix}`
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

    const expandedQuery = expandFilterMarkers(query, filters)
    const { sql: boundSql, params } = bindNamedParams(expandedQuery, filters)
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
        if (!Object.prototype.hasOwnProperty.call(r, yField)) {
          return r
        }
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
