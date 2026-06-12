import type { ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { LinxResourceConfig } from '@/products/integracoes/connectors/erp/linx/linxTypes'

const DEFAULT_PAGE_SIZE = 100

function envResourcePath(resource: string, fallback: string) {
  const key = `LINX_RESOURCE_${resource.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_PATH`
  return process.env[key]?.trim() || fallback
}

function pageQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    page,
    pageSize,
    pagina: page,
    limite: pageSize,
  }
}

export const LINX_RESOURCE_CONFIGS: LinxResourceConfig[] = [
  {
    resource: 'clientes',
    path: envResourcePath('clientes', '/clientes'),
    itemKeys: ['data', 'items', 'itens', 'content', 'clientes'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'fornecedores',
    path: envResourcePath('fornecedores', '/fornecedores'),
    itemKeys: ['data', 'items', 'itens', 'content', 'fornecedores'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produtos',
    path: envResourcePath('produtos', '/produtos'),
    itemKeys: ['data', 'items', 'itens', 'content', 'produtos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'pedidos_venda',
    path: envResourcePath('pedidos_venda', '/vendas'),
    itemKeys: ['data', 'items', 'itens', 'content', 'vendas', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'compras',
    path: envResourcePath('compras', '/compras'),
    itemKeys: ['data', 'items', 'itens', 'content', 'compras'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_receber',
    path: envResourcePath('contas_receber', '/financeiro/contas-receber'),
    itemKeys: ['data', 'items', 'itens', 'content', 'contas_receber', 'titulos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_pagar',
    path: envResourcePath('contas_pagar', '/financeiro/contas-pagar'),
    itemKeys: ['data', 'items', 'itens', 'content', 'contas_pagar', 'titulos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_fiscais',
    path: envResourcePath('notas_fiscais', '/notas-fiscais'),
    itemKeys: ['data', 'items', 'itens', 'content', 'notas_fiscais', 'notas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'estoque',
    path: envResourcePath('estoque', '/estoques'),
    itemKeys: ['data', 'items', 'itens', 'content', 'estoques', 'saldos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'categorias',
    path: envResourcePath('categorias', '/categorias'),
    itemKeys: ['data', 'items', 'itens', 'content', 'categorias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'lojas',
    path: envResourcePath('lojas', '/lojas'),
    itemKeys: ['data', 'items', 'itens', 'content', 'lojas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'vendedores',
    path: envResourcePath('vendedores', '/vendedores'),
    itemKeys: ['data', 'items', 'itens', 'content', 'vendedores'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'formas_pagamento',
    path: envResourcePath('formas_pagamento', '/formas-pagamento'),
    itemKeys: ['data', 'items', 'itens', 'content', 'formas_pagamento'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
]

const LINX_RESOURCE_MAP = new Map(LINX_RESOURCE_CONFIGS.map((config) => [config.resource, config]))

export const LINX_RESOURCE_MANIFEST: ConnectorResourceManifest[] = LINX_RESOURCE_CONFIGS.map((config) => ({
  resource: config.resource,
  supportsIncremental: config.supportsIncremental,
  defaultPageSize: config.defaultPageSize,
  requiredFields: ['accessToken'],
}))

export function getLinxResourceConfig(resource: string): LinxResourceConfig | undefined {
  return LINX_RESOURCE_MAP.get(resource)
}

export function listLinxSupportedResources(): string[] {
  return LINX_RESOURCE_CONFIGS.map((config) => config.resource)
}
