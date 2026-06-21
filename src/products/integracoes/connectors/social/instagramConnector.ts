import { createSocialConnector } from '@/products/integracoes/connectors/social/common/socialConnector'
import { INSTAGRAM_RESOURCES } from '@/products/integracoes/connectors/social/instagram/instagramResources'

export const instagramConnector = createSocialConnector({
  provider: 'instagram',
  defaultBaseUrl: 'https://graph.facebook.com/v19.0',
  envBaseUrlKey: 'INSTAGRAM_API_BASE_URL',
  resources: INSTAGRAM_RESOURCES,
  testResource: 'profiles',
  rateLimitMs: Number(process.env.INSTAGRAM_RATE_LIMIT_MS || 300),
})
