export type NormalizedTableName =
  | 'clientes'
  | 'fornecedores'
  | 'produtos'
  | 'contas_receber'
  | 'contas_pagar'
  | 'vendas'
  | 'estoque_atual'

export type NormalizationInput = {
  tenantId: number
  connectionId: string
  provider: string
  resource: string
  runId?: string | null
  sourceTable: string
  rows: Record<string, unknown>[]
}

export type NormalizedRow = {
  table: NormalizedTableName
  insertId: string
  data: Record<string, unknown>
}

export type NormalizationResult = {
  provider: string
  resource: string
  status: 'normalized' | 'skipped'
  rows: NormalizedRow[]
  skippedRows: number
  message?: string
}

export type Normalizer = {
  provider: string
  normalize: (input: NormalizationInput) => NormalizationResult
}
