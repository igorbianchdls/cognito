import { createSocialConnector } from '@/products/integracoes/connectors/social/common/socialConnector'
import { YOUTUBE_RESOURCES } from '@/products/integracoes/connectors/social/youtube/youtubeResources'

export const youtubeConnector = createSocialConnector({
  provider: 'youtube',
  defaultBaseUrl: 'https://youtube.googleapis.com',
  envBaseUrlKey: 'YOUTUBE_API_BASE_URL',
  resources: YOUTUBE_RESOURCES,
  testResource: 'profiles',
  rateLimitMs: Number(process.env.YOUTUBE_RATE_LIMIT_MS || 250),
})
