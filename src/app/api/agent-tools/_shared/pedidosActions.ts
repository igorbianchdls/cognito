import { NextRequest } from 'next/server'

import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

type PedidoKind = 'venda' | 'compra'
type PedidoAction =
  | 'aprovar'
  | 'concluir'
  | 'cancelar'
  | 'reabrir'
  | 'marcar_como_recebido'
  | 'marcar_recebimento_parcial'

type PedidoConfig = {
  kind: PedidoKind
  table: 'vendas.pedidos' | 'compras.compras'
  label: 'Pedido de venda' | 'Pedido de compra'
  codePrefix: 'PEDIDO_VENDA' | 'PEDIDO_COMPRA'
  pendingStatus: string
  canonicalStatuses: readonly string[]
  aliases?: Record<string, string>
}

const VENDAS_STATUSES = ['pendente', 'aprovado', 'concluido', 'cancelado'] as const
const COMPRAS_STATUSES = ['rascunho', 'em_analise', 'aprovado', 'recebimento_parcial', 'recebido', 'cancelado'] as const

const CONFIG: Record<PedidoKind, PedidoConfig> = {
  venda: {
    kind: 'venda',
    table: 'vendas.pedidos',
    label: 'Pedido de venda',
    codePrefix: 'PEDIDO_VENDA',
    pendingStatus: 'pendente',
    canonicalStatuses: VENDAS_STATUSES,
  },
  compra: {
    kind: 'compra',
    table: 'compras.compras',
    label: 'Pedido de compra',
    codePrefix: 'PEDIDO_COMPRA',
    pendingStatus: 'em_analise',
    canonicalStatuses: COMPRAS_STATUSES,
    aliases: {
      pendente: 'em_analise',
      concluido: 'recebido',
    },
  },
}

type ActionSpec = {
  targetStatus: (cfg: PedidoConfig) => string
  allowedFrom: (cfg: PedidoConfig) => string[]
  successMessage: (cfg: PedidoConfig) => string
  unchangedMessage: (cfg: PedidoConfig, status: string) => string
  notePrefix: string
}

function specsFor(kind: PedidoKind): Partial<Record<PedidoAction, ActionSpec>> {
  const commonCancel: ActionSpec = {
    targetStatus: () => 'cancelado',
    allowedFrom: (cfg) => (cfg.kind === 'venda' ? ['pendente', 'aprovado'] : ['rascunho', 'em_analise', 'aprovado', 'recebimento_parcial']),
    successMessage: (cfg) => `${cfg.label} cancelado`,
    unchangedMessage: (cfg) => `${cfg.label} já estava cancelado`,
    notePrefix: '[cancelamento]',
  }
  if (kind === 'venda') {
    return {
      aprovar: {
        targetStatus: () => 'aprovado',
        allowedFrom: () => ['pendente'],
        successMessage: () => 'Pedido de venda aprovado',
        unchangedMessage: () => 'Pedido de venda já estava aprovado',
        notePrefix: '[aprovacao]',
      },
      concluir: {
        targetStatus: () => 'concluido',
        allowedFrom: () => ['pendente', 'aprovado'],
        successMessage: () => 'Pedido de venda concluído',
        unchangedMessage: () => 'Pedido de venda já estava concluído',
        notePrefix: '[conclusao]',
      },
      cancelar: commonCancel,
      reabrir: {
        targetStatus: (cfg) => cfg.pendingStatus,
        allowedFrom: () => ['cancelado'],
        successMessage: () => 'Pedido de venda reaberto',
        unchangedMessage: () => 'Pedido de venda já estava reaberto',
        notePrefix: '[reabertura]',
      },
    }
  }
  return {
    aprovar: {
      targetStatus: () => 'aprovado',
      allowedFrom: () => ['rascunho', 'em_analise'],
      successMessage: () => 'Pedido de compra aprovado',
      unchangedMessage: () => 'Pedido de compra já estava aprovado',
      notePrefix: '[aprovacao]',
    },
    cancelar: commonCancel,
    reabrir: {
      targetStatus: (cfg) => cfg.pendingStatus,
      allowedFrom: () => ['cancelado'],
      successMessage: () => 'Pedido de compra reaberto',
      unchangedMessage: () => 'Pedido de compra já estava reaberto',
      notePrefix: '[reabertura]',
    },
    marcar_como_recebido: {
      targetStatus: () => 'recebido',
      allowedFrom: () => ['aprovado', 'recebimento_parcial'],
      successMessage: () => 'Pedido de compra marcado como recebido',
      unchangedMessage: () => 'Pedido de compra já estava recebido',
      notePrefix: '[recebimento]',
    },
    marcar_recebimento_parcial: {
      targetStatus: () => 'recebimento_parcial',
      allowedFrom: () => ['aprovado'],
      successMessage: () => 'Pedido de compra marcado com recebimento parcial',
      unchangedMessage: () => 'Pedido de compra já estava com recebimento parcial',
      notePrefix: '[recebimento_parcial]',
    },
  }
}

