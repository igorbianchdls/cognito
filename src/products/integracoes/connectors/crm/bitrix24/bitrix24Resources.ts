import type { CrmResourceConfig } from '@/products/integracoes/connectors/crm/common/oauthRestCrmConnector'

const DEFAULT_PAGE_SIZE = 50

function startQuery({ pageSize, cursor }: { page: number; pageSize: number; cursor?: Record<string, unknown> }) {
  return {
    start: typeof cursor?.start === 'number' || typeof cursor?.start === 'string' ? cursor.start : 0,
    limit: pageSize,
  }
}

function bitrixNextCursor(payload: Record<string, unknown>): Record<string, unknown> | undefined {
  const next = payload.next
  if (typeof next === 'number' || typeof next === 'string') return { start: next }
  return undefined
}

export const BITRIX24_RESOURCES: CrmResourceConfig[] = [
  {
    resource: 'contas',
    path: '/rest/crm.company.list.json',
    itemKeys: ['result'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startQuery,
    getNextCursor: bitrixNextCursor,
  },
  {
    resource: 'contatos',
    path: '/rest/crm.contact.list.json',
    itemKeys: ['result'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startQuery,
    getNextCursor: bitrixNextCursor,
  },
  {
    resource: 'leads',
    path: '/rest/crm.lead.list.json',
    itemKeys: ['result'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startQuery,
    getNextCursor: bitrixNextCursor,
  },
  {
    resource: 'oportunidades',
    path: '/rest/crm.deal.list.json',
    itemKeys: ['result'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startQuery,
    getNextCursor: bitrixNextCursor,
  },
  {
    resource: 'atividades',
    path: '/rest/crm.activity.list.json',
    itemKeys: ['result'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: startQuery,
    getNextCursor: bitrixNextCursor,
  },
  {
    resource: 'usuarios',
    path: '/rest/user.get.json',
    itemKeys: ['result'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: startQuery,
    getNextCursor: bitrixNextCursor,
  },
  {
    resource: 'pipelines',
    path: '/rest/crm.category.list.json',
    itemKeys: ['result.categories', 'result'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: ({ pageSize, cursor }) => ({
      entityTypeId: 2,
      start: typeof cursor?.start === 'number' || typeof cursor?.start === 'string' ? cursor.start : 0,
      limit: pageSize,
    }),
    getNextCursor: bitrixNextCursor,
  },
  {
    resource: 'fases_pipeline',
    path: '/rest/crm.status.list.json',
    itemKeys: ['result'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: ({ pageSize, cursor }) => ({
      'filter[ENTITY_ID]': 'DEAL_STAGE',
      start: typeof cursor?.start === 'number' || typeof cursor?.start === 'string' ? cursor.start : 0,
      limit: pageSize,
    }),
    getNextCursor: bitrixNextCursor,
  },
]
