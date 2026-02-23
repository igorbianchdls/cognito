import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

const PURCHASE_STATUS_VALUES = ['pendente', 'aprovado', 'concluido', 'cancelado'] as const
type PurchaseStatus = (typeof PURCHASE_STATUS_VALUES)[number]
const PURCHASE_STATUS_SET = new Set<string>(PURCHASE_STATUS_VALUES)
const PURCHASE_STATUS_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  pendente: ['aprovado', 'concluido', 'cancelado'],
  aprovado: ['concluido', 'cancelado'],
  concluido: [],
  cancelado: [],
}

function normalizeStatus(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

function isPgForeignKeyError(err: unknown): boolean {
  const code = String((err as any)?.code || '')
  const msg = String((err as any)?.message || '')
  return code === '23503' || /foreign key constraint/i.test(msg)
}

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

    let nextStatus: string | null = null
    if (payload.status !== undefined) {
      nextStatus = normalizeStatus(payload.status)
      if (!PURCHASE_STATUS_SET.has(nextStatus)) {
        return Response.json(
          {
            ok: false,
            code: 'PEDIDO_COMPRA_STATUS_INVALID',
            error: `status inválido para pedido de compra: ${nextStatus || '(vazio)'}`,
            result: {
              success: false,
              message: 'Status inválido para pedido de compra',
              data: { id, allowed_statuses: PURCHASE_STATUS_VALUES },
            },
          },
          { status: 400 },
        )
      }
    }

    if (nextStatus) {
      const currentRows = await runQuery<{ id: number; status: string | null }>(
        `SELECT id, status FROM compras.compras WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
        [tenantId, id],
      )
      const current = currentRows[0]
      if (!current) return Response.json({ ok: false, error: 'Não encontrado ou sem permissão' }, { status: 404 })
      const currentStatus = normalizeStatus(current.status || 'pendente') as PurchaseStatus
      if (
        currentStatus !== nextStatus &&
        PURCHASE_STATUS_SET.has(currentStatus) &&
        !PURCHASE_STATUS_TRANSITIONS[currentStatus].includes(nextStatus as PurchaseStatus)
      ) {
        return Response.json(
          {
            ok: false,
            code: 'PEDIDO_COMPRA_STATUS_TRANSITION_INVALID',
            error: `Transição de status inválida: ${currentStatus} -> ${nextStatus}`,
            result: {
              success: false,
              message: 'Transição de status não permitida para pedido de compra',
              data: {
                id,
                current_status: currentStatus,
                attempted_status: nextStatus,
                allowed_transitions: PURCHASE_STATUS_TRANSITIONS[currentStatus],
              },
            },
          },
          { status: 409 },
        )
      }
    }

    const fields: Array<{ col: string; val: any }> = []
    const pushIf = (key: string, col: string, mapFn?: (v:any)=>any) => { if (payload[key] !== undefined) fields.push({ col, val: mapFn ? mapFn(payload[key]) : payload[key] }) }
    pushIf('status', 'status', () => nextStatus ?? undefined)
    pushIf('observacoes', 'observacoes')
    pushIf('data_entrega_prevista', 'data_entrega_prevista')
    pushIf('data_pedido', 'data_pedido')
    pushIf('data_documento', 'data_documento')
    pushIf('data_lancamento', 'data_lancamento')
    pushIf('data_vencimento', 'data_vencimento')

    if (fields.length === 0) return Response.json({ ok: false, error: 'Nenhum campo válido para atualizar' }, { status: 400 })

    const sets: string[] = []
    const params: any[] = []
    let i = 1
    for (const f of fields) { sets.push(`${f.col} = $${i++}`); params.push(f.val) }
    params.push(tenantId, id)
    const sql = `UPDATE compras.compras SET ${sets.join(', ')} WHERE tenant_id = $${i++} AND id = $${i} RETURNING id`
    const rows = await runQuery<{ id: number }>(sql, params)
    if (!rows.length) return Response.json({ ok: false, error: 'Não encontrado ou sem permissão' }, { status: 404 })
    return Response.json({ ok: true, result: { success: true, message: 'Pedido de compra atualizado', data: { id } } })
  } catch (e) {
    if (isPgForeignKeyError(e)) {
      return Response.json(
        {
          ok: false,
          code: 'PEDIDO_COMPRA_UPDATE_BLOCKED_BY_DEPENDENCY',
          error: 'Não foi possível atualizar o pedido de compra por dependências relacionadas.',
          result: { success: false, message: 'Atualização bloqueada por vínculo de negócio' },
        },
        { status: 409 },
      )
    }
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
