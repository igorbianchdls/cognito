import type { CrmResourceConfig } from '@/products/integracoes/cloud/src/connectors/crm/common/oauthRestCrmConnector'

const DEFAULT_PAGE_SIZE = 100

function startLimitQuery({ pageSize, cursor }: { page: number; pageSize: number; cursor?: Record<string, unknown> }) {
  return {
    start: typeof cursor?.start === 'number' || typeof cursor?.start === 'string' ? cursor.start : 0,
    limit: pageSize,
  }
}

export const PIPEDRIVE_RESOURCES: CrmResourceConfig[] = [
  {
    resource: 'contas',
    path: '/v1/organizations',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startLimitQuery,
  },
  {
    resource: 'contatos',
    path: '/v1/persons',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startLimitQuery,
  },
  {
    resource: 'leads',
    path: '/v1/leads',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startLimitQuery,
  },
  {
    resource: 'oportunidades',
    path: '/v1/deals',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startLimitQuery,
  },
  {
    resource: 'atividades',
    path: '/v1/activities',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startLimitQuery,
  },
  {
    resource: 'usuarios',
    path: '/v1/users',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: startLimitQuery,
  },
  {
    resource: 'pipelines',
    path: '/v1/pipelines',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: startLimitQuery,
  },
  {
    resource: 'fases_pipeline',
    path: '/v1/stages',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: startLimitQuery,
  },
]
