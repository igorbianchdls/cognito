import { ArtifactToolError, readDashboardArtifact } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import {
  findDashboardComponentDataQuery,
  type ExtractedDashboardQuery,
} from '@/products/artifacts/dashboard/query/dashboardQueryPreflight'
import { executeDashboardQuery } from '@/products/artifacts/dashboard/query/dashboardQueryService'

type JsonRecord = Record<string, unknown>

export type DashboardQueryPreviewColumnProfile = {
  name: string
  type: 'number' | 'date' | 'boolean' | 'text' | 'mixed'
  nullCount: number
  min?: number | string
  max?: number | string
  avg?: number
  topValues?: Array<{ value: unknown; count: number }>
}

export type DashboardQueryPreviewProfile = {
  rowCount: number
  sampleCount: number
  columns: DashboardQueryPreviewColumnProfile[]
}

export type DashboardQueryPreviewResult = {
  ok: boolean
  componentId: string
  componentType: string | null
  status: 'success' | 'empty' | 'error'
  code: string
  message: string | null
  columns: string[]
  rowCount: number
  sampleRows: JsonRecord[]
  profile?: DashboardQueryPreviewProfile
  metadata?: {
    durationMs?: number
    bytesProcessed?: number
  }
  details?: unknown
}

const SENSITIVE_FIELD_PATTERN = /\b(email|e-mail|mail|cpf|cnpj|telefone|phone|celular|whatsapp|documento|document|tax_id|ssn)\b/i
const MAX_SAMPLE_LIMIT = 20
const DEFAULT_SAMPLE_LIMIT = 5
const MAX_STRING_LENGTH = 160

function normalizeSampleLimit(value: unknown) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_SAMPLE_LIMIT
  return Math.min(parsed, MAX_SAMPLE_LIMIT)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function decimalRecordToNumber(value: JsonRecord) {
  const sign = Number(value.s)
  const exponent = Number(value.e)
  const coefficient = value.c
  if (
    (sign !== 1 && sign !== -1)
    || !Number.isInteger(exponent)
    || !Array.isArray(coefficient)
    || !coefficient.every((item) => Number.isInteger(Number(item)) && Number(item) >= 0 && Number(item) <= 9)
  ) {
    return null
  }

  const digits = coefficient.map(String).join('')
  if (!digits) return 0
  const decimalIndex = exponent + 1
  const unsigned = decimalIndex <= 0
    ? `0.${'0'.repeat(Math.abs(decimalIndex))}${digits}`
    : decimalIndex >= digits.length
      ? `${digits}${'0'.repeat(decimalIndex - digits.length)}`
      : `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`
  const numericValue = Number(`${sign < 0 ? '-' : ''}${unsigned}`)
  return Number.isFinite(numericValue) ? numericValue : null
}

function normalizePreviewScalar(value: unknown): unknown {
  if (!value || typeof value !== 'object' || value instanceof Date || Array.isArray(value)) return value
  if (isPlainRecord(value)) {
    const decimalValue = decimalRecordToNumber(value)
    if (decimalValue != null) return decimalValue
  }
  const proto = Object.getPrototypeOf(value)
  if (!proto || proto === Object.prototype) return value
  const stringValue = typeof value.toString === 'function' ? value.toString() : ''
  if (!stringValue || stringValue === '[object Object]') return value
  const numericValue = Number(stringValue)
  return Number.isFinite(numericValue) ? numericValue : stringValue
}

function maskSensitiveValue(value: unknown) {
  if (value == null) return value
  const text = String(value)
  if (!text) return ''
  if (text.includes('@')) {
    const [name, domain] = text.split('@')
    const visibleName = name ? `${name.slice(0, 2)}***` : '***'
    const visibleDomain = domain ? `@${domain.replace(/^(.{2}).*?(\.[^.]+)?$/, '$1***$2')}` : ''
    return `${visibleName}${visibleDomain}`
  }
  const digits = text.replace(/\D/g, '')
  if (digits.length >= 6) return `***${digits.slice(-4)}`
  return '***'
}

function truncateText(value: string) {
  return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value
}

function sanitizeCell(key: string, value: unknown): unknown {
  const normalizedValue = normalizePreviewScalar(value)
  if (SENSITIVE_FIELD_PATTERN.test(key)) return maskSensitiveValue(value)
  if (typeof normalizedValue === 'string') return truncateText(normalizedValue)
  if (Array.isArray(normalizedValue)) return normalizedValue.slice(0, 20).map((item) => sanitizeCell(key, item))
  if (isPlainRecord(normalizedValue)) {
    const output: JsonRecord = {}
    for (const [childKey, childValue] of Object.entries(normalizedValue)) {
      output[childKey] = sanitizeCell(childKey, childValue)
    }
    return output
  }
  return normalizedValue
}

function sanitizeRows(rows: JsonRecord[]) {
  return rows.map((row) => {
    const output: JsonRecord = {}
    for (const [key, value] of Object.entries(row)) {
      output[key] = sanitizeCell(key, value)
    }
    return output
  })
}

