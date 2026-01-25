import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, unknown>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const id = Number((payload as any)?.id)
    if (!Number.isFinite(id)) return Response.json({ ok: false, error: 'id inválido' }, { status: 400 })

    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    try {
      const up = await runQuery<{ id: number }>(`UPDATE financeiro.contas_financeiras SET ativo = FALSE WHERE tenant_id = $1 AND id = $2 RETURNING id`, [tenantId, id])
      if (Array.isArray(up) && up.length > 0) {
        return Response.json({ ok: true, result: { success: true, message: 'Conta financeira desativada', data: { id } } })
      }
    } catch {}
    await runQuery(`DELETE FROM financeiro.contas_financeiras WHERE tenant_id = $1 AND id = $2`, [tenantId, id])
    return Response.json({ ok: true, result: { success: true, message: 'Conta financeira deletada', data: { id } } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
