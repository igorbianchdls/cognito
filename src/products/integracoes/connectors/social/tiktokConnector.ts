import { createSocialConnector } from '@/products/integracoes/connectors/social/common/socialConnector'
import { TIKTOK_RESOURCES } from '@/products/integracoes/connectors/social/tiktok/tiktokResources'

export const tiktokConnector = createSocialConnector({
  provider: 'tiktok',
  defaultBaseUrl: 'https://open.tiktokapis.com',
  envBaseUrlKey: 'TIKTOK_API_BASE_URL',
  resources: TIKTOK_RESOURCES,
  testResource: 'profiles',
  rateLimitMs: Number(process.env.TIKTOK_RATE_LIMIT_MS || 500),
})
