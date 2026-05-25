import { NextRequest } from 'next/server'

import {
  createIntegrationConnection,
  listIntegrationConnections,
} from '@/products/integracoes/server/integrationConnectionRepository'
import { prepareLocalConnectionSetup } from '@/products/integracoes/server/integrationControlClient'
import { IntegrationProviderError } from '@/products/integracoes/server/integrationProviderRegistry'
import { mapConnectionStatusToUi } from '@/products/integracoes/server/integrationStatusMapper'
import type { IntegrationSyncMode } from '@/products/integracoes/shared/providers/providerTypes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function asTenantId(value: unknown): number {
  const parsed = Number(value || 1)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function serializeConnection(connection: Awaited<ReturnType<typeof createIntegrationConnection>>) {
  return {
    ...connection,
    uiStatus: mapConnectionStatusToUi(connection.status),
  }
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams
    const tenantId = asTenantId(search.get('tenantId') || search.get('tenant_id'))
    const connections = await listIntegrationConnections({
      tenantId,
      domain: search.get('domain') || undefined,
      provider: search.get('provider') || undefined,
      status: search.get('status') || undefined,
      limit: Number(search.get('limit') || 100),
    })

    return Response.json({
      ok: true,
      connections: connections.map((connection) => ({
        ...connection,
        uiStatus: mapConnectionStatusToUi(connection.status),
      })),
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao listar conexoes' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const provider = String(payload.provider || '').trim()
    if (!provider) {
      return Response.json({ ok: false, error: 'provider obrigatorio' }, { status: 400 })
    }

    const connection = await createIntegrationConnection({
      tenantId: asTenantId(payload.tenantId || payload.tenant_id),
      provider,
      displayName: payload.displayName == null && payload.display_name == null
        ? undefined
        : String(payload.displayName ?? payload.display_name),
      selectedResources: asStringArray(payload.selectedResources ?? payload.selected_resources),
      syncFrequency: payload.syncFrequency == null && payload.sync_frequency == null
        ? undefined
        : String(payload.syncFrequency ?? payload.sync_frequency),
      syncModes: asStringArray(payload.syncModes ?? payload.sync_modes) as IntegrationSyncMode[] | undefined,
      metadata: payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
        ? payload.metadata as Record<string, unknown>
        : undefined,
    })
    const setup = await prepareLocalConnectionSetup(connection)

    return Response.json({
      ok: true,
      connection: serializeConnection(connection),
      setup,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof IntegrationProviderError) {
      return Response.json(
        { ok: false, code: error.code, error: error.message },
        { status: error.status },
      )
    }

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao criar conexao' },
      { status: 500 },
    )
  }
}
