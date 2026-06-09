import { NextRequest } from 'next/server'

import {
  createIntegrationDestination,
  listIntegrationDestinations,
} from '@/products/integracoes/server/integrationConnectionRepository'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'
import type {
  IntegrationDestinationStatus,
  IntegrationDestinationType,
} from '@/products/integracoes/shared/contracts/destinationContracts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  try {
    const { tenantId } = await resolveIntegrationTenant(req, {
      requestedTenantId: req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'),
      access: 'read',
    })
    const destinations = await listIntegrationDestinations({
      tenantId,
      type: req.nextUrl.searchParams.get('type') ? asDestinationType(req.nextUrl.searchParams.get('type')) : undefined,
      status: asDestinationStatus(req.nextUrl.searchParams.get('status')),
    })
    return Response.json({ ok: true, destinations })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao listar destinos' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const { tenantId } = await resolveIntegrationTenant(req, {
      requestedTenantId: payload.tenantId ?? payload.tenant_id,
      access: 'manage',
    })
    const destination = await createIntegrationDestination({
      tenantId,
      type: asDestinationType(payload.type),
      name: String(payload.name || 'Destino').trim(),
      status: asDestinationStatus(payload.status),
      config: asRecord(payload.config ?? payload.config_json),
      secretRef: payload.secretRef == null && payload.secret_ref == null ? null : String(payload.secretRef ?? payload.secret_ref),
      metadata: asRecord(payload.metadata ?? payload.metadata_json),
    })
    return Response.json({ ok: true, destination }, { status: 201 })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao criar destino' },
      { status: 500 },
    )
  }
}
