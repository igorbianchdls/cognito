import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'

export type IntegrationProviderPluginScopeGroup = {
  read?: string[]
  liveRead?: string[]
  write?: string[]
  destructive?: string[]
}

export type IntegrationProviderPluginResourceCapability = {
  resource: string
  liveRead: boolean
  actions: string[]
  destructiveActions?: string[]
  scopeHints?: IntegrationProviderPluginScopeGroup
}

export type IntegrationProviderPluginCapabilities = {
  provider: string
  domain: Extract<IntegrationDomain, 'erp' | 'crm'>
  credentialMode: 'oauth2' | 'api_key'
  credentialRequirements?: string[]
  scopeReviewStatus: 'planned' | 'provider_verified'
  scopeHints: IntegrationProviderPluginScopeGroup
  resources: IntegrationProviderPluginResourceCapability[]
}

const ERP_READ_RESOURCES = [
  'clientes',
  'fornecedores',
  'produtos',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'estoque-atual',
] as const

const CONTA_AZUL_ERP_READ_RESOURCES = [
  'clientes',
  'fornecedores',
  'produtos',
  'servicos',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'centros-custo',
  'contratos',
  'estoque-atual',
] as const

const OMIE_ERP_READ_RESOURCES = [
  'clientes',
  'fornecedores',
  'produtos',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'centros-custo',
  'servicos',
  'contratos',
  'estoque-atual',
] as const

const BLING_ERP_READ_RESOURCES = [
  'clientes',
  'fornecedores',
  'produtos',
  'servicos',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'estoque-atual',
] as const

const OLIST_ERP_READ_RESOURCES = [
  'clientes',
  'fornecedores',
  'vendedores',
  'produtos',
  'variacoes',
  'marcas',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'itens-venda',
  'parcelas-venda',
  'pedidos-compra',
  'notas-fiscais',
  'notas-consumidor',
  'expedicoes',
  'separacoes',
  'estoque-atual',
  'movimentacoes-estoque',
  'listas-preco',
  'formas-envio',
  'formas-pagamento',
  'intermediadores',
  'categorias',
  'empresa-conectada',
  'uso-api',
  'gatilhos',
] as const

const ERP_ACTIONS_BY_RESOURCE: Record<string, string[]> = {
  clientes: ['criar', 'atualizar', 'alterar_status'],
  fornecedores: ['criar', 'atualizar', 'alterar_status'],
  produtos: ['criar', 'atualizar', 'alterar_status'],
  'contas-a-receber': ['criar', 'atualizar', 'baixar', 'cancelar', 'estornar', 'reabrir'],
  'contas-a-pagar': ['criar', 'atualizar', 'baixar', 'cancelar', 'estornar', 'reabrir'],
  'pedidos-venda': ['criar', 'atualizar', 'cancelar', 'alterar_status'],
  'movimentacoes-estoque': ['criar', 'cancelar'],
}

const CONTA_AZUL_ERP_ACTIONS_BY_RESOURCE: Record<string, string[]> = {
  clientes: ['criar', 'atualizar'],
  fornecedores: ['criar', 'atualizar'],
  'contas-a-receber': ['criar', 'atualizar', 'baixar'],
  'contas-a-pagar': ['criar', 'atualizar', 'baixar'],
  'pedidos-venda': ['criar', 'atualizar', 'cancelar'],
  'centros-custo': ['criar'],
  produtos: ['criar', 'atualizar', 'deletar'],
  servicos: ['criar', 'atualizar'],
  contratos: ['criar', 'deletar'],
}

const OMIE_ERP_ACTIONS_BY_RESOURCE: Record<string, string[]> = {
  clientes: ['criar', 'atualizar'],
  fornecedores: ['criar', 'atualizar'],
  'contas-a-receber': ['criar', 'atualizar', 'baixar'],
  'contas-a-pagar': ['criar', 'atualizar', 'baixar'],
  'pedidos-venda': ['criar', 'atualizar', 'cancelar'],
  'centros-custo': ['criar'],
  produtos: ['criar', 'atualizar', 'deletar'],
  servicos: ['criar', 'atualizar'],
  contratos: ['criar', 'atualizar'],
}

