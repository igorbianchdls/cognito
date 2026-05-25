import { NextRequest } from 'next/server'

import {
  listRegisteredIntegrationProviders,
} from '@/products/integracoes/server/integrationProviderRegistry'
import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'
import { mapProviderToToolkitDefinition } from '@/products/integracoes/shared/providers/providerCatalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeDomain(value: string | null): IntegrationDomain | undefined {
  if (
    value === 'erp' ||
    value === 'crm' ||
    value === 'ecommerce' ||
    value === 'marketing' ||
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

  return Response.json({
    ok: true,
    providers,
    toolkits: providers.map(mapProviderToToolkitDefinition),
  })
}
