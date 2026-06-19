import { NextRequest } from 'next/server'

import {
  getIntegrationConnection,
  listIntegrationEvents,
  listIntegrationSyncRuns,
  updateIntegrationConnection,
} from '@/products/integracoes/server/integrationConnectionRepository'
import { IntegrationProviderError } from '@/products/integracoes/server/integrationProviderRegistry'
import {
  mapIntegrationEventSeverityToUi,
  mapIntegrationEventTypeToUi,
  mapSyncRunStatusToUi,
  serializeConnectionWithUi,
} from '@/products/integracoes/server/integrationStatusMapper'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'
import type { IntegrationConnectionStatus } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationSyncMode } from '@/products/integracoes/shared/providers/providerTypes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const { tenantId } = await resolveIntegrationTenant(req, {
      requestedTenantId: req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'),
      access: 'read',
    })
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })

    const runs = await listIntegrationSyncRuns({
      tenantId,
      connectionId: id,
      limit: Number(req.nextUrl.searchParams.get('runs_limit') || 20),
    })
    const events = await listIntegrationEvents({
      tenantId,
      connectionId: id,
      limit: Number(req.nextUrl.searchParams.get('events_limit') || 30),
    })

    return Response.json({
      ok: true,
      connection: serializeConnectionWithUi(connection),
      syncRuns: runs.map((run) => ({
        ...run,
        uiStatus: mapSyncRunStatusToUi(run.status),
      })),
      events: events.map((event) => ({
        ...event,
        uiEventType: mapIntegrationEventTypeToUi(event.eventType),
        uiSeverity: mapIntegrationEventSeverityToUi(event.severity),
      })),
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao carregar conexao' },
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
    const { tenantId } = await resolveIntegrationTenant(req, {
      requestedTenantId: payload.tenantId || payload.tenant_id || req.nextUrl.searchParams.get('tenantId'),
      access: 'manage',
    })

    const connection = await updateIntegrationConnection(id, tenantId, {
      displayName: payload.displayName == null && payload.display_name == null
        ? undefined
        : String(payload.displayName ?? payload.display_name),
      status: payload.status == null ? undefined : String(payload.status) as IntegrationConnectionStatus,
      selectedResources: asStringArray(payload.selectedResources ?? payload.selected_resources),
      syncFrequency: payload.syncFrequency == null && payload.sync_frequency == null
        ? undefined
        : String(payload.syncFrequency ?? payload.sync_frequency),
      syncModes: asStringArray(payload.syncModes ?? payload.sync_modes) as IntegrationSyncMode[] | undefined,
      metadata: payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
        ? payload.metadata as Record<string, unknown>
        : undefined,
    })

    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })

    return Response.json({
      ok: true,
      connection: serializeConnectionWithUi(connection),
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof IntegrationProviderError) {
      return Response.json(
        { ok: false, code: error.code, error: error.message },
        { status: error.status },
      )
    }

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao atualizar conexao' },
      { status: 500 },
    )
  }
}
