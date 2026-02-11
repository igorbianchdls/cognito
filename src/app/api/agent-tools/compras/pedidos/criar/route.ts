import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, any>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const normalized = { ...payload }
    if (!normalized.tenant_id) normalized.tenant_id = tenantId
    if (!Array.isArray(normalized.linhas) && Array.isArray(normalized.itens)) normalized.linhas = normalized.itens
    if (!normalized.numero_oc && typeof normalized.numero_pedido === 'string') normalized.numero_oc = normalized.numero_pedido
    if (!normalized.data_pedido && typeof normalized.data_emissao === 'string') normalized.data_pedido = normalized.data_emissao

    const url = new URL('/api/modulos/compras', req.url)
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(normalized),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) {
      const errorMsg = data?.message || data?.error || `HTTP ${res.status}`
      return Response.json({ ok: false, error: String(errorMsg) }, { status: res.status || 400 })
    }

    return Response.json({ ok: true, result: data })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
