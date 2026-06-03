import type { ConnectorResourceManifest } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { TinyResourceConfig } from '@/products/integracoes/cloud/src/connectors/erp/tiny/tinyTypes'

const DEFAULT_PAGE_SIZE = 100

function pageQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    pagina: page,
    limite: pageSize,
  }
}

export const TINY_RESOURCE_CONFIGS: TinyResourceConfig[] = [
  {
    resource: 'clientes',
    path: '/contatos',
    itemKeys: ['itens', 'items', 'data', 'content', 'contatos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'fornecedores',
    path: '/contatos',
    itemKeys: ['itens', 'items', 'data', 'content', 'contatos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produtos',
    path: '/produtos',
    itemKeys: ['itens', 'items', 'data', 'content', 'produtos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'pedidos_venda',
    path: '/pedidos',
    itemKeys: ['itens', 'items', 'data', 'content', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'compras',
    path: '/ordem-compras',
    itemKeys: ['itens', 'items', 'data', 'content', 'ordem_compras', 'compras'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_receber',
    path: '/contas-receber',
    itemKeys: ['itens', 'items', 'data', 'content', 'contas_receber'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_pagar',
    path: '/contas-pagar',
    itemKeys: ['itens', 'items', 'data', 'content', 'contas_pagar'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_fiscais',
    path: '/notas',
    itemKeys: ['itens', 'items', 'data', 'content', 'notas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'estoque',
    path: '/produto-estoques',
    itemKeys: ['itens', 'items', 'data', 'content', 'produto_estoques', 'estoques'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'categorias',
    path: '/categorias',
    itemKeys: ['itens', 'items', 'data', 'content', 'categorias'],
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