function resolveTenantId(req: NextRequest): number {
  const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
  const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
  return Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)
}

function verifyAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return verifyAgentToken(chatId, token)
}

function toText(v: unknown) {
  return String(v ?? '').trim()
}

function normalizeStatus(cfg: PedidoConfig, value: unknown): string {
  const lower = toText(value).toLowerCase()
  return cfg.aliases?.[lower] || lower
}

function actionCodePart(action: PedidoAction): string {
  return action.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}

function appendNote(existing: string | null | undefined, note: string | null | undefined) {
  const s = toText(note)
  if (!s) return existing || null
  return [existing || '', s].filter(Boolean).join('\n')
}

export async function handlePedidoAction(req: NextRequest, kind: PedidoKind, action: PedidoAction) {
  const cfg = CONFIG[kind]
  const spec = specsFor(kind)[action]
  if (!spec) {
    return Response.json({ ok: false, error: 'ação não suportada' }, { status: 400 })
  }

  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    if (!verifyAuth(req)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const id = Number(payload.id)
    if (!Number.isFinite(id)) return Response.json({ ok: false, error: 'id inválido' }, { status: 400 })
    const tenantId = resolveTenantId(req)

    const rows = await runQuery<{ id: number; status: string | null; observacoes: string | null }>(
      `SELECT id, status, observacoes FROM ${cfg.table} WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
      [tenantId, id],
    )
    const current = rows[0]
    if (!current) return Response.json({ ok: false, error: 'Não encontrado ou sem permissão' }, { status: 404 })

    const currentStatus = normalizeStatus(cfg, current.status || cfg.pendingStatus)
    const statusSet = new Set<string>(cfg.canonicalStatuses)
    if (!statusSet.has(currentStatus)) {
      return Response.json({
        ok: false,
        code: `${cfg.codePrefix}_STATUS_UNKNOWN`,
        error: `Status atual inválido para ${action}: ${currentStatus || '(vazio)'}`,
        result: { success: false, message: 'Status atual inválido', data: { id, current_status: currentStatus } },
      }, { status: 409 })
    }

    const target = spec.targetStatus(cfg)
    if (currentStatus === target) {
      return Response.json({
        ok: true,
        result: { success: true, message: spec.unchangedMessage(cfg, target), data: { id, status: target, unchanged: true } },
      })
    }

    const allowed = spec.allowedFrom(cfg)
    if (!allowed.includes(currentStatus)) {
      return Response.json({
        ok: false,
        code: `${cfg.codePrefix}_${actionCodePart(action)}_NOT_ALLOWED`,
        error: `${action} não permitido para ${cfg.label.toLowerCase()} em status ${currentStatus}`,
        result: {
          success: false,
          message: `${action} não permitido neste status`,
          data: { id, current_status: currentStatus, allowed_statuses: allowed },
        },
      }, { status: 409 })
    }

    const motivo = toText(
      payload.motivo ??
      payload.motivo_cancelamento ??
      payload.observacao ??
      payload.descricao,
    )
    const note = motivo ? `${spec.notePrefix} ${motivo}` : spec.notePrefix
    const observacoesAtualizadas = appendNote(current.observacoes, note)

    await runQuery(
      `UPDATE ${cfg.table}
          SET status = $3,
              observacoes = CASE WHEN $4 IS NOT NULL THEN $4 ELSE observacoes END,
              atualizado_em = now()
        WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id, target, observacoesAtualizadas],
    )

    return Response.json({
      ok: true,
      result: {
        success: true,
        message: spec.successMessage(cfg),
        data: { id, status: target },
      },
    })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

