import type { ReportResourceConfig } from '@/products/integracoes/connectors/marketing/common/dateRangeReportConnector'

const DEFAULT_PAGE_SIZE = 10000

type Ga4Credentials = {
  propertyId?: string
}

function propertyId(credentials: Ga4Credentials) {
  return credentials.propertyId || process.env.GA4_PROPERTY_ID || process.env.GOOGLE_ANALYTICS_4_PROPERTY_ID || 'missing_property_id'
}

function reportPath(credentials: Ga4Credentials) {
  return `/properties/${propertyId(credentials)}:runReport`
}

function metadataPath(credentials: Ga4Credentials) {
  return `/properties/${propertyId(credentials)}/metadata`
}

function nextOffset(_: Record<string, unknown>, items: Record<string, unknown>[], page: number) {
  return items.length >= DEFAULT_PAGE_SIZE ? { page: page + 1 } : undefined
}

function reportBody(input: { dimensions: string[]; metrics: string[] }) {
  return ({ dateStart, dateEnd, page, pageSize }: { dateStart: string; dateEnd: string; page: number; pageSize: number }) => ({
    dateRanges: [{ startDate: dateStart, endDate: dateEnd }],
    dimensions: input.dimensions.map((name) => ({ name })),
    metrics: input.metrics.map((name) => ({ name })),
    limit: String(pageSize),
    offset: String(Math.max(page - 1, 0) * pageSize),
  })
}

const reportBase = {
  path: '/properties/missing_property_id:runReport',
  itemKeys: ['rows'],
  defaultPageSize: DEFAULT_PAGE_SIZE,
  supportsIncremental: true,
  method: 'POST' as const,
  buildPath: ({ credentials }: { credentials: Ga4Credentials }) => reportPath(credentials),
  getNextCursor: nextOffset,
}

export const GOOGLE_ANALYTICS_4_RESOURCES: ReportResourceConfig[] = [
  {
    resource: 'accounts',
    path: '/properties/missing_property_id/metadata',
    itemKeys: ['dimensions', 'metrics'],
    defaultPageSize: 1000,
    supportsIncremental: false,
    buildPath: ({ credentials }) => metadataPath(credentials),
  },
  {
    ...reportBase,
    resource: 'traffic_daily',
    buildBody: reportBody({
      dimensions: ['date'],
      metrics: ['activeUsers', 'totalUsers', 'sessions', 'screenPageViews', 'conversions'],
    }),
  },
  {
    ...reportBase,
    resource: 'pages_daily',
    buildBody: reportBody({
      dimensions: ['date', 'pagePath'],
      metrics: ['screenPageViews', 'activeUsers', 'sessions'],
    }),
  },
  {
    ...reportBase,
    resource: 'events_daily',
    buildBody: reportBody({
      dimensions: ['date', 'eventName'],
      metrics: ['eventCount', 'totalUsers'],
    }),
  },
]
