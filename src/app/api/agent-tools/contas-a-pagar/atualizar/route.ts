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

    const id = Number(payload.id)
    if (!Number.isFinite(id)) return Response.json({ ok: false, error: 'id inválido' }, { status: 400 })

    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const fields: Array<{ col: string; val: any }> = []
    const pushIf = (key: string, col: string, mapFn?: (v:any)=>any) => { if (payload[key] !== undefined) fields.push({ col, val: mapFn ? mapFn(payload[key]) : payload[key] }) }
    pushIf('descricao', 'descricao')
    if (payload.valor !== undefined) fields.push({ col: 'valor', val: Math.abs(Number(payload.valor)) })
    pushIf('data_lancamento', 'data_lancamento')
    pushIf('data_emissao', 'data_lancamento')
    pushIf('data_vencimento', 'data_vencimento')
    if (payload.fornecedor_id !== undefined) fields.push({ col: 'entidade_id', val: Number(payload.fornecedor_id) })
    if (payload.categoria_id !== undefined) fields.push({ col: 'categoria_id', val: Number(payload.categoria_id) })
    if (payload.conta_financeira_id !== undefined) fields.push({ col: 'conta_financeira_id', val: Number(payload.conta_financeira_id) })
    pushIf('status', 'status', (v)=> String(v).toLowerCase())

    if (fields.length === 0) return Response.json({ ok: false, error: 'Nenhum campo válido para atualizar' }, { status: 400 })

    const sets: string[] = []
    const params: any[] = []
    let i = 1
    for (const f of fields) { sets.push(`${f.col} = $${i++}`); params.push(f.val) }
    params.push(tenantId, id)
    const sql = `UPDATE financeiro.lancamentos_financeiros SET ${sets.join(', ')} WHERE tenant_id = $${i++} AND id = $${i} AND tipo = 'conta_a_pagar' RETURNING id`
    const rows = await runQuery<{ id: number }>(sql, params)
    if (!rows.length) return Response.json({ ok: false, error: 'Não encontrado ou sem permissão' }, { status: 404 })
    return Response.json({ ok: true, result: { success: true, message: 'Conta a pagar atualizada', data: { id } } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

