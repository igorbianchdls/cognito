import { NextRequest } from 'next/server'

import { requestLocalSync } from '@/products/integracoes/server/integrationControlClient'
import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

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

function asTrigger(value: unknown): IntegrationSyncTrigger {
  const trigger = String(value || 'manual').trim().toLowerCase()
  if (trigger === 'manual' || trigger === 'scheduled' || trigger === 'webhook' || trigger === 'initial') return trigger
  return 'manual'
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const result = await requestLocalSync({
      tenantId: asTenantId(payload.tenantId || payload.tenant_id || req.nextUrl.searchParams.get('tenantId')),
      connectionId: id,
      pipelineId: typeof payload.pipelineId === 'string' ? payload.pipelineId : typeof payload.pipeline_id === 'string' ? payload.pipeline_id : undefined,
      destinationId: typeof payload.destinationId === 'string' ? payload.destinationId : typeof payload.destination_id === 'string' ? payload.destination_id : undefined,
      trigger: asTrigger(payload.trigger),
      resources: asStringArray(payload.resources),
      requestedBy: payload.requestedBy == null && payload.requested_by == null
        ? 'api'
        : String(payload.requestedBy ?? payload.requested_by),
    })

    if (!result) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })

    return Response.json({
      ok: true,
      result,
      message: result.status === 'queued'
        ? 'Sync enviado ao GCP e registrado como aguardando processamento.'
        : 'Sync local registrado. Configure INTEGRATIONS_CONTROL_API_URL para processar no GCP.',
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao disparar sync' },
      { status: 500 },
    )
  }
}
