import { NextRequest } from 'next/server'

import {
  getIntegrationConnection,
  getIntegrationMcpPermissions,
  upsertIntegrationMcpPermissions,
} from '@/products/integracoes/server/integrationConnectionRepository'

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const tenantId = asTenantId(req.nextUrl.searchParams.get('tenantId') || req.nextUrl.searchParams.get('tenant_id'))
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })

    const permissions = await getIntegrationMcpPermissions(id, tenantId)
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
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao carregar permissoes MCP' },
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
    const tenantId = asTenantId(payload.tenantId || payload.tenant_id || req.nextUrl.searchParams.get('tenantId'))
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })

    const permissions = await upsertIntegrationMcpPermissions({
      tenantId,
      connectionId: id,
      enabled: payload.enabled == null ? undefined : Boolean(payload.enabled),
      readResources: asStringArray(payload.readResources ?? payload.read_resources),
      liveReadResources: asStringArray(payload.liveReadResources ?? payload.live_read_resources),
      writeResources: asStringArray(payload.writeResources ?? payload.write_resources),
      destructiveResources: asStringArray(payload.destructiveResources ?? payload.destructive_resources),
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
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao salvar permissoes MCP' },
      { status: 500 },
    )
  }
}
