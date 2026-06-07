export type IntegrationDomain =
  | 'erp'
  | 'crm'
  | 'ecommerce'
  | 'analytics'
  | 'marketing'
  | 'advertising'
  | 'database'
  | 'bi'
  | 'automation'

export type IntegrationAuthType = 'oauth2' | 'api_key' | 'basic' | 'manual'

export type IntegrationSyncMode = 'manual' | 'scheduled' | 'webhook'

export type IntegrationResource = {
  slug: string
  name: string
  description: string
  defaultEnabled: boolean
}

export type IntegrationProvider = {
  slug: string
  toolkitSlug: string
  domain: IntegrationDomain
  name: string
  description: string
  authType: IntegrationAuthType
  supportsOAuthCallback: boolean
  supportsIncrementalSync: boolean
  syncModes: IntegrationSyncMode[]
  resources: IntegrationResource[]
  tags: string[]
}

export function normalizeProviderSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function normalizeToolkitSlug(slug: string): string {
  return slug.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}
