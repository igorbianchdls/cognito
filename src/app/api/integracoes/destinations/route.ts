import { NextRequest } from 'next/server'

import {
  createIntegrationDestination,
  listIntegrationDestinations,
} from '@/products/integracoes/server/integrationConnectionRepository'
import type {
  IntegrationDestinationStatus,
  IntegrationDestinationType,
} from '@/products/integracoes/shared/contracts/destinationContracts'

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

function asDestinationType(value: unknown): IntegrationDestinationType {
  const type = String(value || 'bigquery').trim()
  if (
    type === 'google_sheets' ||
    type === 'excel' ||
    type === 'postgres' ||
    type === 'supabase' ||
    type === 'snowflake' ||
    type === 's3'
  ) return type
  return 'bigquery'
}

function asDestinationStatus(value: unknown): IntegrationDestinationStatus | undefined {
  const status = String(value || '').trim()
  if (status === 'active' || status === 'disabled' || status === 'error') return status
  return undefined
}

export async function GET(req: NextRequest) {
  const destinations = await listIntegrationDestinations({
    tenantId: asTenantId(req.nextUrl.searchParams.get('tenantId')),
    type: req.nextUrl.searchParams.get('type') ? asDestinationType(req.nextUrl.searchParams.get('type')) : undefined,
    status: asDestinationStatus(req.nextUrl.searchParams.get('status')),
  })
  return Response.json({ ok: true, destinations })
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const destination = await createIntegrationDestination({
      tenantId: asTenantId(payload.tenantId ?? payload.tenant_id),
      type: asDestinationType(payload.type),
      name: String(payload.name || 'Destino').trim(),
      status: asDestinationStatus(payload.status),
      config: asRecord(payload.config ?? payload.config_json),
      secretRef: payload.secretRef == null && payload.secret_ref == null ? null : String(payload.secretRef ?? payload.secret_ref),
      metadata: asRecord(payload.metadata ?? payload.metadata_json),
    })
    return Response.json({ ok: true, destination }, { status: 201 })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao criar destino' },
      { status: 500 },
    )
  }
}
