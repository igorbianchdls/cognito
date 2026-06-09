import { NextRequest } from 'next/server'

import {
  getIntegrationConnection,
  getIntegrationPluginPermissions,
  listIntegrationConnections,
} from '@/products/integracoes/server/integrationConnectionRepository'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'
import { executeConnectedErpTool } from '@/products/plugin/server/domain-adapters/erp/connectedErpService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function POST(req: NextRequest) {
  try {
    const payload = asRecord(await req.json().catch(() => ({})))
    const tenant = await resolveIntegrationTenant(req, {
      requestedTenantId: payload.tenantId || payload.tenant_id || req.nextUrl.searchParams.get('tenantId'),
      access: 'manage',
    })
    const connectionId = String(payload.connectionId || payload.connection_id || '').trim()
    const connection = connectionId
      ? await getIntegrationConnection(connectionId, tenant.tenantId)
      : (await listIntegrationConnections({
        tenantId: tenant.tenantId,
        domain: 'erp',
        provider: String(payload.provider || 'conta_azul'),
        limit: 1,
      }))[0] || null

    if (!connection) {
      return Response.json(
        { ok: false, error: 'Conexao ERP nao encontrada para teste do plugin.' },
        { status: 404 },
      )
    }

    const permissions = await getIntegrationPluginPermissions(connection.id, tenant.tenantId)
    const tool = await executeConnectedErpTool({
      provider: connection.provider,
      action: String(payload.action || 'listar'),
      resource: String(payload.resource || 'clientes'),
      limit: Number(payload.limit || 5),
      include_provider_fields: false,
    }, {
      tenantId: tenant.tenantId,
    })

    return Response.json({
      ok: true,
      toolOk: tool.success,
      tenantId: tenant.tenantId,
      connection,
      permissions,
      tool,
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao testar plugin' },
      { status: 500 },
    )
  }
}
