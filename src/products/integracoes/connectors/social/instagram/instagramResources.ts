import type { SocialResourceConfig } from '@/products/integracoes/connectors/social/common/socialConnector'

const DEFAULT_PAGE_SIZE = 50

function accountId(credentials: { accountId?: string }) {
  return credentials.accountId || process.env.INSTAGRAM_ACCOUNT_ID || 'me'
}

function pageQuery({ pageSize, cursor }: { pageSize: number; cursor?: Record<string, unknown> }) {
  return {
    limit: pageSize,
    after: typeof cursor?.after === 'string' || typeof cursor?.after === 'number' ? cursor.after : undefined,
  }
}

function sinceUntil() {
  return {
    since: process.env.INSTAGRAM_INSIGHTS_SINCE,
    until: process.env.INSTAGRAM_INSIGHTS_UNTIL,
  }
}

export const INSTAGRAM_RESOURCES: SocialResourceConfig[] = [
  {
    resource: 'profiles',
    path: '/me/accounts',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: ({ pageSize, cursor }) => ({
      ...pageQuery({ pageSize, cursor }),
      fields: 'id,name,username,instagram_business_account{id,username,name,profile_picture_url,followers_count,follows_count,media_count}',
    }),
  },
  {
    resource: 'posts',
    path: '/media',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `/${accountId(credentials)}/media`,
    buildQuery: ({ pageSize, cursor }) => ({
      ...pageQuery({ pageSize, cursor }),
      fields: 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count',
    }),
  },
  {
    resource: 'videos',
    path: '/media',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `/${accountId(credentials)}/media`,
    buildQuery: ({ pageSize, cursor }) => ({
      ...pageQuery({ pageSize, cursor }),
      fields: 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count',
    }),
    transformItems: (items) => items.filter((item) => ['VIDEO', 'REELS'].includes(String(item.media_type || '').toUpperCase())),
  },
  {
    resource: 'comments',
    path: '/comments',
    itemKeys: ['data'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `/${process.env.INSTAGRAM_MEDIA_ID || credentials.accountId || 'me'}/comments`,
    buildQuery: ({ pageSize, cursor }) => ({
      ...pageQuery({ pageSize, cursor }),
      fields: 'id,text,timestamp,username,like_count,replies{id,text,timestamp,username}',
    }),
  },
  {
    resource: 'audience_daily',
    path: '/insights',
    itemKeys: ['data'],
    defaultPageSize: 30,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `/${accountId(credentials)}/insights`,
    buildQuery: () => ({
      metric: 'follower_count',
      period: 'day',
      ...sinceUntil(),
    }),
  },
  {
    resource: 'performance_daily',
    path: '/insights',
    itemKeys: ['data'],
    defaultPageSize: 30,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `/${accountId(credentials)}/insights`,
    buildQuery: () => ({
      metric: 'impressions,reach,profile_views',
      period: 'day',
      ...sinceUntil(),
    }),
  },
  {
    resource: 'engagement_daily',
    path: '/insights',
    itemKeys: ['data'],
    defaultPageSize: 30,
    supportsIncremental: true,
    buildPath: ({ credentials }) => `/${accountId(credentials)}/insights`,
    buildQuery: () => ({
      metric: 'likes,comments,shares,saves',
      period: 'day',
      ...sinceUntil(),
    }),
  },
]
