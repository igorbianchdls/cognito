import type { ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { BlingResourceConfig } from '@/products/integracoes/connectors/erp/bling/blingTypes'

const DEFAULT_PAGE_SIZE = 100

function envResourcePath(resource: string, fallback: string) {
  const key = `BLING_RESOURCE_${resource.toUpperCase()}_PATH`
  return process.env[key]?.trim() || fallback
}

function pageQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    pagina: page,
    limite: pageSize,
  }
}

export const BLING_RESOURCE_CONFIGS: BlingResourceConfig[] = [
  {
    resource: 'clientes',
    path: envResourcePath('clientes', '/contatos'),
    itemKeys: ['data', 'itens', 'items', 'contatos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'fornecedores',
    path: envResourcePath('fornecedores', '/contatos'),
    itemKeys: ['data', 'itens', 'items', 'contatos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produtos',
    path: envResourcePath('produtos', '/produtos'),
    itemKeys: ['data', 'itens', 'items', 'produtos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'pedidos_venda',
    path: envResourcePath('pedidos_venda', '/pedidos/vendas'),
    itemKeys: ['data', 'itens', 'items', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'compras',
    path: envResourcePath('compras', '/pedidos/compras'),
    itemKeys: ['data', 'itens', 'items', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_receber',
    path: envResourcePath('contas_receber', '/contas/receber'),
    itemKeys: ['data', 'itens', 'items', 'contas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_pagar',
    path: envResourcePath('contas_pagar', '/contas/pagar'),
    itemKeys: ['data', 'itens', 'items', 'contas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_fiscais',
    path: envResourcePath('notas_fiscais', '/nfe'),
    itemKeys: ['data', 'itens', 'items', 'notas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'estoque',
    path: envResourcePath('estoque', '/estoques/saldos'),
    itemKeys: ['data', 'itens', 'items', 'saldos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'categorias',
    path: envResourcePath('categorias', '/categorias/produtos'),
    itemKeys: ['data', 'itens', 'items', 'categorias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'servicos',
    path: envResourcePath('servicos', '/servicos'),
    itemKeys: ['data', 'itens', 'items', 'servicos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_servico',
    path: envResourcePath('notas_servico', '/nfse'),
    itemKeys: ['data', 'itens', 'items', 'notas', 'nfse'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_consumidor',
    path: envResourcePath('notas_consumidor', '/nfce'),
    itemKeys: ['data', 'itens', 'items', 'notas', 'nfce'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'formas_pagamento',
    path: envResourcePath('formas_pagamento', '/formas-pagamentos'),
    itemKeys: ['data', 'itens', 'items', 'formas_pagamento', 'formasPagamento'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'vendedores',
    path: envResourcePath('vendedores', '/vendedores'),
    itemKeys: ['data', 'itens', 'items', 'vendedores'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'transportadoras',
    path: envResourcePath('transportadoras', '/transportadoras'),
    itemKeys: ['data', 'itens', 'items', 'transportadoras'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'canais_venda',
    path: envResourcePath('canais_venda', '/canais-venda'),
    itemKeys: ['data', 'itens', 'items', 'canais_venda', 'canaisVenda'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'lojas',
    path: envResourcePath('lojas', '/lojas'),
    itemKeys: ['data', 'itens', 'items', 'lojas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'categorias_receitas_despesas',
    path: envResourcePath('categorias_receitas_despesas', '/categorias/receitas-despesas'),
    itemKeys: ['data', 'itens', 'items', 'categorias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'depositos',
    path: envResourcePath('depositos', '/depositos'),
    itemKeys: ['data', 'itens', 'items', 'depositos'],
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
