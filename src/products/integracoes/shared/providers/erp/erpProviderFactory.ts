import type { IntegrationProvider, IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'

export function erpProvider(
  provider: Omit<IntegrationProvider, 'domain' | 'resources' | 'syncModes' | 'supportsIncrementalSync' | 'tags'> & {
    resources: IntegrationResource[]
    supportsIncrementalSync?: boolean
    tags?: string[]
  },
): IntegrationProvider {
  return {
    ...provider,
    domain: 'erp',
    syncModes: ['manual', 'scheduled'],
    supportsIncrementalSync: provider.supportsIncrementalSync || false,
    tags: ['erp', 'financeiro', 'operacional', ...(provider.tags || [])],
  }
}
