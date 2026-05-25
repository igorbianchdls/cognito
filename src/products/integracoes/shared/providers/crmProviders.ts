import type { IntegrationProvider, IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'

export const CRM_RESOURCES: IntegrationResource[] = [
  {
    slug: 'contas',
    name: 'Contas',
    description: 'Empresas, contas e organizacoes comerciais.',
    defaultEnabled: true,
  },
  {
    slug: 'contatos',
    name: 'Contatos',
    description: 'Pessoas, emails, telefones e relacoes com contas.',
    defaultEnabled: true,
  },
  {
    slug: 'leads',
    name: 'Leads',
    description: 'Leads, origem, qualificacao e status comercial.',
    defaultEnabled: true,
  },
  {
    slug: 'oportunidades',
    name: 'Oportunidades',
    description: 'Negocios, funil, valores e datas previstas.',
    defaultEnabled: true,
  },
  {
    slug: 'atividades',
    name: 'Atividades',
    description: 'Tarefas, reunioes, ligacoes e proximas acoes.',
    defaultEnabled: false,
  },
  {
    slug: 'usuarios',
    name: 'Usuarios',
    description: 'Vendedores, responsaveis e membros do time.',
    defaultEnabled: false,
  },
  {
    slug: 'pipelines',
    name: 'Pipelines',
    description: 'Funis, etapas e configuracoes comerciais.',
    defaultEnabled: false,
  },
]

function crmProvider(
  provider: Omit<IntegrationProvider, 'domain' | 'resources' | 'syncModes' | 'supportsIncrementalSync' | 'tags'> & {
    resources?: IntegrationResource[]
    tags?: string[]
  },
): IntegrationProvider {
  return {
    ...provider,
    domain: 'crm',
    resources: provider.resources || CRM_RESOURCES,
    syncModes: ['manual', 'scheduled'],
    supportsIncrementalSync: true,
    tags: ['crm', 'vendas', 'relacionamento', ...(provider.tags || [])],
  }
}

export const CRM_PROVIDERS: IntegrationProvider[] = [
  crmProvider({
    slug: 'hubspot',
    toolkitSlug: 'HUBSPOT',
    name: 'HubSpot',
    description: 'CRM para contatos, empresas, negocios, atividades e automacao comercial.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['marketing', 'sales'],
  }),
  crmProvider({
    slug: 'pipedrive',
    toolkitSlug: 'PIPEDRIVE',
    name: 'Pipedrive',
    description: 'CRM de vendas com pipeline, negocios, atividades e previsibilidade comercial.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['pipeline', 'sales'],
  }),
  crmProvider({
    slug: 'salesforce',
    toolkitSlug: 'SALESFORCE',
    name: 'Salesforce',
    description: 'CRM corporativo para contas, contatos, leads, oportunidades e atividades.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['enterprise', 'sales'],
  }),
  crmProvider({
    slug: 'rd_station_crm',
    toolkitSlug: 'RD_STATION_CRM',
    name: 'RD Station CRM',
    description: 'CRM brasileiro para leads, contatos, oportunidades, funis e atividades.',
    authType: 'oauth2',
    supportsOAuthCallback: true,
    tags: ['brasil', 'sales'],
  }),
]

export default CRM_PROVIDERS
