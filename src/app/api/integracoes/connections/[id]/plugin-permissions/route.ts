import { NextRequest } from 'next/server'

import {
  getIntegrationConnection,
  getIntegrationPluginPermissions,
  upsertIntegrationPluginPermissions,
} from '@/products/integracoes/server/integrationConnectionRepository'
import {
  assertCanManageIntegrationConnection,
  IntegrationApiAuthError,
} from '@/products/integracoes/server/integrationApiAuth'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const { tenantId, authMode } = await resolveIntegrationTenant(req, {
      requestedTenantId: req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'),
      access: 'manage',
    })
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })
    if (authMode === 'api_token') assertCanManageIntegrationConnection(req, connection)

    const permissions = await getIntegrationPluginPermissions(id, tenantId)
    return Response.json({
      ok: true,
      permissions: permissions || {
        id: '',
        tenantId,
        connectionId: id,
        enabled: false,
        readResources: [],
        liveReadResources: [],
        writeResources: [],
        destructiveResources: [],
        requireConfirmation: true,
        metadata: {},
        createdAt: '',
        updatedAt: '',
      },
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof IntegrationApiAuthError) {
      return Response.json({ ok: false, code: error.code, error: error.message }, { status: error.status })
    }
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao carregar permissoes do plugin' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const { tenantId, authMode } = await resolveIntegrationTenant(req, {
      requestedTenantId: payload.tenantId || payload.tenant_id || req.nextUrl.searchParams.get('tenantId'),
      access: 'manage',
    })
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })
    if (authMode === 'api_token') assertCanManageIntegrationConnection(req, connection)

    const permissions = await upsertIntegrationPluginPermissions({
      tenantId,
      connectionId: id,
      enabled: payload.enabled == null ? undefined : Boolean(payload.enabled),
      requireConfirmation: payload.requireConfirmation == null && payload.require_confirmation == null
        ? undefined
        : Boolean(payload.requireConfirmation ?? payload.require_confirmation),
      metadata: {
        ...asRecord(payload.metadata ?? payload.metadata_json),
        updatedBy: 'integracoes-api',
        updatedAt: new Date().toISOString(),
      },
    })

    return Response.json({ ok: true, permissions })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof IntegrationApiAuthError) {
      return Response.json({ ok: false, code: error.code, error: error.message }, { status: error.status })
    }
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao salvar permissoes do plugin' },
      { status: 500 },
    )
  }
}
