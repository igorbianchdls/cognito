import type { ConnectorResourceManifest } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { BlingResourceConfig } from '@/products/integracoes/cloud/src/connectors/erp/bling/blingTypes'

const DEFAULT_PAGE_SIZE = 100

function pageQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    pagina: page,
    limite: pageSize,
  }
}

export const BLING_RESOURCE_CONFIGS: BlingResourceConfig[] = [
  {
    resource: 'clientes',
    path: '/contatos',
    itemKeys: ['data', 'itens', 'items', 'contatos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'fornecedores',
    path: '/contatos',
    itemKeys: ['data', 'itens', 'items', 'contatos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produtos',
    path: '/produtos',
    itemKeys: ['data', 'itens', 'items', 'produtos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'pedidos_venda',
    path: '/pedidos/vendas',
    itemKeys: ['data', 'itens', 'items', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'compras',
    path: '/pedidos/compras',
    itemKeys: ['data', 'itens', 'items', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_receber',
    path: '/contas/receber',
    itemKeys: ['data', 'itens', 'items', 'contas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_pagar',
    path: '/contas/pagar',
    itemKeys: ['data', 'itens', 'items', 'contas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_fiscais',
    path: '/nfe',
    itemKeys: ['data', 'itens', 'items', 'notas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'estoque',
    path: '/estoques/saldos',
    itemKeys: ['data', 'itens', 'items', 'saldos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'categorias',
    path: '/categorias/produtos',
    itemKeys: ['data', 'itens', 'items', 'categorias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
]

const BLING_RESOURCE_MAP = new Map(BLING_RESOURCE_CONFIGS.map((config) => [config.resource, config]))

export const BLING_RESOURCE_MANIFEST: ConnectorResourceManifest[] = BLING_RESOURCE_CONFIGS.map((config) => ({
  resource: config.resource,
  supportsIncremental: config.supportsIncremental,
  defaultPageSize: config.defaultPageSize,
  requiredFields: ['accessToken'],
}))

export function getBlingResourceConfig(resource: string): BlingResourceConfig | undefined {
  return BLING_RESOURCE_MAP.get(resource)
}

export function listBlingSupportedResources(): string[] {
  return BLING_RESOURCE_CONFIGS.map((config) => config.resource)
}
