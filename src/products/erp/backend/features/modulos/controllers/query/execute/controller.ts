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

type DateFilterMarker = {
  table?: string
  field?: string
  mode?: 'range' | 'single' | string
  from?: string
  to?: string
  value?: string
}

type FilterFieldBinding = {
  table?: string
  field?: string
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

function extractScopedQueryTableRefs(sql: string, markerIndex?: number): QueryTableRef[] {
  if (!Number.isFinite(markerIndex)) return extractQueryTableRefs(sql)
  const stack: number[] = []
  for (let i = 0; i < Number(markerIndex); i += 1) {
    const char = sql[i]
    if (char === '(') stack.push(i + 1)
    else if (char === ')' && stack.length > 0) stack.pop()
  }
  const scopeStart = stack.length > 0 ? stack[stack.length - 1] : 0
  const scopedSql = sql.slice(scopeStart, Number(markerIndex))
  const scopedRefs = extractQueryTableRefs(scopedSql)
  return scopedRefs.length > 0 ? scopedRefs : extractQueryTableRefs(sql)
}

function resolveMarkerTarget(sql: string, alias?: string, markerIndex?: number): { table: string; ref: string } | null {
  const refs = extractScopedQueryTableRefs(sql, markerIndex)
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

function buildFilterPredicate(column: string, value: unknown, ref: string, paramName = column): string | null {
  if (!isSafeSqlIdentifier(column) || !isSafeSqlIdentifier(paramName)) return null
  if (column === 'tenant_id') return `${ref}.tenant_id = {{tenant_id}}`
  if (column === 'de' || column === 'ate' || column === 'dateRange' || column === 'compare_de' || column === 'compare_ate' || column === 'comparison_mode') {
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
    return `${ref}.${column} = ANY({{${paramName}}}${cast})`
  }
  return `${ref}.${column} = {{${paramName}}}`
}

function normalizeDateFilterMarkers(filters: Record<string, unknown>): DateFilterMarker[] {
  const raw = filters.__date
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is DateFilterMarker => isObject(entry))
  }
  if (isObject(raw)) return [raw as DateFilterMarker]
  return []
}

function normalizeFilterFieldBindings(filters: Record<string, unknown>): Record<string, FilterFieldBinding> {
  const raw = filters.__fields
  if (!isObject(raw)) return {}
  const bindings: Record<string, FilterFieldBinding> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!isObject(value)) continue
    const table = typeof value.table === 'string' ? value.table.trim() : ''
    const field = typeof value.field === 'string' ? value.field.trim() : ''
    if (!table || !field) continue
    bindings[key] = { table, field }
  }
  return bindings
}

function buildRefByTable(refs: QueryTableRef[]): Map<string, QueryTableRef> {
  const map = new Map<string, QueryTableRef>()
  for (const ref of refs) {
    if (!ref.table || map.has(ref.table)) continue
    map.set(ref.table, ref)
  }
  return map
}

function getScopedFiltersForTable(filters: Record<string, unknown>, table: string): Record<string, unknown> {
  const raw = filters.__scoped
  if (!isObject(raw)) return {}
  const parts = String(table || '')
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 2) return {}
  let current: unknown = raw
  for (const part of parts) {
    if (!isObject(current)) return {}
    current = current[part]
  }
  return isObject(current) ? current : {}
}

function collectScopedFilterLeaves(value: unknown, target: Record<string, unknown>) {
  if (!isObject(value)) return

  const entries = Object.entries(value)
  const looksLikeLeaf = entries.some(([key, entryValue]) => {
    if (key.startsWith('__')) return false
    return !isObject(entryValue)
  })

  if (looksLikeLeaf) {
    for (const [key, entryValue] of entries) {
      if (key.startsWith('__')) continue
      target[key] = entryValue
    }
    return
  }

  for (const [, child] of entries) {
    collectScopedFilterLeaves(child, target)
  }
}

function buildFilterParamSource(filters: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...filters }
  const rawScoped = filters.__scoped
  if (isObject(rawScoped)) {
    collectScopedFilterLeaves(rawScoped, merged)
  }
  return merged
}

