import type { SocialResourceConfig } from '@/products/integracoes/connectors/social/common/socialConnector'

const DEFAULT_PAGE_SIZE = 50

function channelId(credentials: { channelId?: string }) {
  return credentials.channelId || process.env.YOUTUBE_CHANNEL_ID || 'mine'
}

function dateRange() {
  return {
    startDate: process.env.YOUTUBE_ANALYTICS_START_DATE || new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10),
    endDate: process.env.YOUTUBE_ANALYTICS_END_DATE || new Date().toISOString().slice(0, 10),
  }
}

export const YOUTUBE_RESOURCES: SocialResourceConfig[] = [
  {
    resource: 'profiles',
    path: '/youtube/v3/channels',
    itemKeys: ['items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: ({ credentials }) => ({
      part: 'snippet,statistics,contentDetails',
      mine: channelId(credentials) === 'mine' ? true : undefined,
      id: channelId(credentials) !== 'mine' ? channelId(credentials) : undefined,
      maxResults: 1,
    }),
  },
  {
    resource: 'videos',
    path: '/youtube/v3/search',
    itemKeys: ['items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: ({ pageSize, cursor, credentials }) => ({
      part: 'snippet',
      channelId: channelId(credentials) !== 'mine' ? channelId(credentials) : undefined,
      forMine: channelId(credentials) === 'mine' ? true : undefined,
      type: 'video',
      order: 'date',
      maxResults: pageSize,
      pageToken: typeof cursor?.pageToken === 'string' ? cursor.pageToken : undefined,
    }),
  },
  {
    resource: 'posts',
    path: '/youtube/v3/activities',
    itemKeys: ['items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: ({ pageSize, cursor, credentials }) => ({
      part: 'snippet,contentDetails',
      channelId: channelId(credentials) !== 'mine' ? channelId(credentials) : undefined,
      mine: channelId(credentials) === 'mine' ? true : undefined,
      maxResults: pageSize,
      pageToken: typeof cursor?.pageToken === 'string' ? cursor.pageToken : undefined,
    }),
  },
  {
    resource: 'comments',
    path: '/youtube/v3/commentThreads',
    itemKeys: ['items'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    buildQuery: ({ pageSize, cursor, credentials }) => ({
      part: 'snippet,replies',
      allThreadsRelatedToChannelId: channelId(credentials) !== 'mine' ? channelId(credentials) : undefined,
      mine: channelId(credentials) === 'mine' ? true : undefined,
      maxResults: pageSize,
      pageToken: typeof cursor?.pageToken === 'string' ? cursor.pageToken : undefined,
    }),
  },
  {
    resource: 'audience_daily',
    path: 'https://youtubeanalytics.googleapis.com/v2/reports',
    itemKeys: ['rows'],
    defaultPageSize: 200,
    supportsIncremental: true,
    buildQuery: ({ credentials }) => ({
      ids: channelId(credentials) === 'mine' ? 'channel==MINE' : `channel==${channelId(credentials)}`,
      dimensions: 'day',
      metrics: 'subscribersGained,subscribersLost',
      ...dateRange(),
    }),
  },
  {
    resource: 'performance_daily',
    path: 'https://youtubeanalytics.googleapis.com/v2/reports',
    itemKeys: ['rows'],
    defaultPageSize: 200,
    supportsIncremental: true,
    buildQuery: ({ credentials }) => ({
      ids: channelId(credentials) === 'mine' ? 'channel==MINE' : `channel==${channelId(credentials)}`,
      dimensions: 'day',
      metrics: 'views,estimatedMinutesWatched,averageViewDuration,impressions,impressionClickThroughRate',
      ...dateRange(),
    }),
  },
  {
    resource: 'engagement_daily',
    path: 'https://youtubeanalytics.googleapis.com/v2/reports',
    itemKeys: ['rows'],
    defaultPageSize: 200,
    supportsIncremental: true,
    buildQuery: ({ credentials }) => ({
      ids: channelId(credentials) === 'mine' ? 'channel==MINE' : `channel==${channelId(credentials)}`,
      dimensions: 'day',
      metrics: 'likes,comments,shares,subscribersGained',
      ...dateRange(),
    }),
  },
]
