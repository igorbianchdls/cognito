import type { ReportResourceConfig } from '@/products/integracoes/connectors/marketing/common/dateRangeReportConnector'

const DEFAULT_PAGE_SIZE = 1000

type GoogleAdsCredentials = {
  customerId?: string
  developerToken?: string
  loginCustomerId?: string
}

function normalizeCustomerId(value?: string) {
  return (value || process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/\D/g, '')
}

function customerPath(credentials: GoogleAdsCredentials) {
  const customerId = normalizeCustomerId(credentials.customerId)
  return `/customers/${customerId || 'missing_customer_id'}/googleAds:searchStream`
}

function headers(credentials: GoogleAdsCredentials) {
  const developerToken = credentials.developerToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
  const loginCustomerId = (credentials.loginCustomerId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/\D/g, '')
  return {
    ...(developerToken ? { 'developer-token': developerToken } : {}),
    ...(loginCustomerId ? { 'login-customer-id': loginCustomerId } : {}),
  }
}

function flattenSearchStream(items: Record<string, unknown>[]) {
  return items.flatMap((chunk) => Array.isArray(chunk.results) ? chunk.results.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)) : [])
}

function gaql(query: string) {
  return () => ({ query })
}

function datedGaql(build: (dateStart: string, dateEnd: string) => string) {
  return ({ dateStart, dateEnd }: { dateStart: string; dateEnd: string }) => ({ query: build(dateStart, dateEnd) })
}

const baseSearchResource = {
  path: '/customers/missing_customer_id/googleAds:searchStream',
  itemKeys: ['results'],
  defaultPageSize: DEFAULT_PAGE_SIZE,
  supportsIncremental: true,
  method: 'POST' as const,
  buildPath: ({ credentials }: { credentials: GoogleAdsCredentials }) => customerPath(credentials),
  headers,
  transformItems: flattenSearchStream,
}

export const GOOGLE_ADS_RESOURCES: ReportResourceConfig[] = [
  {
    resource: 'accounts',
    path: '/customers:listAccessibleCustomers',
    itemKeys: ['resourceNames'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    headers,
  },
  {
    ...baseSearchResource,
    resource: 'campaigns',
    buildBody: datedGaql((dateStart, dateEnd) => `
      SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
             metrics.impressions, metrics.clicks, metrics.cost_micros, segments.date
      FROM campaign
      WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
    `),
  },
  {
    ...baseSearchResource,
    resource: 'ad_groups',
    buildBody: datedGaql((dateStart, dateEnd) => `
      SELECT ad_group.id, ad_group.name, ad_group.status, campaign.id,
             metrics.impressions, metrics.clicks, metrics.cost_micros, segments.date
      FROM ad_group
      WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
    `),
  },
  {
    ...baseSearchResource,
    resource: 'ads',
    buildBody: datedGaql((dateStart, dateEnd) => `
      SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status, ad_group.id, campaign.id,
             metrics.impressions, metrics.clicks, metrics.cost_micros, segments.date
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
    `),
  },
  {
    ...baseSearchResource,
    resource: 'insights_campaign_daily',
    buildBody: datedGaql((dateStart, dateEnd) => `
      SELECT segments.date, campaign.id, campaign.name,
             metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM campaign
      WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
    `),
  },
  {
    ...baseSearchResource,
    resource: 'insights_ad_daily',
    buildBody: datedGaql((dateStart, dateEnd) => `
      SELECT segments.date, campaign.id, ad_group.id, ad_group_ad.ad.id,
             metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
    `),
  },
]
