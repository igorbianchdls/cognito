import type { SocialResourceConfig } from '@/products/integracoes/connectors/social/common/socialConnector'

const DEFAULT_PAGE_SIZE = 20

export const TIKTOK_RESOURCES: SocialResourceConfig[] = [
  {
    resource: 'profiles',
    path: '/v2/user/info/',
    itemKeys: ['data.user'],
    defaultPageSize: 1,
    supportsIncremental: false,
    buildQuery: () => ({
      fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count',
    }),
  },
  {
    resource: 'videos',
    path: '/v2/video/list/',
    itemKeys: ['data.videos', 'videos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    method: 'POST',
    buildQuery: () => ({
      fields: 'id,title,video_description,duration,cover_image_url,embed_link,share_url,create_time,view_count,like_count,comment_count,share_count',
    }),
    buildBody: ({ pageSize, cursor }) => ({
      max_count: pageSize,
      cursor: typeof cursor?.cursor === 'string' || typeof cursor?.cursor === 'number' ? cursor.cursor : undefined,
    }),
  },
  {
    resource: 'posts',
    path: '/v2/video/list/',
    itemKeys: ['data.videos', 'videos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: true,
    method: 'POST',
    buildQuery: () => ({
      fields: 'id,title,video_description,duration,cover_image_url,embed_link,share_url,create_time,view_count,like_count,comment_count,share_count',
    }),
    buildBody: ({ pageSize, cursor }) => ({
      max_count: pageSize,
      cursor: typeof cursor?.cursor === 'string' || typeof cursor?.cursor === 'number' ? cursor.cursor : undefined,
    }),
  },
]
