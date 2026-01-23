import { NextRequest } from 'next/server'
import { runQuery, withTransaction } from '@/lib/postgres'
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

    const fornecedor_id = Number(payload.fornecedor_id)
    if (!Number.isFinite(fornecedor_id)) return Response.json({ ok: false, error: 'fornecedor_id é obrigatório' }, { status: 400 })
    const data_pedido = typeof payload.data_pedido === 'string' ? payload.data_pedido : new Date().toISOString().slice(0, 10)
    const itens = Array.isArray(payload.itens) ? payload.itens as Array<any> : []
    let valor_total = payload.valor_total !== undefined ? Number(payload.valor_total) : NaN
    if (!Number.isFinite(valor_total)) {
      valor_total = itens.reduce((acc, it) => acc + Number(it.quantidade || 0) * Number(it.preco_unitario || 0), 0)
    }
    const status = (payload.status && String(payload.status)) || 'aberto'

    const result = await withTransaction(async (client) => {
      const cols: string[] = ['tenant_id','fornecedor_id','data_pedido','valor_total','status']
      const vals: any[] = [tenantId, fornecedor_id, data_pedido, valor_total, status]
      const placeholders = cols.map((_, i) => `$${i+1}`)
      const insertSql = `INSERT INTO compras.pedidos (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING id`;
      const ins = await client.query(insertSql, vals)
      const id = Number(ins.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar pedido de compra')
      return { id }
    })

    return Response.json({ ok: true, result: { success: true, data: { id: result.id }, message: 'Pedido de compra criado' } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

