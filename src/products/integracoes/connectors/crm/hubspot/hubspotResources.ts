import type { CrmResourceConfig } from '@/products/integracoes/connectors/crm/common/oauthRestCrmConnector'

const DEFAULT_PAGE_SIZE = 100

function objectQuery(objectType: string, properties: string[]) {
  return ({ pageSize, cursor }: { page: number; pageSize: number; cursor?: Record<string, unknown> }) => ({
    limit: pageSize,
    after: typeof cursor?.after === 'string' || typeof cursor?.after === 'number' ? cursor.after : undefined,
    archived: false,
    properties: properties.join(','),
    associations: objectType === 'deals' ? 'companies,contacts' : undefined,
  })
}

export const HUBSPOT_RESOURCES: CrmResourceConfig[] = [
  {
    resource: 'contas',
    path: '/crm/v3/objects/companies',
    itemKeys: ['results'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: objectQuery('companies', ['name', 'domain', 'industry', 'phone', 'city', 'state', 'country', 'createdate', 'hs_lastmodifieddate']),
  },
  {
    resource: 'contatos',
    path: '/crm/v3/objects/contacts',
    itemKeys: ['results'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: objectQuery('contacts', ['firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle', 'createdate', 'lastmodifieddate']),
  },
  {
    resource: 'leads',
    path: '/crm/v3/objects/0-136',
    itemKeys: ['results'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: objectQuery('0-136', ['hs_lead_name', 'hs_pipeline', 'hs_pipeline_stage', 'hs_associated_contact_email', 'hs_createdate', 'hs_lastmodifieddate']),
  },
  {
    resource: 'oportunidades',
    path: '/crm/v3/objects/deals',
    itemKeys: ['results'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: objectQuery('deals', ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate', 'createdate', 'hs_lastmodifieddate', 'hubspot_owner_id']),
  },
  {
    resource: 'atividades',
    path: '/crm/v3/objects/tasks',
    itemKeys: ['results'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: objectQuery('tasks', ['hs_task_subject', 'hs_task_status', 'hs_task_priority', 'hs_timestamp', 'hs_createdate', 'hs_lastmodifieddate', 'hubspot_owner_id']),
  },
  {
    resource: 'usuarios',
    path: '/crm/v3/owners',
    itemKeys: ['results'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: ({ pageSize, cursor }) => ({
      limit: pageSize,
      after: typeof cursor?.after === 'string' || typeof cursor?.after === 'number' ? cursor.after : undefined,
      archived: false,
    }),
  },
  {
    resource: 'pipelines',
    path: '/crm/v3/pipelines/deals',
    itemKeys: ['results'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: () => ({}),
    getNextCursor: () => undefined,
  },
  {
    resource: 'fases_pipeline',
    path: '/crm/v3/pipelines/deals',
    itemKeys: ['results'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: () => ({}),
    getNextCursor: () => undefined,
    transformItems: (pipelines) => pipelines.flatMap((pipeline) => {
      const stages = Array.isArray(pipeline.stages) ? pipeline.stages : []
      return stages
        .filter((stage): stage is Record<string, unknown> => Boolean(stage && typeof stage === 'object' && !Array.isArray(stage)))
        .map((stage) => ({ ...stage, pipelineId: pipeline.id, pipelineLabel: pipeline.label }))
    }),
  },
]
