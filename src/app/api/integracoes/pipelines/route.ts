import { NextRequest } from 'next/server'

import {
  createIntegrationPipeline,
  listIntegrationPipelines,
} from '@/products/integracoes/server/integrationConnectionRepository'
import type { IntegrationPipelineStatus } from '@/products/integracoes/shared/contracts/pipelineContracts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function asTenantId(value: unknown): number {
  const parsed = Number(value || 1)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function asPipelineStatus(value: unknown): IntegrationPipelineStatus | undefined {
  const status = String(value || '').trim()
  if (status === 'draft' || status === 'active' || status === 'paused' || status === 'error' || status === 'disabled') return status
  return undefined
}

export async function GET(req: NextRequest) {
  const pipelines = await listIntegrationPipelines({
    tenantId: asTenantId(req.nextUrl.searchParams.get('tenantId')),
    sourceConnectionId: req.nextUrl.searchParams.get('sourceConnectionId') || req.nextUrl.searchParams.get('connectionId') || undefined,
    destinationId: req.nextUrl.searchParams.get('destinationId') || undefined,
    status: asPipelineStatus(req.nextUrl.searchParams.get('status')),
  })
  return Response.json({ ok: true, pipelines })
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const pipeline = await createIntegrationPipeline({
      tenantId: asTenantId(payload.tenantId ?? payload.tenant_id),
      sourceConnectionId: String(payload.sourceConnectionId ?? payload.source_connection_id ?? payload.connectionId ?? ''),
      destinationId: String(payload.destinationId ?? payload.destination_id ?? ''),
      name: payload.name == null ? undefined : String(payload.name),
      status: asPipelineStatus(payload.status),
      selectedResources: asStringArray(payload.selectedResources ?? payload.selected_resources),
      syncFrequency: payload.syncFrequency == null && payload.sync_frequency == null ? undefined : String(payload.syncFrequency ?? payload.sync_frequency),
      syncEnabled: payload.syncEnabled == null && payload.sync_enabled == null ? undefined : Boolean(payload.syncEnabled ?? payload.sync_enabled),
      nextSyncAt: payload.nextSyncAt == null && payload.next_sync_at == null ? undefined : String(payload.nextSyncAt ?? payload.next_sync_at),
      metadata: asRecord(payload.metadata ?? payload.metadata_json),
    })
    if (!pipeline) return Response.json({ ok: false, error: 'Conexao ou destino nao encontrado' }, { status: 404 })
    return Response.json({ ok: true, pipeline }, { status: 201 })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao criar pipeline' },
      { status: 500 },
    )
  }
}
