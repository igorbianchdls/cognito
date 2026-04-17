import type { ToolUIPart } from 'ai'
import type { CrudRow, CrudToolViewModel } from '@/products/chat/shared/tools/crud/types'

type JsonRecord = Record<string, unknown>

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function stripFirstResourceBlock(resource: string): string {
  const slashIdx = resource.indexOf('/')
  if (slashIdx !== -1) {
    const rest = resource.slice(slashIdx + 1).trim()
    return rest || resource
  }

  const knownNamespaces = new Set([
    'vendas',
    'financeiro',
    'compras',
    'contabilidade',
    'estoque',
    'rh',
    'servicos',
  ])

  const hyphenIdx = resource.indexOf('-')
  if (hyphenIdx === -1) return resource

  const first = resource.slice(0, hyphenIdx).trim().toLowerCase()
  if (!knownNamespaces.has(first)) return resource

  const rest = resource.slice(hyphenIdx + 1).trim()
  return rest || resource
}

function humanizeLabel(value: string): string {
  return value
    .replace(/[\/_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function asCrudRows(value: unknown): CrudRow[] | null {
  if (!Array.isArray(value)) return null
  if (value.length === 0) return []
  return value.every((item) => isRecord(item)) ? (value as CrudRow[]) : null
}

function extractCrudRows(outputRaw: unknown): CrudRow[] | null {
  const output = parseMaybeJson(outputRaw)
  const direct = asCrudRows(output)
  if (direct) return direct
  if (!isRecord(output)) return null

  const candidates: unknown[] = [
    output.rows,
    output.items,
    output.data,
    output.result,
  ]

  if (isRecord(output.data)) {
    candidates.push(output.data.rows, output.data.items)
  }
  if (isRecord(output.result)) {
    candidates.push(output.result.rows, output.result.items, output.result.data)
  }

  for (const candidate of candidates) {
    const rows = asCrudRows(candidate)
    if (rows) return rows
  }

  return null
}

function extractCrudContainers(outputRaw: unknown): JsonRecord[] {
  const output = parseMaybeJson(outputRaw)
  const containers: JsonRecord[] = []
  if (isRecord(output)) containers.push(output)
  if (isRecord(output) && isRecord(output.result)) containers.push(output.result)
  if (isRecord(output) && isRecord(output.data)) containers.push(output.data)
  return containers
}

function inferColumns(rows: CrudRow[]): string[] {
  return rows.reduce<string[]>((acc, row) => {
    for (const key of Object.keys(row)) {
      if (!acc.includes(key)) acc.push(key)
    }
    return acc
  }, [])
}

export function getCrudToolHeaderType(inputRaw: unknown, fallbackType: string): ToolUIPart['type'] {
  const input = parseMaybeJson(inputRaw)
  if (!isRecord(input)) return fallbackType as ToolUIPart['type']

  const action = toNonEmptyString(input.action)
  const resource = toNonEmptyString(input.resource)
  if (!action || !resource) return fallbackType as ToolUIPart['type']

  const label = `${action}_${stripFirstResourceBlock(resource)}`
  return `tool-${label}` as ToolUIPart['type']
}

export function extractCrudToolViewModel(inputRaw: unknown, outputRaw: unknown): CrudToolViewModel | null {
  const rows = extractCrudRows(outputRaw)
  if (!rows) return null

  const input = parseMaybeJson(inputRaw)
  const containers = extractCrudContainers(outputRaw)
  const action = isRecord(input) ? toNonEmptyString(input.action) : null
  const resource = isRecord(input) ? toNonEmptyString(input.resource) : null

  let title: string | null = null
  let message: string | null = null
  let count: number | null = null
  let sqlQuery: string | null = null
  let error: string | null = null
  let ok = true

  for (const container of containers) {
    if (!title) title = toNonEmptyString(container.title)
    if (!message) message = toNonEmptyString(container.message)
    if (!sqlQuery) sqlQuery = toNonEmptyString(container.sql_query)
    if (!error) error = toNonEmptyString(container.error)
    if (count == null) {
      const candidate = Number(container.count)
      if (Number.isFinite(candidate)) count = candidate
    }
    if (typeof container.ok === 'boolean') ok = container.ok
    else if (typeof container.success === 'boolean') ok = container.success
  }

  if (!title) {
    const actionLabel = action ? humanizeLabel(action) : 'Consultar'
    const resourceLabel = resource ? humanizeLabel(stripFirstResourceBlock(resource)) : 'registros'
    title = `${actionLabel} ${resourceLabel}`.trim()
  }

  return {
    ok,
    title,
    message,
    rows,
    columns: inferColumns(rows),
    count: count ?? rows.length,
    sqlQuery,
    error,
  }
}
