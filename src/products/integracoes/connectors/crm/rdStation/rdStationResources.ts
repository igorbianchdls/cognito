import type { CrmResourceConfig } from '@/products/integracoes/connectors/crm/common/oauthRestCrmConnector'

const DEFAULT_PAGE_SIZE = 100

function pageQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    page,
    limit: pageSize,
  }
}

function envPath(resource: string, fallback: string) {
  return process.env[`RD_STATION_CRM_RESOURCE_${resource.toUpperCase()}_PATH`]?.trim() || fallback
}

export const RD_STATION_RESOURCES: CrmResourceConfig[] = [
  {
    resource: 'contas',
    path: envPath('contas', '/api/v1/organizations'),
    itemKeys: ['organizations', 'data', 'items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: pageQuery,
  },
  {
    resource: 'contatos',
    path: envPath('contatos', '/api/v1/contacts'),
    itemKeys: ['contacts', 'data', 'items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: pageQuery,
  },
  {
    resource: 'leads',
    path: envPath('leads', '/api/v1/leads'),
    itemKeys: ['leads', 'data', 'items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: pageQuery,
  },
  {
    resource: 'oportunidades',
    path: envPath('oportunidades', '/api/v1/deals'),
    itemKeys: ['deals', 'data', 'items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: pageQuery,
  },
  {
    resource: 'atividades',
    path: envPath('atividades', '/api/v1/activities'),
    itemKeys: ['activities', 'tasks', 'data', 'items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: pageQuery,
  },
  {
    resource: 'usuarios',
    path: envPath('usuarios', '/api/v1/users'),
    itemKeys: ['users', 'data', 'items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'pipelines',
    path: envPath('pipelines', '/api/v1/deal_pipelines'),
    itemKeys: ['deal_pipelines', 'pipelines', 'data', 'items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'fases_pipeline',
    path: envPath('fases_pipeline', '/api/v1/deal_stages'),
    itemKeys: ['deal_stages', 'stages', 'data', 'items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
]