const BLING_ERP_ACTIONS_BY_RESOURCE: Record<string, string[]> = {
  clientes: ['criar', 'atualizar'],
  fornecedores: ['criar', 'atualizar'],
  'contas-a-receber': ['criar', 'atualizar', 'baixar'],
  'contas-a-pagar': ['criar', 'atualizar', 'baixar'],
  'pedidos-venda': ['criar', 'atualizar', 'cancelar'],
  produtos: ['criar', 'atualizar', 'deletar'],
  servicos: ['criar', 'atualizar'],
}

const OLIST_ERP_ACTIONS_BY_RESOURCE: Record<string, string[]> = {
  'contas-a-receber': ['criar', 'atualizar', 'baixar'],
  'contas-a-pagar': ['criar', 'atualizar', 'baixar'],
}

const CRM_READ_RESOURCES = ['contas', 'contatos', 'leads', 'oportunidades', 'atividades'] as const

const CRM_ACTIONS_BY_RESOURCE: Record<string, string[]> = {
  contas: ['criar', 'atualizar', 'arquivar', 'reativar'],
  contatos: ['criar', 'atualizar', 'arquivar', 'reativar'],
  leads: ['criar', 'atualizar', 'converter', 'arquivar', 'reativar'],
  oportunidades: ['criar', 'atualizar', 'mover_estagio', 'ganhar', 'perder', 'reabrir', 'arquivar'],
  atividades: ['criar', 'atualizar', 'concluir', 'cancelar', 'reabrir'],
}

const DESTRUCTIVE_ACTIONS = new Set(['cancelar', 'deletar', 'estornar', 'arquivar', 'perder'])

function resourceCapabilities(
  resources: readonly string[],
  actionsByResource: Record<string, string[]>,
  liveReadResources: readonly string[] = [],
): IntegrationProviderPluginResourceCapability[] {
  const actionResources = Object.keys(actionsByResource).filter((resource) => !resources.includes(resource))

  return [...resources, ...actionResources].map((resource) => {
    const actions = actionsByResource[resource] || []
    return {
      resource,
      liveRead: liveReadResources.includes(resource),
      actions,
      destructiveActions: actions.filter((action) => DESTRUCTIVE_ACTIONS.has(action)),
    }
  })
}

const ERP_SCOPE_HINTS: Record<string, IntegrationProviderPluginScopeGroup> = {
  omie: {
    read: ['omie.read'],
    liveRead: ['omie.read'],
    write: ['omie.write'],
    destructive: ['omie.write'],
  },
  conta_azul: {
    read: ['sales.read', 'financial.read', 'customers.read', 'products.read'],
    liveRead: ['sales.read', 'financial.read', 'customers.read', 'products.read'],
    write: ['sales.write', 'financial.write', 'customers.write', 'products.write'],
    destructive: ['sales.write', 'financial.write'],
  },
  bling: {
    read: ['contacts.read', 'products.read', 'orders.read', 'finance.read', 'stock.read'],
    liveRead: ['contacts.read', 'products.read', 'orders.read', 'finance.read', 'stock.read'],
    write: ['contacts.write', 'products.write', 'orders.write', 'finance.write', 'stock.write'],
    destructive: ['orders.write', 'finance.write', 'stock.write'],
  },
  olist_erp: {
    read: ['contatos.read', 'produtos.read', 'pedidos.read', 'financeiro.read', 'estoque.read', 'fiscal.read'],
    liveRead: ['contatos.read', 'produtos.read', 'pedidos.read', 'financeiro.read', 'estoque.read', 'fiscal.read'],
    write: ['financeiro.write'],
    destructive: ['financeiro.write'],
  },
  tiny: {
    read: ['contatos.read', 'produtos.read', 'pedidos.read', 'financeiro.read', 'estoque.read', 'fiscal.read'],
    liveRead: ['contatos.read', 'produtos.read', 'pedidos.read', 'financeiro.read', 'estoque.read', 'fiscal.read'],
    write: ['financeiro.write'],
    destructive: ['financeiro.write'],
  },
}

