import type { SocialResourceConfig } from '@/products/integracoes/connectors/social/common/socialConnector'

const DEFAULT_PAGE_SIZE = 50

function orgUrn(credentials: { organizationUrn?: string }) {
  const value = credentials.organizationUrn || process.env.LINKEDIN_ORGANIZATION_URN || process.env.LINKEDIN_ORGANIZATION_ID
  if (!value) return 'urn:li:organization:0'
  return value.startsWith('urn:') ? value : `urn:li:organization:${value}`
}

function pageQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    start: (page - 1) * pageSize,
    count: pageSize,
  }
}

function dateRangeQuery() {
  return {
    timeGranularityType: 'DAY',
    dateRange: process.env.LINKEDIN_DATE_RANGE,
  }
}

export const LINKEDIN_RESOURCES: SocialResourceConfig[] = [
  {
    resource: 'profiles',
    path: '/v2/organizationAcls',
    itemKeys: ['elements'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: ({ page, pageSize }) => ({
      q: 'roleAssignee',
      projection: '(elements*(organization~(id,localizedName,vanityName,logoV2),role,state),paging)',
      ...pageQuery({ page, pageSize }),
    }),
  },
  {
    resource: 'posts',
    path: '/v2/ugcPosts',
    itemKeys: ['elements'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: ({ page, pageSize, credentials }) => ({
      q: 'authors',
      authors: `List(${orgUrn(credentials)})`,
      sortBy: 'LAST_MODIFIED',
      ...pageQuery({ page, pageSize }),
    }),
  },
  {
    resource: 'videos',
    path: '/v2/ugcPosts',
    itemKeys: ['elements'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: ({ page, pageSize, credentials }) => ({
      q: 'authors',
      authors: `List(${orgUrn(credentials)})`,
      sortBy: 'LAST_MODIFIED',
      ...pageQuery({ page, pageSize }),
    }),
    transformItems: (items) => items.filter((item) => JSON.stringify(item).toLowerCase().includes('video')),
  },
  {
    resource: 'comments',
    path: '/v2/socialActions',
    itemKeys: ['comments.elements', 'elements'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: ({ page, pageSize }) => ({
      q: 'comments',
      ...pageQuery({ page, pageSize }),
    }),
  },
  {
    resource: 'audience_daily',
    path: '/v2/organizationalEntityFollowerStatistics',
    itemKeys: ['elements'],
    defaultPageSize: 100,
    supportsIncremental: true,
    buildQuery: ({ credentials }) => ({
      q: 'organizationalEntity',
      organizationalEntity: orgUrn(credentials),
      ...dateRangeQuery(),
    }),
  },
  {
    resource: 'performance_daily',
    path: '/v2/organizationPageStatistics',
    itemKeys: ['elements'],
    defaultPageSize: 100,
    supportsIncremental: true,
    buildQuery: ({ credentials }) => ({
      q: 'organization',
      organization: orgUrn(credentials),
      ...dateRangeQuery(),
    }),
  },
  {
    resource: 'engagement_daily',
    path: '/v2/organizationalEntityShareStatistics',
    itemKeys: ['elements'],
    defaultPageSize: 100,
    supportsIncremental: true,
    buildQuery: ({ credentials }) => ({
      q: 'organizationalEntity',
      organizationalEntity: orgUrn(credentials),
      ...dateRangeQuery(),
    }),
  },
]
