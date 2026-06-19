import { NextRequest } from 'next/server'

import { getIntegrationConnection } from '@/products/integracoes/server/integrationConnectionRepository'
import { requestLocalReconnect } from '@/products/integracoes/server/integrationControlClient'
import { serializeConnectionWithUi } from '@/products/integracoes/server/integrationStatusMapper'
import {
  integrationAuthErrorResponse,
  resolveIntegrationTenant,
} from '@/products/integracoes/server/integrationTenantAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
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
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })

    const reconnect = await requestLocalReconnect({ tenantId, connection })

    return Response.json({
      ok: true,
      reconnect: {
        ...reconnect,
        connection: serializeConnectionWithUi(reconnect.connection),
      },
    })
  } catch (error) {
    const authResponse = integrationAuthErrorResponse(error)
    if (authResponse) return authResponse

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao preparar reconexao' },
      { status: 500 },
    )
  }
}