function buildDatePredicates(
  target: { table: string; ref: string },
  filters: Record<string, unknown>,
  mode: 'current' | 'compare' = 'current',
): string[] {
  const dateMarkers = normalizeDateFilterMarkers(filters)
  if (!dateMarkers.length) return []

  const deKey = mode === 'compare' ? 'compare_de' : 'de'
  const ateKey = mode === 'compare' ? 'compare_ate' : 'ate'
  const de = typeof filters[deKey] === 'string' ? String(filters[deKey]).trim() : ''
  const ate = typeof filters[ateKey] === 'string' ? String(filters[ateKey]).trim() : ''
  const predicates: string[] = []

  for (const marker of dateMarkers) {
    const markerTable = typeof marker.table === 'string' ? marker.table.trim() : ''
    const markerField = typeof marker.field === 'string' ? marker.field.trim() : ''
    if (!markerTable || !markerField || markerTable !== target.table || !isSafeSqlIdentifier(markerField)) continue

    if (marker.mode === 'single') {
      const value =
        mode === 'compare'
          ? de
          : (typeof marker.value === 'string' ? marker.value.trim() : '')
      if (value) predicates.push(`${target.ref}.${markerField}::date = {{${deKey}}}::date`)
      continue
    }

    const fromValue = de || (typeof marker.from === 'string' ? marker.from.trim() : '')
    const toValue = ate || (typeof marker.to === 'string' ? marker.to.trim() : '')

    if (fromValue) predicates.push(`${target.ref}.${markerField}::date >= {{${deKey}}}::date`)
    if (toValue) predicates.push(`${target.ref}.${markerField}::date <= {{${ateKey}}}::date`)
  }

  return predicates
}

function buildDatePredicatesForRefs(
  refs: QueryTableRef[],
  filters: Record<string, unknown>,
  mode: 'current' | 'compare' = 'current',
): string[] {
  if (!refs.length) return []
  const refByTable = buildRefByTable(refs)
  const dateMarkers = normalizeDateFilterMarkers(filters)
  if (!dateMarkers.length) return []

  const deKey = mode === 'compare' ? 'compare_de' : 'de'
  const ateKey = mode === 'compare' ? 'compare_ate' : 'ate'
  const de = typeof filters[deKey] === 'string' ? String(filters[deKey]).trim() : ''
  const ate = typeof filters[ateKey] === 'string' ? String(filters[ateKey]).trim() : ''
  const predicates: string[] = []

  for (const marker of dateMarkers) {
    const markerTable = typeof marker.table === 'string' ? marker.table.trim() : ''
    const markerField = typeof marker.field === 'string' ? marker.field.trim() : ''
    if (!markerTable || !markerField || !isSafeSqlIdentifier(markerField)) continue
    const ref = refByTable.get(markerTable)
    if (!ref) continue
    const targetRef = ref.alias || ref.table

    if (marker.mode === 'single') {
      const value =
        mode === 'compare'
          ? de
          : (typeof marker.value === 'string' ? marker.value.trim() : '')
      if (value) predicates.push(`${targetRef}.${markerField}::date = {{${deKey}}}::date`)
      continue
    }

    const fromValue = de || (typeof marker.from === 'string' ? marker.from.trim() : '')
    const toValue = ate || (typeof marker.to === 'string' ? marker.to.trim() : '')

    if (fromValue) predicates.push(`${targetRef}.${markerField}::date >= {{${deKey}}}::date`)
    if (toValue) predicates.push(`${targetRef}.${markerField}::date <= {{${ateKey}}}::date`)
  }

  return predicates
}

