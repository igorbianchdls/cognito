import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

const STATUS_VALUES = ['rascunho', 'em_analise', 'aprovado', 'recebimento_parcial', 'recebido', 'cancelado'] as const
type PedidoCompraStatus = (typeof STATUS_VALUES)[number]
const STATUS_SET = new Set<string>(STATUS_VALUES)
const ALLOWED_TO_CANCEL = new Set<PedidoCompraStatus>(['rascunho', 'em_analise', 'aprovado', 'recebimento_parcial'])

function normalizeStatus(value: unknown): string {
  const s = String(value ?? '').trim().toLowerCase()
  if (s === 'pendente') return 'em_analise'
  if (s === 'concluido') return 'recebido'
  return s
}

function resolveTenantId(req: NextRequest): number {
  const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
  const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
  return Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)
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

    const tenantId = resolveTenantId(req)
    const motivo = typeof payload.motivo_cancelamento === 'string' ? payload.motivo_cancelamento.trim() : ''

    const rows = await runQuery<{ id: number; status: string | null; observacoes: string | null }>(
      `SELECT id, status, observacoes FROM compras.compras WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
      [tenantId, id],
    )
    const current = rows[0]
    if (!current) return Response.json({ ok: false, error: 'Não encontrado ou sem permissão' }, { status: 404 })

    const currentStatus = normalizeStatus(current.status || 'pendente')
    if (!STATUS_SET.has(currentStatus)) {
      return Response.json({
        ok: false,
        code: 'PEDIDO_COMPRA_STATUS_UNKNOWN',
        error: `Status atual do pedido é inválido para cancelamento: ${currentStatus || '(vazio)'}`,
        result: { success: false, message: 'Status atual inválido para cancelamento', data: { id, current_status: currentStatus } },
      }, { status: 409 })
    }
    if (currentStatus === 'cancelado') {
      return Response.json({
        ok: true,
        result: {
          success: true,
          message: 'Pedido de compra já estava cancelado',
          data: { id, status: 'cancelado', unchanged: true },
        },
      })
    }
    if (!ALLOWED_TO_CANCEL.has(currentStatus as PedidoCompraStatus)) {
      return Response.json({
        ok: false,
        code: 'PEDIDO_COMPRA_CANCEL_NOT_ALLOWED',
        error: `Cancelamento não permitido para pedido em status ${currentStatus}`,
        result: {
          success: false,
          message: 'Cancelamento de pedido de compra não permitido neste status',
          data: { id, current_status: currentStatus, allowed_statuses_to_cancel: Array.from(ALLOWED_TO_CANCEL) },
        },
      }, { status: 409 })
    }

    const observacoesAtualizadas = [current.observacoes || '', motivo ? `[cancelamento] ${motivo}` : '']
      .filter(Boolean)
      .join('\n')

    await runQuery(
      `UPDATE compras.compras
          SET status = 'cancelado',
              observacoes = CASE WHEN $3 <> '' THEN $3 ELSE observacoes END,
              atualizado_em = now()
        WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id, observacoesAtualizadas],
    )

    return Response.json({
      ok: true,
      result: {
        success: true,
        message: 'Pedido de compra cancelado',
        data: { id, status: 'cancelado' },
      },
    })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
