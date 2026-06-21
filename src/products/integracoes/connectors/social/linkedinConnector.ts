import { createSocialConnector } from '@/products/integracoes/connectors/social/common/socialConnector'
import { LINKEDIN_RESOURCES } from '@/products/integracoes/connectors/social/linkedin/linkedinResources'

export const linkedinConnector = createSocialConnector({
  provider: 'linkedin',
  defaultBaseUrl: 'https://api.linkedin.com',
  envBaseUrlKey: 'LINKEDIN_API_BASE_URL',
  resources: LINKEDIN_RESOURCES,
  testResource: 'profiles',
  rateLimitMs: Number(process.env.LINKEDIN_RATE_LIMIT_MS || 300),
})
