import { NextRequest } from 'next/server'

import { getIntegrationConnection } from '@/products/integracoes/server/integrationConnectionRepository'
import { requestLocalReconnect } from '@/products/integracoes/server/integrationControlClient'
import { mapConnectionStatusToUi } from '@/products/integracoes/server/integrationStatusMapper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function asTenantId(value: unknown): number {
  const parsed = Number(value || 1)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const tenantId = asTenantId(payload.tenantId || payload.tenant_id || req.nextUrl.searchParams.get('tenantId'))
    const connection = await getIntegrationConnection(id, tenantId)
    if (!connection) return Response.json({ ok: false, error: 'Conexao nao encontrada' }, { status: 404 })

    const reconnect = await requestLocalReconnect({ tenantId, connection })

    return Response.json({
      ok: true,
      reconnect: {
        ...reconnect,
        connection: {
          ...reconnect.connection,
          uiStatus: mapConnectionStatusToUi(reconnect.connection.status),
        },
      },
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao preparar reconexao' },
      { status: 500 },
    )
  }
}
