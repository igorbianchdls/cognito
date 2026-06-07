import type { ToolkitDefinition } from '@/products/integracoes/shared/types'
import { ADVERTISING_PROVIDERS } from '@/products/integracoes/shared/providers/advertisingProviders'
import { CRM_PROVIDERS } from '@/products/integracoes/shared/providers/crmProviders'
import { ERP_PROVIDERS } from '@/products/integracoes/shared/providers/erpProviders'
import { MARKETING_PROVIDERS } from '@/products/integracoes/shared/providers/marketingProviders'
import type { IntegrationDomain, IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'
import { normalizeProviderSlug, normalizeToolkitSlug } from '@/products/integracoes/shared/providers/providerTypes'

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  ...ERP_PROVIDERS,
  ...CRM_PROVIDERS,
  ...MARKETING_PROVIDERS,
  ...ADVERTISING_PROVIDERS,
]

export function getIntegrationProvider(slug: string): IntegrationProvider | undefined {
  const providerSlug = normalizeProviderSlug(slug)
  const toolkitSlug = normalizeToolkitSlug(slug)

  return INTEGRATION_PROVIDERS.find((provider) => {
    return provider.slug === providerSlug || provider.toolkitSlug === toolkitSlug
  })
}

export function listIntegrationProviders(domain?: IntegrationDomain): IntegrationProvider[] {
  return domain
    ? INTEGRATION_PROVIDERS.filter((provider) => provider.domain === domain)
    : INTEGRATION_PROVIDERS
}

export function mapProviderToToolkitDefinition(provider: IntegrationProvider): ToolkitDefinition {
  return {
    slug: provider.toolkitSlug,
    name: provider.name,
    description: provider.description,
  }
}

export const INTEGRATION_PROVIDER_TOOLKITS: ToolkitDefinition[] = INTEGRATION_PROVIDERS.map(
  mapProviderToToolkitDefinition,
)

export default INTEGRATION_PROVIDERS
