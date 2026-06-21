import type { ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { TinyResourceConfig } from '@/products/integracoes/connectors/erp/tiny/tinyTypes'

const DEFAULT_PAGE_SIZE = 100

function envResourcePath(resource: string, fallback: string) {
  const key = `OLIST_ERP_RESOURCE_${resource.toUpperCase()}_PATH`
  return process.env[key]?.trim() || fallback
}

function pageQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    pagina: page,
    limite: pageSize,
  }
}

export const TINY_RESOURCE_CONFIGS: TinyResourceConfig[] = [
  {
    resource: 'clientes',
    path: envResourcePath('clientes', '/contatos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contatos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'fornecedores',
    path: envResourcePath('fornecedores', '/contatos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contatos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'vendedores',
    path: envResourcePath('vendedores', '/vendedores'),
    itemKeys: ['itens', 'items', 'data', 'content', 'vendedores'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produtos',
    path: envResourcePath('produtos', '/produtos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'produtos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'variacoes',
    path: envResourcePath('variacoes', '/produtos/variacoes'),
    itemKeys: ['itens', 'items', 'data', 'content', 'variacoes', 'produtos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'marcas',
    path: envResourcePath('marcas', '/marcas'),
    itemKeys: ['itens', 'items', 'data', 'content', 'marcas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'pedidos_venda',
    path: envResourcePath('pedidos_venda', '/pedidos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'itens_venda',
    path: envResourcePath('itens_venda', '/pedidos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
    transformItems: (items) => items.flatMap((pedido) => {
      const linhas = Array.isArray(pedido.itens)
        ? pedido.itens
        : Array.isArray(pedido.items)
          ? pedido.items
          : []
      return linhas
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
        .map((item) => ({ ...item, pedido_id: pedido.id, venda_id: pedido.id }))
    }),
  },
  {
    resource: 'parcelas_venda',
    path: envResourcePath('parcelas_venda', '/pedidos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
    transformItems: (items) => items.flatMap((pedido) => {
      const parcelas = Array.isArray(pedido.parcelas) ? pedido.parcelas : []
      return parcelas
        .filter((parcela): parcela is Record<string, unknown> => typeof parcela === 'object' && parcela !== null && !Array.isArray(parcela))
        .map((parcela) => ({ ...parcela, pedido_id: pedido.id, venda_id: pedido.id }))
    }),
  },
  {
    resource: 'compras',
    path: envResourcePath('compras', '/ordem-compras'),
    itemKeys: ['itens', 'items', 'data', 'content', 'ordem_compras', 'compras'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_receber',
    path: envResourcePath('contas_receber', '/contas-receber'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contas_receber'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_pagar',
    path: envResourcePath('contas_pagar', '/contas-pagar'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contas_pagar'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_fiscais',
    path: envResourcePath('notas_fiscais', '/notas'),
    itemKeys: ['itens', 'items', 'data', 'content', 'notas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_consumidor',
    path: envResourcePath('notas_consumidor', '/notas-consumidor'),
    itemKeys: ['itens', 'items', 'data', 'content', 'notas', 'nfce'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'expedicoes',
    path: envResourcePath('expedicoes', '/expedicoes'),
    itemKeys: ['itens', 'items', 'data', 'content', 'expedicoes'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'separacoes',
    path: envResourcePath('separacoes', '/separacoes'),
    itemKeys: ['itens', 'items', 'data', 'content', 'separacoes'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'estoque',
    path: envResourcePath('estoque', '/produto-estoques'),
    itemKeys: ['itens', 'items', 'data', 'content', 'produto_estoques', 'estoques'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'estoque_movimentacoes',
    path: envResourcePath('estoque_movimentacoes', '/estoques/movimentacoes'),
    itemKeys: ['itens', 'items', 'data', 'content', 'movimentacoes'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'listas_preco',
    path: envResourcePath('listas_preco', '/listas-preco'),
    itemKeys: ['itens', 'items', 'data', 'content', 'listas_preco', 'listasPreco'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'formas_envio',
    path: envResourcePath('formas_envio', '/formas-envio'),
    itemKeys: ['itens', 'items', 'data', 'content', 'formas_envio', 'formasEnvio'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'formas_pagamento',
    path: envResourcePath('formas_pagamento', '/formas-pagamento'),
    itemKeys: ['itens', 'items', 'data', 'content', 'formas_pagamento', 'formasPagamento'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'intermediadores',
    path: envResourcePath('intermediadores', '/intermediadores'),
    itemKeys: ['itens', 'items', 'data', 'content', 'intermediadores'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'categorias',
    path: envResourcePath('categorias', '/categorias'),
    itemKeys: ['itens', 'items', 'data', 'content', 'categorias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'empresa_conectada',
    path: envResourcePath('empresa_conectada', '/info'),
    itemKeys: ['itens', 'items', 'data', 'content', 'empresas', 'contas'],
    defaultPageSize: 1,
    supportsIncremental: false,
    buildQuery: () => ({}),
  },
  {
    resource: 'uso_api',
    path: envResourcePath('uso_api', '/info/uso-api'),
    itemKeys: ['itens', 'items', 'data', 'content', 'limites', 'uso'],
    defaultPageSize: 1,
    supportsIncremental: false,
    buildQuery: () => ({}),
  },
  {
    resource: 'gatilhos',
    path: envResourcePath('gatilhos', '/gatilhos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'gatilhos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
]

const TINY_RESOURCE_MAP = new Map(TINY_RESOURCE_CONFIGS.map((config) => [config.resource, config]))

export const TINY_RESOURCE_MANIFEST: ConnectorResourceManifest[] = TINY_RESOURCE_CONFIGS.map((config) => ({
  resource: config.resource,
  supportsIncremental: config.supportsIncremental,
  defaultPageSize: config.defaultPageSize,
  requiredFields: ['accessToken'],
}))

export function getTinyResourceConfig(resource: string): TinyResourceConfig | undefined {
  return TINY_RESOURCE_MAP.get(resource)
}

export function listTinySupportedResources(): string[] {
  return TINY_RESOURCE_CONFIGS.map((config) => config.resource)
}

export const OLIST_ERP_RESOURCE_CONFIGS = TINY_RESOURCE_CONFIGS
export const OLIST_ERP_RESOURCE_MANIFEST = TINY_RESOURCE_MANIFEST
export const getOlistErpResourceConfig = getTinyResourceConfig
export const listOlistErpSupportedResources = listTinySupportedResources
