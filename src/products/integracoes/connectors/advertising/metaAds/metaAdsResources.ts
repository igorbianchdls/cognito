import type { ReportResourceConfig } from '@/products/integracoes/connectors/marketing/common/dateRangeReportConnector'

const DEFAULT_PAGE_SIZE = 100
const FIELDS = 'id,name,status,effective_status,created_time,updated_time'
const INSIGHT_FIELDS = 'date_start,date_stop,account_id,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,reach,clicks,spend,cpc,cpm,ctr,actions,conversions,purchase_roas'

function accountPath(credentials: { accountId?: string }, suffix: string) {
  const accountId = credentials.accountId || process.env.META_ADS_ACCOUNT_ID || 'act_missing'
  return `/${accountId}${suffix}`
}

function pagingCursor(payload: Record<string, unknown>) {
  const paging = payload.paging
  if (!paging || typeof paging !== 'object' || Array.isArray(paging)) return undefined
  const cursors = (paging as Record<string, unknown>).cursors
  if (!cursors || typeof cursors !== 'object' || Array.isArray(cursors)) return undefined
  const after = (cursors as Record<string, unknown>).after
  return typeof after === 'string' ? { after } : undefined
}

export const META_ADS_RESOURCES: ReportResourceConfig[] = [
  {
    resource: 'accounts',
    path: '/me/adaccounts',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: ({ pageSize, cursor }) => ({ limit: pageSize, after: cursor?.after as string | undefined, fields: 'id,name,account_id,account_status,currency,timezone_name' }),
    getNextCursor: pagingCursor,
  },
  {
    resource: 'campaigns',
    path: '/act_missing/campaigns',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => accountPath(credentials, '/campaigns'),
    buildQuery: ({ pageSize, cursor }) => ({ limit: pageSize, after: cursor?.after as string | undefined, fields: `${FIELDS},objective` }),
    getNextCursor: pagingCursor,
  },
  {
    resource: 'ad_groups',
    path: '/act_missing/adsets',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => accountPath(credentials, '/adsets'),
    buildQuery: ({ pageSize, cursor }) => ({ limit: pageSize, after: cursor?.after as string | undefined, fields: `${FIELDS},campaign_id,daily_budget,lifetime_budget` }),
    getNextCursor: pagingCursor,
  },
  {
    resource: 'ads',
    path: '/act_missing/ads',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => accountPath(credentials, '/ads'),
    buildQuery: ({ pageSize, cursor }) => ({ limit: pageSize, after: cursor?.after as string | undefined, fields: `${FIELDS},campaign_id,adset_id,creative` }),
    getNextCursor: pagingCursor,
  },
  {
    resource: 'insights_campaign_daily',
    path: '/act_missing/insights',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => accountPath(credentials, '/insights'),
    buildQuery: ({ pageSize, cursor, dateStart, dateEnd }) => ({
      limit: pageSize,
      after: cursor?.after as string | undefined,
      level: 'campaign',
      time_increment: 1,
      time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
      fields: INSIGHT_FIELDS,
    }),
    getNextCursor: pagingCursor,
  },
  {
    resource: 'insights_ad_daily',
    path: '/act_missing/insights',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => accountPath(credentials, '/insights'),
    buildQuery: ({ pageSize, cursor, dateStart, dateEnd }) => ({
      limit: pageSize,
      after: cursor?.after as string | undefined,
      level: 'ad',
      time_increment: 1,
      time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
      fields: INSIGHT_FIELDS,
    }),
    getNextCursor: pagingCursor,
  },
]