const CRM_SCOPE_HINTS: Record<string, IntegrationProviderPluginScopeGroup> = {
  bitrix24: {
    read: ['crm'],
    liveRead: ['crm'],
    write: ['crm'],
    destructive: ['crm'],
  },
  hubspot: {
    read: [
      'crm.objects.contacts.read',
      'crm.objects.companies.read',
      'crm.objects.deals.read',
      'crm.objects.owners.read',
    ],
    liveRead: [
      'crm.objects.contacts.read',
      'crm.objects.companies.read',
      'crm.objects.deals.read',
      'crm.objects.owners.read',
    ],
    write: [
      'crm.objects.contacts.write',
      'crm.objects.companies.write',
      'crm.objects.deals.write',
    ],
    destructive: [
      'crm.objects.contacts.write',
      'crm.objects.companies.write',
      'crm.objects.deals.write',
    ],
  },
  pipedrive: {
    read: ['deals:read', 'persons:read', 'organizations:read', 'activities:read', 'users:read'],
    liveRead: ['deals:read', 'persons:read', 'organizations:read', 'activities:read', 'users:read'],
    write: ['deals:full', 'persons:full', 'organizations:full', 'activities:full'],
    destructive: ['deals:full', 'persons:full', 'organizations:full', 'activities:full'],
  },
  salesforce: {
    read: ['api', 'refresh_token'],
    liveRead: ['api', 'refresh_token'],
    write: ['api', 'refresh_token'],
    destructive: ['api', 'refresh_token'],
  },
  rd_station_crm: {
    read: ['crm.read'],
    liveRead: ['crm.read'],
    write: ['crm.write'],
    destructive: ['crm.write'],
  },
}

export const INTEGRATION_PLUGIN_PROVIDER_CAPABILITIES: IntegrationProviderPluginCapabilities[] = [
  {
    provider: 'omie',
    domain: 'erp',
    credentialMode: 'api_key',
    credentialRequirements: ['app_key', 'app_secret'],
    scopeReviewStatus: 'planned',
    scopeHints: ERP_SCOPE_HINTS.omie,
    resources: resourceCapabilities(OMIE_ERP_READ_RESOURCES, OMIE_ERP_ACTIONS_BY_RESOURCE),
  },
  {
    provider: 'conta_azul',
    domain: 'erp',
    credentialMode: 'oauth2',
    scopeReviewStatus: 'planned',
    scopeHints: ERP_SCOPE_HINTS.conta_azul,
    resources: resourceCapabilities(CONTA_AZUL_ERP_READ_RESOURCES, CONTA_AZUL_ERP_ACTIONS_BY_RESOURCE),
  },
  {
    provider: 'bling',
    domain: 'erp',
    credentialMode: 'oauth2',
    scopeReviewStatus: 'planned',
    scopeHints: ERP_SCOPE_HINTS.bling,
    resources: resourceCapabilities(BLING_ERP_READ_RESOURCES, BLING_ERP_ACTIONS_BY_RESOURCE),
  },
  {
    provider: 'olist_erp',
    domain: 'erp',
    credentialMode: 'oauth2',
    scopeReviewStatus: 'planned',
    scopeHints: ERP_SCOPE_HINTS.olist_erp,
    resources: resourceCapabilities(OLIST_ERP_READ_RESOURCES, OLIST_ERP_ACTIONS_BY_RESOURCE),
  },
  {
    provider: 'tiny',
    domain: 'erp',
    credentialMode: 'oauth2',
    scopeReviewStatus: 'planned',
    scopeHints: ERP_SCOPE_HINTS.tiny,
    resources: resourceCapabilities(OLIST_ERP_READ_RESOURCES, OLIST_ERP_ACTIONS_BY_RESOURCE),
  },
  ...(['bitrix24', 'hubspot', 'pipedrive', 'salesforce', 'rd_station_crm'] as const).map((provider) => ({
    provider,
    domain: 'crm' as const,
    credentialMode: 'oauth2' as const,
    scopeReviewStatus: 'planned' as const,
    scopeHints: CRM_SCOPE_HINTS[provider],
    resources: resourceCapabilities(CRM_READ_RESOURCES, CRM_ACTIONS_BY_RESOURCE),
  })),
]

const CAPABILITY_BY_PROVIDER = new Map(
  INTEGRATION_PLUGIN_PROVIDER_CAPABILITIES.map((capability) => [capability.provider, capability] as const),
)

export function getIntegrationProviderPluginCapabilities(provider: string) {
  return CAPABILITY_BY_PROVIDER.get(provider)
}

export function listIntegrationProviderPluginCapabilities(domain?: 'erp' | 'crm') {
  return domain
    ? INTEGRATION_PLUGIN_PROVIDER_CAPABILITIES.filter((capability) => capability.domain === domain)
    : INTEGRATION_PLUGIN_PROVIDER_CAPABILITIES
}
