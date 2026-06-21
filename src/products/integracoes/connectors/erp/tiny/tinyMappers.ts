import type { ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'

const EXTERNAL_ID_CANDIDATES = [
  'id',
  'uuid',
  'codigo',
  'numero',
  'numeroPedido',
  'idContato',
  'contato.id',
  'cliente.id',
  'produto.id',
]

function getNestedValue(row: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    return (current as Record<string, unknown>)[key]
  }, row)
}

function getExternalId(row: Record<string, unknown>, index: number) {
  for (const key of EXTERNAL_ID_CANDIDATES) {
    const value = getNestedValue(row, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return `tiny_row_${index + 1}`
}

function mapProviderRow(input: {
  provider: 'tiny' | 'olist_erp'
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  const providerPrefix = input.provider === 'olist_erp' ? 'olist_erp' : 'tiny'
  return {
    external_id: getExternalId(input.row, input.index),
    [`${providerPrefix}_resource`]: input.resource,
    [`${providerPrefix}_page`]: input.page,
    raw: input.row,
  }
}

export function mapTinyRow(input: {
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  return mapProviderRow({ ...input, provider: 'tiny' })
}

export function mapOlistErpRow(input: {
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  return mapProviderRow({ ...input, provider: 'olist_erp' })
}

export function mapTinyRows(input: {
  resource: string
  rows: Record<string, unknown>[]
  page: number
}): ConnectorRow[] {
  return input.rows.map((row, index) => mapTinyRow({
    resource: input.resource,
    row,
    page: input.page,
    index,
  }))
}

export function mapOlistErpRows(input: {
  resource: string
  rows: Record<string, unknown>[]
  page: number
}): ConnectorRow[] {
  return input.rows.map((row, index) => mapOlistErpRow({
    resource: input.resource,
    row,
    page: input.page,
    index,
  }))
}
