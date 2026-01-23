import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
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

    const cliente_id = payload.cliente_id !== undefined ? Number(payload.cliente_id) : null
    const categoria_id = Number(payload.categoria_id)
    const valor = Number(payload.valor)
    const descricao = typeof payload.descricao === 'string' ? payload.descricao : ''
    const data_lancamento = typeof payload.data_emissao === 'string' ? payload.data_emissao : (typeof payload.data_lancamento === 'string' ? payload.data_lancamento : new Date().toISOString().slice(0, 10))
    const data_vencimento = typeof payload.data_vencimento === 'string' ? payload.data_vencimento : data_lancamento
    const conta_financeira_id = payload.conta_financeira_id !== undefined ? Number(payload.conta_financeira_id) : null
    if (!Number.isFinite(categoria_id) || !Number.isFinite(valor)) return Response.json({ ok: false, error: 'categoria_id e valor são obrigatórios' }, { status: 400 })

    const sql = `INSERT INTO financeiro.lancamentos_financeiros
      (tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status, entidade_id, categoria_id, conta_financeira_id)
      VALUES ($1,'conta_a_receber',$2,$3,$4,$5,'pendente',$6,$7,$8)
      RETURNING id`
    const params = [tenantId, descricao, Math.abs(valor), data_lancamento, data_vencimento, cliente_id, categoria_id, conta_financeira_id]
    const rows = await runQuery<{ id: number }>(sql, params)
    const id = Number(rows[0]?.id)
    return Response.json({ ok: true, result: { success: true, data: { id }, message: 'Conta a receber criada' } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

