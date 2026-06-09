import { NextRequest } from 'next/server'

import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'
import { getIntegrationsCloudConfig } from '@/products/integracoes/cloud/src/config/gcpConfig'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchHealth(url: string) {
  const baseUrl = url.replace(/\/+$/, '')
  if (!baseUrl) {
    return {
      ok: false,
      error: 'INTEGRATIONS_CONTROL_API_URL ausente',
    }
  }

  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const body = await response.json().catch(() => null)
    return {
      ok: response.ok,
      status: response.status,
      body,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Falha ao chamar health do control-api',
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveIntegrationTenant(req, {
      requestedTenantId: req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'),
      access: 'manage',
    })
    const config = getIntegrationsCloudConfig()
    const controlApiUrl = String(process.env.INTEGRATIONS_CONTROL_API_URL || '').trim()
    const health = await fetchHealth(controlApiUrl)

    return Response.json({
      ok: true,
      tenantId: tenant.tenantId,
      config: {
        projectId: config.projectId,
        region: config.region,
        artifactRegistryRepo: config.artifactRegistryRepo,
        controlApiUrl: controlApiUrl || null,
        bigQuery: config.bigQuery,
        pubSub: config.pubSub,
        serviceAccounts: config.serviceAccounts,
      },
      health,
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao testar GCloud' },
      { status: 500 },
    )
  }
}
