import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const SOCIAL_CONNECTORS = [
  createStubConnector({ domain: 'social', provider: 'instagram' }),
  createStubConnector({ domain: 'social', provider: 'youtube' }),
  createStubConnector({ domain: 'social', provider: 'linkedin' }),
  createStubConnector({ domain: 'social', provider: 'tiktok' }),
]
