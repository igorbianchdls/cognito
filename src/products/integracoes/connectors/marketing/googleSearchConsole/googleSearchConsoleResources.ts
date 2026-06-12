import type { ReportResourceConfig } from '@/products/integracoes/connectors/marketing/common/dateRangeReportConnector'

const DEFAULT_PAGE_SIZE = 25000

type SearchConsoleCredentials = {
  siteUrl?: string
}

function sitePath(credentials: SearchConsoleCredentials) {
  const siteUrl = credentials.siteUrl || process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || ''
  return `/sites/${encodeURIComponent(siteUrl || 'missing_site_url')}/searchAnalytics/query`
}

function nextOffset(_: Record<string, unknown>, items: Record<string, unknown>[], page: number) {
  return items.length >= DEFAULT_PAGE_SIZE ? { page: page + 1 } : undefined
}

function body(dimensions: string[]) {
  return ({ dateStart, dateEnd, page, pageSize }: { dateStart: string; dateEnd: string; page: number; pageSize: number }) => ({
    startDate: dateStart,
    endDate: dateEnd,
    dimensions,
    rowLimit: pageSize,
    startRow: Math.max(page - 1, 0) * pageSize,
  })
}

const reportBase = {
  path: '/sites/missing_site_url/searchAnalytics/query',
  itemKeys: ['rows'],
  defaultPageSize: DEFAULT_PAGE_SIZE,
  supportsIncremental: true,
  method: 'POST' as const,
  buildPath: ({ credentials }: { credentials: SearchConsoleCredentials }) => sitePath(credentials),
  getNextCursor: nextOffset,
}

export const GOOGLE_SEARCH_CONSOLE_RESOURCES: ReportResourceConfig[] = [
  {
    resource: 'accounts',
    path: '/sites',
    itemKeys: ['siteEntry'],
    defaultPageSize: 1000,
    supportsIncremental: false,
  },
  {
    ...reportBase,
    resource: 'traffic_daily',
    buildBody: body(['date']),
  },
  {
    ...reportBase,
    resource: 'pages_daily',
    buildBody: body(['date', 'page']),
  },
  {
    ...reportBase,
    resource: 'queries_daily',
    buildBody: body(['date', 'query']),
  },
]
