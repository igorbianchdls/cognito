import { NextRequest } from 'next/server'

import { runQuery } from '@/lib/postgres'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type TenantSummaryRow = {
  tenant_id: string
  tenant_name: string
  tenant_slug: string | null
  members: number
  connections: number
  destinations: number
  pipelines: number
  sync_runs: number
  events: number
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveIntegrationTenant(req, {
      requestedTenantId: req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'),
      access: 'manage',
    })

    const rows = await runQuery<TenantSummaryRow>(
      `SELECT
          tenants.id::text AS tenant_id,
          tenants.name::text AS tenant_name,
          tenants.slug::text AS tenant_slug,
          (SELECT count(*)::int FROM shared.tenant_memberships WHERE tenant_id = tenants.id AND status = 'active') AS members,
          (SELECT count(*)::int FROM integrations.connections WHERE tenant_id = tenants.id) AS connections,
          (SELECT count(*)::int FROM integrations.destinations WHERE tenant_id = tenants.id) AS destinations,
          (SELECT count(*)::int FROM integrations.pipelines WHERE tenant_id = tenants.id) AS pipelines,
          (SELECT count(*)::int FROM integrations.sync_runs WHERE tenant_id = tenants.id) AS sync_runs,
          (SELECT count(*)::int FROM integrations.events WHERE tenant_id = tenants.id) AS events
        FROM shared.tenants AS tenants
        WHERE tenants.id = $1`,
      [resolved.tenantId],
    )

    return Response.json({
      ok: true,
      tenant: resolved,
      summary: rows[0] || null,
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao testar tenant' },
      { status: 500 },
    )
  }
}
