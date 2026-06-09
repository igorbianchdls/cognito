import { NextRequest } from 'next/server'

import {
  getIntegrationConnection,
  listIntegrationEvents,
} from '@/products/integracoes/server/integrationConnectionRepository'
import {
  mapIntegrationEventSeverityToUi,
  mapIntegrationEventTypeToUi,
} from '@/products/integracoes/server/integrationStatusMapper'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    const events = await listIntegrationEvents({
      tenantId,
      connectionId: id,
      limit: Number(req.nextUrl.searchParams.get('limit') || 50),
    })

    return Response.json({
      ok: true,
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
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao carregar eventos' },
      { status: 500 },
    )
  }
}
