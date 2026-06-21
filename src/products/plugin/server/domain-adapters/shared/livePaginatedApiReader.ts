import type {
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
  ConnectedDomainRecord,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'

type JsonRecord = Record<string, unknown>

type PageResult = {
  page: number
  items: JsonRecord[]
  hasMore: boolean
  truncated: boolean
}

type PaginatedClient<Config> = {
  paginate: (
    config: Config,
    input?: {
      initialPage?: number
      cursor?: JsonRecord
      pageSize?: number
    },
  ) => AsyncGenerator<PageResult>
}

type ResourceConfig = {
  resource: string
  transformItems?: (items: JsonRecord[], payload?: JsonRecord) => JsonRecord[]
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function nestedValue(row: JsonRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined
    return current[key]
  }, row)
}

function text(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = nestedValue(row, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (isRecord(value)) {
      const nested = value.id ?? value.uuid ?? value.codigo ?? value.nome ?? value.name ?? value.label
      if (nested !== undefined && nested !== null && String(nested).trim()) return String(nested).trim()
    }
  }
  return undefined
}

function numberValue(row: JsonRecord, keys: string[]) {
  const value = text(row, keys)
  if (value === undefined) return undefined
  const parsed = Number(String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function providerId(row: JsonRecord) {
  return text(row, [
    'id',
    'uuid',
    'ID',
    'codigo',
    'codigo_omie',
    'codigo_cliente_omie',
    'codigo_produto',
    'codigo_lancamento_omie',
    'codigo_pedido',
    'numero',
  ]) || 'unknown'
}

function matchesId(row: JsonRecord, id: string) {
  const expected = id.trim()
  if (!expected) return false
  return providerId(row) === expected
}

function commonFields(resource: string, row: JsonRecord) {
  if (resource === 'clientes' || resource === 'fornecedores') {
    return {
      nome: text(row, ['nome', 'name', 'razao_social', 'razaoSocial', 'nome_fantasia', 'fantasia', 'contato.nome']),
      documento: text(row, ['documento', 'cpf_cnpj', 'cnpj_cpf', 'cnpj', 'cpf']),
      email: text(row, ['email', 'contato.email']),
      telefone: text(row, ['telefone', 'phone', 'fone', 'celular']),
      status: text(row, ['status', 'situacao', 'ativo', 'inativo']),
    }
  }

  if (resource === 'produtos' || resource === 'servicos') {
    return {
      nome: text(row, ['nome', 'name', 'descricao', 'description']),
      codigo: text(row, ['codigo', 'sku', 'codigo_sku', 'codigo_produto']),
      preco: numberValue(row, ['preco', 'preco_venda', 'valor', 'valor_unitario']),
      status: text(row, ['status', 'situacao', 'ativo']),
    }
  }

  if (resource === 'contas-a-receber' || resource === 'contas-a-pagar') {
    return {
      descricao: text(row, ['descricao', 'description', 'observacao', 'historico']),
      valor: numberValue(row, ['valor', 'valor_documento', 'valor_total', 'total']),
      data_vencimento: text(row, ['data_vencimento', 'vencimento', 'due_date']),
      status: text(row, ['status', 'situacao']),
    }
  }

  if (resource === 'pedidos-venda' || resource === 'pedidos-compra') {
    return {
      numero: text(row, ['numero', 'number', 'codigo', 'id']),
      cliente: text(row, ['cliente.nome', 'contato.nome', 'cliente', 'fornecedor.nome']),
      valor: numberValue(row, ['valor', 'total', 'valor_total']),
      data: text(row, ['data', 'data_pedido', 'data_emissao', 'date']),
      status: text(row, ['status', 'situacao']),
    }
  }

  if (resource === 'estoque-atual' || resource === 'movimentacoes-estoque') {
    return {
      produto_id: text(row, ['produto.id', 'produto_id', 'id_produto', 'codigo_produto']),
      produto: text(row, ['produto.nome', 'nome', 'descricao']),
      quantidade: numberValue(row, ['quantidade', 'saldo', 'estoque', 'available']),
      data: text(row, ['data', 'created_at', 'updated_at']),
    }
  }

  return {
    nome: text(row, ['nome', 'name', 'descricao', 'description', 'titulo', 'title']),
    status: text(row, ['status', 'situacao', 'ativo']),
    data: text(row, ['data', 'created_at', 'updated_at', 'criado_em']),
  }
}

function toDomainRecord(input: {
  provider: string
  resource: string
  row: JsonRecord
  includeProviderFields: boolean
}): ConnectedDomainRecord {
  const id = providerId(input.row)
  return {
    id: `${input.provider}:${input.resource}:${id}`,
    provider: input.provider,
    provider_id: id,
    resource: input.resource,
    fields: commonFields(input.resource, input.row),
    ...(input.includeProviderFields ? { provider_fields: input.row } : {}),
  }
}

export async function listLiveFromPaginatedApi<Resource extends string, Config extends ResourceConfig>(input: {
  provider: string
  client: PaginatedClient<Config>
  config: Config
  toolInput: ConnectedDomainAdapterInput<Resource>
}): Promise<ConnectedDomainAdapterResult> {
  const rows: ConnectedDomainRecord[] = []
  const pageSize = Math.max(1, Math.min(input.toolInput.limit, 200))
  let truncated = false

  for await (const page of input.client.paginate(input.config, { pageSize })) {
    const items = input.config.transformItems ? input.config.transformItems(page.items) : page.items
    for (const item of items) {
      rows.push(toDomainRecord({
        provider: input.provider,
        resource: input.toolInput.resource,
        row: item,
        includeProviderFields: input.toolInput.includeProviderFields,
      }))
      if (rows.length >= input.toolInput.limit) break
    }
    truncated = truncated || page.truncated || (page.hasMore && rows.length >= input.toolInput.limit)
    if (rows.length >= input.toolInput.limit) break
  }

  return {
    rows,
    columns: rows.length ? Object.keys(rows[0].fields) : [],
    count: rows.length,
    ...(truncated ? { warnings: [`Leitura live ${input.provider}/${input.toolInput.resource} limitada a ${rows.length} registros.`] } : {}),
  }
}

export async function readLiveFromPaginatedApi<Resource extends string, Config extends ResourceConfig>(input: {
  provider: string
  client: PaginatedClient<Config>
  config: Config
  toolInput: ConnectedDomainAdapterReadInput<Resource>
}): Promise<ConnectedDomainAdapterResult> {
  const maxPages = Math.max(1, Number(process.env.CONNECTED_LIVE_READ_MAX_SCAN_PAGES || 10))
  let scannedPages = 0

  for await (const page of input.client.paginate(input.config, { pageSize: 100 })) {
    scannedPages += 1
    const items = input.config.transformItems ? input.config.transformItems(page.items) : page.items
    const found = items.find((item) => matchesId(item, input.toolInput.id))
    if (found) {
      const row = toDomainRecord({
        provider: input.provider,
        resource: input.toolInput.resource,
        row: found,
        includeProviderFields: input.toolInput.includeProviderFields,
      })
      return {
        rows: [row],
        columns: Object.keys(row.fields),
        count: 1,
      }
    }
    if (!page.hasMore || scannedPages >= maxPages) break
  }

  return {
    rows: [],
    columns: [],
    count: 0,
    warnings: [`Registro ${input.toolInput.id} nao encontrado via leitura live ${input.provider}/${input.toolInput.resource}.`],
  }
}