function inferValueType(value: unknown): DashboardQueryPreviewColumnProfile['type'] | null {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (value instanceof Date) return 'date'
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/.test(value) && !Number.isNaN(Date.parse(value))) {
      return 'date'
    }
    return 'text'
  }
  return 'mixed'
}

function comparableDateValue(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString()
  return null
}

function buildProfile(rows: JsonRecord[], columns: string[]): DashboardQueryPreviewProfile {
  const columnProfiles = columns.map((column): DashboardQueryPreviewColumnProfile => {
    const values = rows.map((row) => row[column])
    const nullCount = values.filter((value) => value == null || value === '').length
    const observedTypes = new Set(
      values
        .map(inferValueType)
        .filter((value): value is DashboardQueryPreviewColumnProfile['type'] => Boolean(value)),
    )
    const type = observedTypes.size === 1 ? [...observedTypes][0] : observedTypes.size > 1 ? 'mixed' : 'text'

    if (type === 'number') {
      const numbers = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      const sum = numbers.reduce((acc, value) => acc + value, 0)
      return {
        name: column,
        type,
        nullCount,
        min: numbers.length ? Math.min(...numbers) : undefined,
        max: numbers.length ? Math.max(...numbers) : undefined,
        avg: numbers.length ? sum / numbers.length : undefined,
      }
    }

    if (type === 'date') {
      const dates = values.map(comparableDateValue).filter((value): value is string => Boolean(value)).sort()
      return {
        name: column,
        type,
        nullCount,
        min: dates[0],
        max: dates[dates.length - 1],
      }
    }

    const counts = new Map<string, { value: unknown; count: number }>()
    for (const value of values) {
      if (value == null || value === '') continue
      const safeValue = sanitizeCell(column, value)
      const key = JSON.stringify(safeValue)
      const current = counts.get(key)
      if (current) current.count += 1
      else counts.set(key, { value: safeValue, count: 1 })
    }
    return {
      name: column,
      type,
      nullCount,
      topValues: [...counts.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    }
  })

  return {
    rowCount: rows.length,
    sampleCount: rows.length,
    columns: columnProfiles,
  }
}

function buildComponentError(input: {
  componentId: string
  code: string
  message: string
  status?: number
}) {
  return new ArtifactToolError(input.status || 400, input.code, input.message, {
    component_id: input.componentId,
  })
}

function componentWithoutQueryError(componentId: string) {
  return buildComponentError({
    componentId,
    code: 'dashboard_query_component_without_query',
    message: `Componente sem dataQuery.query: ${componentId}`,
  })
}

async function readDashboardSource(input: {
  artifactId: string
  tenantId: number
}) {
  const artifact = await readDashboardArtifact({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    kind: 'draft',
  })
  return String((artifact as JsonRecord).source || '')
}

function findComponentQuery(source: string, componentId: string): ExtractedDashboardQuery {
  const component = findDashboardComponentDataQuery(source, componentId)
  if (!component.found) {
    throw buildComponentError({
      componentId,
      code: 'dashboard_query_component_not_found',
      message: `Componente não encontrado: ${componentId}`,
      status: 404,
    })
  }
  const query = component.query
  if (!query) throw componentWithoutQueryError(componentId)
  if (!query.query.trim()) throw componentWithoutQueryError(componentId)
  return query
}

export async function previewDashboardQuery(input: {
  artifactId: string
  tenantId: number
  componentId: string
  sampleLimit?: number | null
  includeProfile?: boolean
  actorId?: number | null
}): Promise<DashboardQueryPreviewResult> {
  const componentId = String(input.componentId || '').trim()
  if (!componentId) {
    throw new ArtifactToolError(400, 'dashboard_query_component_id_required', 'componentId é obrigatório')
  }

  const source = await readDashboardSource({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
  })
  const query = findComponentQuery(source, componentId)
  const sampleLimit = normalizeSampleLimit(input.sampleLimit)
  const result = await executeDashboardQuery({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    actorId: input.actorId,
    query: query.query,
    filters: query.filters,
    limit: sampleLimit,
  })

  const rows = sanitizeRows(result.rows as JsonRecord[])
  const status = result.count > 0 ? 'success' : 'empty'
  return {
    ok: true,
    componentId,
    componentType: query.componentType,
    status,
    code: status === 'empty' ? 'dashboard_query_empty' : 'dashboard_query_ok',
    message: null,
    columns: result.columns,
    rowCount: result.count,
    sampleRows: rows,
    profile: input.includeProfile === false ? undefined : buildProfile(rows, result.columns),
    metadata: result.metadata,
  }
}

export function normalizeDashboardQueryPreviewError(input: {
  componentId: string
  error: unknown
}): DashboardQueryPreviewResult {
  const artifactError = input.error instanceof ArtifactToolError ? input.error : null
  return {
    ok: false,
    componentId: input.componentId,
    componentType: null,
    status: 'error',
    code: artifactError?.code || 'dashboard_query_unknown_error',
    message: input.error instanceof Error ? input.error.message : String(input.error),
    columns: [],
    rowCount: 0,
    sampleRows: [],
    details: artifactError?.details,
  }
}
