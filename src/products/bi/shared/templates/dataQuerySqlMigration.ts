import { getAppsTableCatalog } from '@/products/bi/shared/queryCatalog'

type AnyRecord = Record<string, unknown>

type LegacyDataQuery = {
  model?: unknown
  dimension?: unknown
  dimensionExpr?: unknown
  measure?: unknown
  filters?: unknown
  orderBy?: unknown
  query?: unknown
  xField?: unknown
  yField?: unknown
  keyField?: unknown
  limit?: unknown
}

const IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/i

function isObject(value: unknown): value is AnyRecord {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

function normalizeMeasureExpression(raw: string): string {
  let next = raw.trim()
  next = next.replace(/^COUNT\(\s*\)$/i, 'COUNT(*)')
  next = next.replace(/^COUNT_DISTINCT\(\s*(.+?)\s*\)$/i, 'COUNT(DISTINCT $1)')
  // Remove aliases antigos (ex.: p.valor_total -> valor_total)
  next = next.replace(/\b[a-z_][a-z0-9_]*\.([a-z_][a-z0-9_]*)\b/gi, '$1')
  return next
}

function findCanonicalMeasureFromCatalog(model: string, measure: string): string {
  const catalog = getAppsTableCatalog(model)
  if (!catalog) return normalizeMeasureExpression(measure)

  const normalizedInput = normalizeMeasureExpression(measure).toLowerCase().replace(/\s+/g, '')
  let best: string | null = null
  let bestScore = Number.POSITIVE_INFINITY

  for (const metric of catalog.metrics) {
    const all = metric.legacyMeasures || []
    const normalizedCandidates = all.map((expr) => normalizeMeasureExpression(expr))
    const hasMatch = normalizedCandidates.some((expr) => expr.toLowerCase().replace(/\s+/g, '') === normalizedInput)
    if (!hasMatch) continue

    for (const candidate of normalizedCandidates) {
      const dotCount = (candidate.match(/\./g) || []).length
      const score = dotCount * 1000 + candidate.length
      if (score < bestScore) {
        bestScore = score
        best = candidate
      }
    }
  }

  return best || normalizeMeasureExpression(measure)
}

function inferKeyColumn(model: string, dimension: string): string {
  if (!dimension) return ''
  if (dimension.endsWith('_id')) return dimension
  const catalog = getAppsTableCatalog(model)
  const candidate = `${dimension}_id`
  if (catalog?.filters?.some((f) => f.field === candidate)) return candidate
  return ''
}

function extractStoreFilterKey(pathValue: unknown): string {
  const path = asString(pathValue)
  if (!path.startsWith('filters.')) return ''
  const rest = path.slice('filters.'.length)
  const first = rest.split('.').map((s) => s.trim()).filter(Boolean)[0] || ''
  return first
}

function collectTemplateFilterKeys(node: unknown, out: Set<string>) {
  if (Array.isArray(node)) {
    for (const item of node) collectTemplateFilterKeys(item, out)
    return
  }
  if (!isObject(node)) return

  const storeKey = extractStoreFilterKey(node.storePath)
  if (storeKey) out.add(storeKey)

  const filterField = asString(node.filterField)
  if (filterField && IDENTIFIER_RE.test(filterField)) out.add(filterField)

  for (const value of Object.values(node)) collectTemplateFilterKeys(value, out)
}

function appendGenericFilterPredicate(parts: string[], key: string) {
  if (!IDENTIFIER_RE.test(key)) return
  const safeKey = escapeSqlLiteral(key)
  parts.push(`(
        {{${key}}} IS NULL
        OR NOT (to_jsonb(src) ? '${safeKey}')
        OR (
          NULLIF(regexp_replace({{${key}}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
          OR (to_jsonb(src)->>'${safeKey}') = ANY(
            string_to_array(regexp_replace({{${key}}}::text, '[{}[:space:]]', '', 'g'), ',')
          )
        )
      )`)
}

function appendRangePredicate(parts: string[], key: string, op: '>=' | '<=') {
  if (!IDENTIFIER_RE.test(key)) return
  const base = key.slice(0, -4)
  if (!IDENTIFIER_RE.test(base)) return
  const safeBase = escapeSqlLiteral(base)
  parts.push(`(
        {{${key}}} IS NULL
        OR NOT (to_jsonb(src) ? '${safeBase}')
        OR NULLIF((to_jsonb(src)->>'${safeBase}'), '')::numeric ${op} {{${key}}}::numeric
      )`)
}

function buildWhereClause(model: string, explicitFilterKeys: Iterable<string>): string {
  const catalog = getAppsTableCatalog(model)
  const filterKeys = new Set<string>(explicitFilterKeys)
  filterKeys.add('tenant_id')

  const parts: string[] = []
  const defaultTimeField = asString(catalog?.defaultTimeField)
  if (defaultTimeField && IDENTIFIER_RE.test(defaultTimeField)) {
    parts.push(`({{de}} IS NULL OR src.${defaultTimeField}::date >= {{de}}::date)`)
    parts.push(`({{ate}} IS NULL OR src.${defaultTimeField}::date <= {{ate}}::date)`)
  }

  const orderedKeys = Array.from(filterKeys)
    .map((k) => asString(k))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  for (const key of orderedKeys) {
    if (key === 'de' || key === 'ate' || key === 'dateRange') continue
    if (key.endsWith('_min') && IDENTIFIER_RE.test(key.slice(0, -4))) {
      appendRangePredicate(parts, key, '>=')
      continue
    }
    if (key.endsWith('_max') && IDENTIFIER_RE.test(key.slice(0, -4))) {
      appendRangePredicate(parts, key, '<=')
      continue
    }
    appendGenericFilterPredicate(parts, key)
  }

  if (!parts.length) return ''
  return `WHERE\n      ${parts.join('\n      AND ')}`
}

function convertLegacyDataQuery(dqRaw: AnyRecord, templateFilterKeys: Set<string>): AnyRecord {
  const dq = dqRaw as LegacyDataQuery
  const existingQuery = asString(dq.query)
  if (existingQuery) {
    return { ...dqRaw }
  }

  const model = asString(dq.model)
  const measure = asString(dq.measure)
  const dimension = asString(dq.dimension)
  const dimensionExpr = asString(dq.dimensionExpr)
  if (!model || !measure) {
    return { ...dqRaw }
  }

  const measureExpr = findCanonicalMeasureFromCatalog(model, measure)
  const hasDimension = Boolean(dimension || dimensionExpr)
  const keyColumn = dimension ? inferKeyColumn(model, dimension) : ''

  const dynamicKeys = new Set<string>(templateFilterKeys)
  if (isObject(dq.filters)) {
    for (const key of Object.keys(dq.filters)) {
      if (IDENTIFIER_RE.test(key)) dynamicKeys.add(key)
    }
  }

  const whereClause = buildWhereClause(model, dynamicKeys)

  let query = ''
  if (hasDimension) {
    const labelExpr = dimensionExpr
      ? `(${normalizeMeasureExpression(dimensionExpr)})::text`
      : `COALESCE(to_jsonb(src)->>'${escapeSqlLiteral(dimension)}', '-')`

    let keyExpr = labelExpr
    if (dimensionExpr && keyColumn) {
      keyExpr = `COALESCE(to_jsonb(src)->>'${escapeSqlLiteral(keyColumn)}', (${normalizeMeasureExpression(dimensionExpr)})::text)`
    } else if (!dimensionExpr && keyColumn && keyColumn !== dimension) {
      keyExpr = `COALESCE(to_jsonb(src)->>'${escapeSqlLiteral(keyColumn)}', COALESCE(to_jsonb(src)->>'${escapeSqlLiteral(dimension)}', '-'))`
    }

    const orderBy = isObject(dq.orderBy) ? dq.orderBy : {}
    const orderField = asString(orderBy.field)
    const dirRaw = asString(orderBy.dir).toLowerCase()
    const dir = dirRaw === 'asc' ? 'ASC' : dirRaw === 'desc' ? 'DESC' : ''
    const orderClause = dir
      ? orderField === 'measure'
        ? `ORDER BY value ${dir}`
        : orderField === 'dimension'
          ? `ORDER BY label ${dir}`
          : ''
      : ''

    query = [
      'SELECT',
      `  ${keyExpr} AS key,`,
      `  ${labelExpr} AS label,`,
      `  ${measureExpr} AS value`,
      `FROM ${model} src`,
      whereClause,
      'GROUP BY 1, 2',
      orderClause,
    ]
      .filter(Boolean)
      .join('\n')
  } else {
    query = [
      'SELECT',
      `  ${measureExpr} AS value`,
      `FROM ${model} src`,
      whereClause,
    ]
      .filter(Boolean)
      .join('\n')
  }

  const out: AnyRecord = {}
  for (const [key, value] of Object.entries(dqRaw)) {
    if (key === 'model' || key === 'dimension' || key === 'dimensionExpr' || key === 'measure' || key === 'orderBy') continue
    if (key === 'query' || key === 'xField' || key === 'yField' || key === 'keyField') continue
    out[key] = value
  }

  out.query = query
  if (hasDimension) {
    out.xField = 'label'
    out.yField = 'value'
    out.keyField = 'key'
  } else {
    out.yField = 'value'
  }

  return out
}

function walkAndConvert(node: unknown, templateFilterKeys: Set<string>): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => walkAndConvert(item, templateFilterKeys))
  }

  if (!isObject(node)) {
    return node
  }

  const out: AnyRecord = {}
  for (const [key, value] of Object.entries(node)) {
    if (key === 'dataQuery' && isObject(value)) {
      out[key] = convertLegacyDataQuery(value, templateFilterKeys)
      continue
    }
    out[key] = walkAndConvert(value, templateFilterKeys)
  }
  return out
}

export function migrateTemplateDataQueries<T>(template: T): T {
  const filterKeys = new Set<string>()
  collectTemplateFilterKeys(template, filterKeys)
  return walkAndConvert(template, filterKeys) as T
}

export function migrateTemplateTextDataQueries(templateText: string): string {
  try {
    const parsed = JSON.parse(templateText)
    const migrated = migrateTemplateDataQueries(parsed)
    return JSON.stringify(migrated, null, 2)
  } catch {
    return templateText
  }
}
