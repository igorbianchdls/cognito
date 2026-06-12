import type { ReportResourceConfig } from '@/products/integracoes/connectors/marketing/common/dateRangeReportConnector'

const DEFAULT_PAGE_SIZE = 100

type GoogleBusinessCredentials = {
  accountId?: string
  storeId?: string
  locationId?: string
}

function accountName(credentials: GoogleBusinessCredentials) {
  const accountId = credentials.accountId || process.env.GOOGLE_MY_BUSINESS_ACCOUNT_ID || ''
  return accountId.startsWith('accounts/') ? accountId : `accounts/${accountId || 'missing_account_id'}`
}

function locationName(credentials: GoogleBusinessCredentials) {
  const locationId = credentials.locationId || credentials.storeId || process.env.GOOGLE_MY_BUSINESS_LOCATION_ID || ''
  return locationId.startsWith('locations/') ? locationId : `locations/${locationId || 'missing_location_id'}`
}

function pageQuery({ pageSize, cursor }: { pageSize: number; cursor?: Record<string, unknown> }) {
  return { pageSize, pageToken: cursor?.pageToken as string | undefined }
}

function nextPageToken(payload: Record<string, unknown>) {
  const token = payload.nextPageToken
  return typeof token === 'string' && token ? { pageToken: token } : undefined
}

function performanceQuery({ credentials, dateStart, dateEnd }: { credentials: GoogleBusinessCredentials; dateStart: string; dateEnd: string }) {
  const [startYear, startMonth, startDay] = dateStart.split('-').map(Number)
  const [endYear, endMonth, endDay] = dateEnd.split('-').map(Number)
  return {
    dailyMetrics: process.env.GOOGLE_MY_BUSINESS_DAILY_METRIC || 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
    'dailyRange.startDate.year': startYear,
    'dailyRange.startDate.month': startMonth,
    'dailyRange.startDate.day': startDay,
    'dailyRange.endDate.year': endYear,
    'dailyRange.endDate.month': endMonth,
    'dailyRange.endDate.day': endDay,
    location: locationName(credentials),
  }
}

export const GOOGLE_MY_BUSINESS_RESOURCES: ReportResourceConfig[] = [
  {
    resource: 'accounts',
    path: 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    itemKeys: ['accounts'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
    getNextCursor: nextPageToken,
  },
  {
    resource: 'locations',
    path: 'https://mybusinessbusinessinformation.googleapis.com/v1/accounts/missing_account_id/locations',
    itemKeys: ['locations'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName(credentials)}/locations`,
    buildQuery: ({ pageSize, cursor }) => ({
      pageSize,
      pageToken: cursor?.pageToken as string | undefined,
      readMask: 'name,title,storeCode,phoneNumbers,categories,storefrontAddress,websiteUri,regularHours,metadata',
    }),
    getNextCursor: nextPageToken,
  },
  {
    resource: 'reviews',
    path: 'https://mybusiness.googleapis.com/v4/accounts/missing_account_id/locations/missing_location_id/reviews',
    itemKeys: ['reviews'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `https://mybusiness.googleapis.com/v4/${accountName(credentials)}/${locationName(credentials)}/reviews`,
    buildQuery: pageQuery,
    getNextCursor: nextPageToken,
  },
  {
    resource: 'local_posts',
    path: 'https://mybusiness.googleapis.com/v4/accounts/missing_account_id/locations/missing_location_id/localPosts',
    itemKeys: ['localPosts'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `https://mybusiness.googleapis.com/v4/${accountName(credentials)}/${locationName(credentials)}/localPosts`,
    buildQuery: pageQuery,
    getNextCursor: nextPageToken,
  },
  {
    resource: 'traffic_daily',
    path: 'https://businessprofileperformance.googleapis.com/v1/locations/missing_location_id:fetchMultiDailyMetricsTimeSeries',
    itemKeys: ['multiDailyMetricTimeSeries'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `https://businessprofileperformance.googleapis.com/v1/${locationName(credentials)}:fetchMultiDailyMetricsTimeSeries`,
    buildQuery: performanceQuery,
  },
]
