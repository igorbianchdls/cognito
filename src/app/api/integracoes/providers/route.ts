import { NextRequest } from 'next/server'

import {
  listRegisteredIntegrationProviders,
} from '@/products/integracoes/server/integrationProviderRegistry'
import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'
import { mapProviderToToolkitDefinition } from '@/products/integracoes/shared/providers/providerCatalog'
import { getIntegrationProviderMcpCapabilities } from '@/products/integracoes/shared/providers/mcpProviderCapabilities'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeDomain(value: string | null): IntegrationDomain | undefined {
  if (
    value === 'erp' ||
    value === 'crm' ||
    value === 'ecommerce' ||
    value === 'analytics' ||
    value === 'marketing' ||
    value === 'advertising' ||
    value === 'database' ||
    value === 'bi' ||
    value === 'automation'
  ) {
    return value
  }

  return undefined
}

export async function GET(req: NextRequest) {
  const domain = normalizeDomain(req.nextUrl.searchParams.get('domain'))
  const providers = listRegisteredIntegrationProviders(domain)
  const providersWithCapabilities = providers.map((provider) => ({
    ...provider,
    mcpCapabilities: getIntegrationProviderMcpCapabilities(provider.slug) || null,
  }))

  return Response.json({
    ok: true,
    providers: providersWithCapabilities,
    toolkits: providers.map(mapProviderToToolkitDefinition),
  })
}