function buildMarkerPredicates(
  sql: string,
  filters: Record<string, unknown>,
  alias?: string,
  opts?: { includeDate?: boolean; dateMode?: 'current' | 'compare' },
  markerIndex?: number,
): string {
  const refs = extractScopedQueryTableRefs(sql, markerIndex)
  if (!refs.length) {
    throw new Error(alias ? `não foi possível resolver alias do marcador de filtros: ${alias}` : 'não foi possível resolver tabela base do marcador de filtros')
  }

  const bindings = normalizeFilterFieldBindings(filters)
  const predicates: string[] = []

  if (alias) {
    const target = resolveMarkerTarget(sql, alias, markerIndex)
    if (!target) {
      throw new Error(`não foi possível resolver alias do marcador de filtros: ${alias}`)
    }

    const catalog = getAppsTableCatalog(target.table)
    const allowedFields = catalog ? new Set(catalog.filters.map((filter) => filter.field)) : null
    const effectiveFilters: Record<string, unknown> = {
      ...filters,
      ...getScopedFiltersForTable(filters, target.table),
    }

    if (!isBlankFilterValue(effectiveFilters.tenant_id)) {
      predicates.push(`${target.ref}.tenant_id = {{tenant_id}}`)
    }

    if (opts?.includeDate !== false) {
      predicates.push(...buildDatePredicates(target, filters, opts?.dateMode || 'current'))
    }

    for (const [field, rawValue] of Object.entries(effectiveFilters)) {
      if (field === 'tenant_id' || field.startsWith('__')) continue
      const binding = bindings[field]
      const resolvedColumn = binding?.table === target.table && binding.field ? binding.field : field
      if (allowedFields && !allowedFields.has(resolvedColumn)) continue
      const predicate = buildFilterPredicate(resolvedColumn, rawValue, target.ref, field)
      if (predicate) predicates.push(predicate)
    }
  } else {
    const refByTable = buildRefByTable(refs)
    const seenPredicateKeys = new Set<string>()

    if (opts?.includeDate !== false) {
      predicates.push(...buildDatePredicatesForRefs(refs, filters, opts?.dateMode || 'current'))
    }

    for (const ref of refs) {
      const effectiveFilters: Record<string, unknown> = {
        ...filters,
        ...getScopedFiltersForTable(filters, ref.table),
      }
      if (!isBlankFilterValue(effectiveFilters.tenant_id)) {
        const key = `${ref.table}:tenant_id`
        if (!seenPredicateKeys.has(key)) {
          seenPredicateKeys.add(key)
          predicates.push(`${ref.alias || ref.table}.tenant_id = {{tenant_id}}`)
        }
      }
    }

    const fallbackTarget = refs[0]
    const fallbackCatalog = fallbackTarget ? getAppsTableCatalog(fallbackTarget.table) : null
    const fallbackAllowedFields = fallbackCatalog ? new Set(fallbackCatalog.filters.map((filter) => filter.field)) : null

    for (const [field, rawValue] of Object.entries(filters)) {
      if (field === 'tenant_id' || field.startsWith('__')) continue
      const binding = bindings[field]
      if (binding?.table && binding?.field) {
        const ref = refByTable.get(binding.table)
        if (!ref) continue
        const catalog = getAppsTableCatalog(binding.table)
        const allowedFields = catalog ? new Set(catalog.filters.map((filter) => filter.field)) : null
        if (allowedFields && !allowedFields.has(binding.field)) continue
        const key = `${ref.table}:${field}:${binding.field}`
        if (seenPredicateKeys.has(key)) continue
        const predicate = buildFilterPredicate(binding.field, rawValue, ref.alias || ref.table, field)
        if (!predicate) continue
        seenPredicateKeys.add(key)
        predicates.push(predicate)
        continue
      }

      if (!fallbackTarget) continue
      if (fallbackAllowedFields && !fallbackAllowedFields.has(field)) continue
      const key = `${fallbackTarget.table}:${field}:${field}`
      if (seenPredicateKeys.has(key)) continue
      const predicate = buildFilterPredicate(field, rawValue, fallbackTarget.alias || fallbackTarget.table)
      if (!predicate) continue
      seenPredicateKeys.add(key)
      predicates.push(predicate)
    }
  }

  if (predicates.length === 0) return ''
  return predicates.map((predicate, index) => `${index === 0 ? '' : '\n      '}AND ${predicate}`).join('')
}

function expandFilterMarkers(sql: string, filters: Record<string, unknown>): string {
  return sql.replace(/\{\{\s*(filters(?:_no_date)?|compare_filters)(?:\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*))?\s*\}\}/g, (_, rawMarker: string, rawAlias: string | undefined, offset: number) => {
    const marker = String(rawMarker || '').trim().toLowerCase()
    const alias = typeof rawAlias === 'string' ? rawAlias.trim() : ''
    return buildMarkerPredicates(sql, filters, alias || undefined, {
      includeDate: marker !== 'filters_no_date',
      dateMode: marker === 'compare_filters' ? 'compare' : 'current',
    }, offset)
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
    const dateMarkers = normalizeDateFilterMarkers(filters)
    if (!filters.de || !filters.ate) {
      const firstSingleMarker = dateMarkers.find((marker) => marker.mode === 'single')
      if (firstSingleMarker && !filters.de) {
        const value = typeof firstSingleMarker.value === 'string' ? firstSingleMarker.value.trim() : ''
        if (value) filters.de = value
      }
      if (firstSingleMarker && !filters.ate) {
        const value = typeof firstSingleMarker.value === 'string' ? firstSingleMarker.value.trim() : ''
        if (value) filters.ate = value
      }
      const firstRangeMarker = dateMarkers.find((marker) => marker.mode !== 'single')
      if (firstRangeMarker) {
        if (!filters.de && typeof firstRangeMarker.from === 'string' && firstRangeMarker.from.trim()) {
          filters.de = firstRangeMarker.from.trim()
        }
        if (!filters.ate && typeof firstRangeMarker.to === 'string' && firstRangeMarker.to.trim()) {
          filters.ate = firstRangeMarker.to.trim()
        }
      }
    }

    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(2000, limitRaw ?? 1000))

    const expandedQuery = expandFilterMarkers(query, filters)
    const { sql: boundSql, params } = bindNamedParams(expandedQuery, buildFilterParamSource(filters))
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
