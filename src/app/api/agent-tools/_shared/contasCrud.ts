import { NextRequest } from 'next/server'

import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

type ContaKind = 'ap' | 'ar'
type ContaAction = 'baixar' | 'estornar' | 'cancelar' | 'reabrir'

type ContaConfig = {
  kind: ContaKind
  resourcePath: 'contas-a-pagar' | 'contas-a-receber'
  table: 'financeiro.contas_pagar' | 'financeiro.contas_receber'
  label: 'Conta a pagar' | 'Conta a receber'
  codePrefix: 'CONTA_PAGAR' | 'CONTA_RECEBER'
  entityIdCol: 'fornecedor_id' | 'cliente_id'
  entityPayloadKey: 'fornecedor_id' | 'cliente_id'
  entitySnapshotCol: 'nome_fornecedor_snapshot' | 'nome_cliente_snapshot'
  categoryPrimaryCol: 'categoria_despesa_id' | 'categoria_receita_id'
  categoryLegacyCol?: 'categoria_financeira_id'
  centroPrincipalCol: 'centro_custo_id' | 'centro_lucro_id'
  paidStatus: 'pago' | 'recebido'
  canonicalStatuses: readonly string[]
  aliases: Record<string, string>
  transitions: Record<string, string[]>
}

const AP_CANONICAL = ['pendente', 'vencido', 'parcial', 'pago', 'cancelado'] as const
const AR_CANONICAL = ['pendente', 'vencido', 'parcial', 'recebido', 'cancelado'] as const

const AP_ALIASES: Record<string, string> = {
  aberto: 'pendente',
  'em_aberto': 'pendente',
  'em aberto': 'pendente',
  baixado: 'pago',
  liquidado: 'pago',
}
const AR_ALIASES: Record<string, string> = {
  aberto: 'pendente',
  'em_aberto': 'pendente',
  'em aberto': 'pendente',
  pago: 'recebido',
  baixado: 'recebido',
  liquidado: 'recebido',
}

const AP_TRANSITIONS: Record<string, string[]> = {
  pendente: ['vencido', 'parcial', 'pago', 'cancelado'],
  vencido: ['parcial', 'pago', 'cancelado'],
  parcial: ['pendente', 'vencido', 'pago', 'cancelado'],
  pago: ['pendente'],
  cancelado: ['pendente'],
}
const AR_TRANSITIONS: Record<string, string[]> = {
  pendente: ['vencido', 'parcial', 'recebido', 'cancelado'],
  vencido: ['parcial', 'recebido', 'cancelado'],
  parcial: ['pendente', 'vencido', 'recebido', 'cancelado'],
  recebido: ['pendente'],
  cancelado: ['pendente'],
}

const CONFIG: Record<ContaKind, ContaConfig> = {
  ap: {
    kind: 'ap',
    resourcePath: 'contas-a-pagar',
    table: 'financeiro.contas_pagar',
    label: 'Conta a pagar',
    codePrefix: 'CONTA_PAGAR',
    entityIdCol: 'fornecedor_id',
    entityPayloadKey: 'fornecedor_id',
    entitySnapshotCol: 'nome_fornecedor_snapshot',
    categoryPrimaryCol: 'categoria_despesa_id',
    categoryLegacyCol: 'categoria_financeira_id',
    centroPrincipalCol: 'centro_custo_id',
    paidStatus: 'pago',
    canonicalStatuses: AP_CANONICAL,
    aliases: AP_ALIASES,
    transitions: AP_TRANSITIONS,
  },
  ar: {
    kind: 'ar',
    resourcePath: 'contas-a-receber',
    table: 'financeiro.contas_receber',
    label: 'Conta a receber',
    codePrefix: 'CONTA_RECEBER',
    entityIdCol: 'cliente_id',
    entityPayloadKey: 'cliente_id',
    entitySnapshotCol: 'nome_cliente_snapshot',
    categoryPrimaryCol: 'categoria_receita_id',
    categoryLegacyCol: 'categoria_financeira_id',
    centroPrincipalCol: 'centro_lucro_id',
    paidStatus: 'recebido',
    canonicalStatuses: AR_CANONICAL,
    aliases: AR_ALIASES,
    transitions: AR_TRANSITIONS,
  },
}

function toText(v: unknown): string {
  return String(v ?? '').trim()
}

function toOptText(v: unknown): string | null {
  const s = toText(v)
  return s || null
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function parseDate(v: unknown): string | null {
  const s = toText(v)
  return s || null
}

function resolveTenantId(req: NextRequest): number {
  const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
  const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
  return Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1
}

function verifyAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return verifyAgentToken(chatId, token)
}

function normalizeStatus(kind: ContaKind, raw: unknown): string {
  const cfg = CONFIG[kind]
  const lower = toText(raw).toLowerCase()
  return cfg.aliases[lower] || lower
}

function isAllowedStatus(kind: ContaKind, status: string): boolean {
  return CONFIG[kind].canonicalStatuses.includes(status)
}

function transitionsFor(kind: ContaKind, current: string): string[] {
  return CONFIG[kind].transitions[current] || []
}

function code(kind: ContaKind, suffix: string): string {
  return `${CONFIG[kind].codePrefix}_${suffix}`
}

function ok(result: Record<string, unknown>) {
  return Response.json({ ok: true, result })
}

function fail(status: number, body: Record<string, unknown>) {
  return Response.json({ ok: false, ...body }, { status })
}

function appendObservation(existing: string | null | undefined, note: string | null | undefined) {
  const extra = toText(note)
  if (!extra) return existing || null
  return [existing || '', extra].filter(Boolean).join('\n')
}

async function getContaRow(kind: ContaKind, tenantId: number, id: number) {
  const cfg = CONFIG[kind]
  const rows = await runQuery<{ id: number; status: string | null; observacao: string | null }>(
    `SELECT id, status, observacao FROM ${cfg.table} WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, id],
  )
  return rows[0] || null
}

function validateStatusAndTransition(params: {
  kind: ContaKind
  currentStatusRaw: string | null | undefined
  nextStatusRaw: string
  id: number
}) {
  const { kind, currentStatusRaw, nextStatusRaw, id } = params
  const current = normalizeStatus(kind, currentStatusRaw || 'pendente')
  const next = normalizeStatus(kind, nextStatusRaw)

  if (!isAllowedStatus(kind, next)) {
    return {
      ok: false as const,
      response: fail(400, {
        code: code(kind, 'STATUS_INVALID'),
        error: `status inválido: ${next || '(vazio)'}`,
        result: {
          success: false,
          message: `${CONFIG[kind].label}: status inválido`,
          data: { id, allowed_statuses: CONFIG[kind].canonicalStatuses },
        },
      }),
    }
  }

  if (!isAllowedStatus(kind, current)) {
    return {
      ok: false as const,
      response: fail(409, {
        code: code(kind, 'STATUS_UNKNOWN'),
        error: `status atual inválido: ${current || '(vazio)'}`,
        result: {
          success: false,
          message: `${CONFIG[kind].label}: status atual inválido`,
          data: { id, current_status: current, allowed_statuses: CONFIG[kind].canonicalStatuses },
        },
      }),
    }
  }

  if (current !== next && !transitionsFor(kind, current).includes(next)) {
    return {
      ok: false as const,
      response: fail(409, {
        code: code(kind, 'STATUS_TRANSITION_INVALID'),
        error: `Transição de status inválida: ${current} -> ${next}`,
        result: {
          success: false,
          message: `Transição de status não permitida para ${CONFIG[kind].label.toLowerCase()}`,
          data: { id, current_status: current, attempted_status: next, allowed_transitions: transitionsFor(kind, current) },
        },
      }),
    }
  }

  return { ok: true as const, currentStatus: current, nextStatus: next }
}

async function updateById(kind: ContaKind, tenantId: number, id: number, updates: Array<{ col: string; val: unknown }>) {
  if (!updates.length) return null
  const cfg = CONFIG[kind]
  const sets: string[] = []
  const params: unknown[] = []
  let i = 1
  for (const u of updates) {
    sets.push(`${u.col} = $${i++}`)
    params.push(u.val)
  }
  sets.push(`atualizado_em = now()`)
  params.push(tenantId, id)
  const sql = `UPDATE ${cfg.table} SET ${sets.join(', ')} WHERE tenant_id = $${i++} AND id = $${i} RETURNING id, status`
  const rows = await runQuery<{ id: number; status: string }>(sql, params)
  return rows[0] || null
}

function validDocTypeOrDefault(v: unknown) {
  const s = toText(v).toLowerCase()
  return s || 'fatura'
}

function makeDocNumber(kind: ContaKind) {
  const prefix = kind === 'ap' ? 'CP' : 'CR'
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${ymd}-${rand}`
}

export async function handleContaCreate(req: NextRequest, kind: ContaKind) {
  const cfg = CONFIG[kind]
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    if (!verifyAuth(req)) return fail(401, { error: 'unauthorized' })

    const tenantId = resolveTenantId(req)
    const entityId = toNum(payload[cfg.entityPayloadKey])
    const valorRaw = toNum(payload.valor)
    const valor = Math.abs(Number(valorRaw ?? NaN))
    const categoriaId = toNum(payload.categoria_id) ?? toNum(payload[cfg.categoryPrimaryCol]) ?? toNum(payload.categoria_financeira_id)
    const contaFinanceiraId = toNum(payload.conta_financeira_id)
    const descricao = toText(payload.descricao || payload.observacao)
    const dataLancamento = parseDate(payload.data_lancamento || payload.data_emissao) || new Date().toISOString().slice(0, 10)
    const dataVencimento = parseDate(payload.data_vencimento)
    const dataDocumento = parseDate(payload.data_documento || payload.data_emissao || payload.data_lancamento) || dataLancamento
    const status = normalizeStatus(kind, payload.status || 'pendente')
    const numeroDocumento = toText(payload.numero_documento) || makeDocNumber(kind)
    const tipoDocumento = validDocTypeOrDefault(payload.tipo_documento)

    if (!entityId || entityId <= 0) return fail(400, { error: `${cfg.entityPayloadKey} é obrigatório` })
    if (!Number.isFinite(valor) || valor <= 0) return fail(400, { error: 'valor é obrigatório e deve ser > 0' })
    if (!dataVencimento) return fail(400, { error: 'data_vencimento é obrigatório' })
    if (!isAllowedStatus(kind, status)) {
      return fail(400, {
        code: code(kind, 'STATUS_INVALID'),
        error: `status inválido: ${status || '(vazio)'}`,
        result: { success: false, message: `${cfg.label}: status inválido`, data: { allowed_statuses: cfg.canonicalStatuses } },
      })
    }

    const cols = [
      'tenant_id',
      cfg.entityIdCol,
      'numero_documento',
      'tipo_documento',
      'status',
      'data_documento',
      'data_lancamento',
      'data_vencimento',
      'valor_bruto',
      'valor_desconto',
      'valor_impostos',
      'valor_liquido',
      'observacao',
    ]
    const values: unknown[] = [
      tenantId,
      entityId,
      numeroDocumento,
      tipoDocumento,
      status,
      dataDocumento,
      dataLancamento,
      dataVencimento,
      valor,
      0,
      0,
      valor,
      descricao || null,
    ]

    if (categoriaId != null) {
      cols.push(cfg.categoryPrimaryCol)
      values.push(categoriaId)
    }
    if (contaFinanceiraId != null) {
      cols.push('conta_financeira_id')
      values.push(contaFinanceiraId)
    }
    const centroId = toNum(payload.centro_custo_id) ?? toNum(payload.centro_lucro_id)
    if (centroId != null) {
      cols.push(cfg.centroPrincipalCol)
      values.push(centroId)
    }
    const departamentoId = toNum(payload.departamento_id)
    if (departamentoId != null) {
      cols.push('departamento_id')
      values.push(departamentoId)
    }
    const filialId = toNum(payload.filial_id)
    if (filialId != null) {
      cols.push('filial_id')
      values.push(filialId)
    }
    const unidadeId = toNum(payload.unidade_negocio_id)
    if (unidadeId != null) {
      cols.push('unidade_negocio_id')
      values.push(unidadeId)
    }
    const projetoId = toNum(payload.projeto_id)
    if (projetoId != null) {
      cols.push('projeto_id')
      values.push(projetoId)
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
    const rows = await runQuery<{ id: number }>(
      `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`,
      values,
    )
    const created = rows[0]
    if (!created) return fail(500, { error: `Falha ao criar ${cfg.label.toLowerCase()}` })

    return ok({
      success: true,
      message: `${cfg.label} criada`,
      data: { id: created.id, status, numero_documento: numeroDocumento },
    })
  } catch (e: unknown) {
    const msg = (e as Error)?.message || String(e)
    const pgCode = String((e as any)?.code || '')
    if (pgCode === '23514') {
      return fail(400, { error: `Violação de regra de dados: ${msg}` })
    }
    return fail(500, { error: msg })
  }
}

export async function handleContaUpdate(req: NextRequest, kind: ContaKind) {
  const cfg = CONFIG[kind]
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    if (!verifyAuth(req)) return fail(401, { error: 'unauthorized' })
    const id = Number(payload.id)
    if (!Number.isFinite(id)) return fail(400, { error: 'id inválido' })
    const tenantId = resolveTenantId(req)

    let normalizedStatus: string | null = null
    if (payload.status !== undefined) {
      const current = await getContaRow(kind, tenantId, id)
      if (!current) return fail(404, { error: 'Não encontrado ou sem permissão' })
      const v = validateStatusAndTransition({ kind, currentStatusRaw: current.status, nextStatusRaw: payload.status as string, id })
      if (!v.ok) return v.response
      normalizedStatus = v.nextStatus
    }

    const updates: Array<{ col: string; val: unknown }> = []
    const push = (key: string, col: string, map?: (v: unknown) => unknown) => {
      if (payload[key] !== undefined) updates.push({ col, val: map ? map(payload[key]) : payload[key] })
    }

    push('descricao', 'observacao', (v) => toOptText(v))
    push('observacao', 'observacao', (v) => toOptText(v))
    if (payload.valor !== undefined) {
      const n = toNum(payload.valor)
      if (n == null || !Number.isFinite(n)) return fail(400, { error: 'valor inválido' })
      const abs = Math.abs(n)
      updates.push({ col: 'valor_bruto', val: abs })
      updates.push({ col: 'valor_liquido', val: abs })
    }
    push('data_lancamento', 'data_lancamento', parseDate)
    push('data_emissao', 'data_lancamento', parseDate)
    push('data_documento', 'data_documento', parseDate)
    push('data_vencimento', 'data_vencimento', parseDate)
    push(cfg.entityPayloadKey, cfg.entityIdCol, toNum)
    if (payload.categoria_id !== undefined) updates.push({ col: cfg.categoryPrimaryCol, val: toNum(payload.categoria_id) })
    if (payload[cfg.categoryPrimaryCol] !== undefined) updates.push({ col: cfg.categoryPrimaryCol, val: toNum(payload[cfg.categoryPrimaryCol]) })
    if (cfg.categoryLegacyCol && payload[cfg.categoryLegacyCol] !== undefined) updates.push({ col: cfg.categoryLegacyCol, val: toNum(payload[cfg.categoryLegacyCol]) })
    push('conta_financeira_id', 'conta_financeira_id', toNum)
    if (payload.centro_custo_id !== undefined || payload.centro_lucro_id !== undefined) {
      updates.push({ col: cfg.centroPrincipalCol, val: toNum(payload.centro_custo_id) ?? toNum(payload.centro_lucro_id) })
    }
    push('departamento_id', 'departamento_id', toNum)
    push('filial_id', 'filial_id', toNum)
    push('unidade_negocio_id', 'unidade_negocio_id', toNum)
    push('projeto_id', 'projeto_id', toNum)
    if (payload.numero_documento !== undefined) updates.push({ col: 'numero_documento', val: toText(payload.numero_documento) })
    if (payload.tipo_documento !== undefined) updates.push({ col: 'tipo_documento', val: validDocTypeOrDefault(payload.tipo_documento) })
    if (normalizedStatus !== null) updates.push({ col: 'status', val: normalizedStatus })

    const filtered = updates.filter((u) => u.val !== undefined)
    if (!filtered.length) return fail(400, { error: 'Nenhum campo válido para atualizar' })

    const updated = await updateById(kind, tenantId, id, filtered)
    if (!updated) return fail(404, { error: 'Não encontrado ou sem permissão' })

    return ok({ success: true, message: `${cfg.label} atualizada`, data: { id, ...(normalizedStatus ? { status: normalizedStatus } : {}) } })
  } catch (e: unknown) {
    const msg = (e as Error)?.message || String(e)
    const pgCode = String((e as any)?.code || '')
    if (pgCode === '23514') return fail(400, { error: `Violação de regra de dados: ${msg}` })
    return fail(500, { error: msg })
  }
}

export async function handleContaDeleteBlocked(req: NextRequest, kind: ContaKind) {
  const cfg = CONFIG[kind]
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    if (!verifyAuth(req)) return fail(401, { error: 'unauthorized' })
    const id = Number(payload.id)
    if (!Number.isFinite(id)) return fail(400, { error: 'id inválido' })
    return fail(409, {
      code: code(kind, 'DELETE_NOT_ALLOWED'),
      error: `${cfg.label} é uma transação e não pode ser excluída pela tool CRUD. Use action=\"cancelar\".`,
      result: {
        success: false,
        message: `${cfg.label} é transacional e não permite exclusão`,
        data: { id, resource: cfg.resourcePath, allowed_action: 'cancelar', suggested_status: 'cancelado' },
      },
    })
  } catch (e: unknown) {
    return fail(500, { error: (e as Error)?.message || String(e) })
  }
}

const ACTION_RULES: Record<ContaAction, { toStatus: (cfg: ContaConfig) => string; allowedFrom: (cfg: ContaConfig) => string[]; notePrefix: string; successVerb: string }> = {
  baixar: {
    toStatus: (cfg) => cfg.paidStatus,
    allowedFrom: () => ['pendente', 'vencido', 'parcial'],
    notePrefix: '[baixa]',
    successVerb: 'baixada',
  },
  estornar: {
    toStatus: () => 'pendente',
    allowedFrom: (cfg) => [cfg.paidStatus],
    notePrefix: '[estorno]',
    successVerb: 'estornada',
  },
  cancelar: {
    toStatus: () => 'cancelado',
    allowedFrom: () => ['pendente', 'vencido', 'parcial'],
    notePrefix: '[cancelamento]',
    successVerb: 'cancelada',
  },
  reabrir: {
    toStatus: () => 'pendente',
    allowedFrom: (cfg) => ['cancelado', cfg.paidStatus],
    notePrefix: '[reabertura]',
    successVerb: 'reaberta',
  },
}

export async function handleContaAction(req: NextRequest, kind: ContaKind, action: ContaAction) {
  const cfg = CONFIG[kind]
  const rule = ACTION_RULES[action]
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    if (!verifyAuth(req)) return fail(401, { error: 'unauthorized' })
    const id = Number(payload.id)
    if (!Number.isFinite(id)) return fail(400, { error: 'id inválido' })
    const tenantId = resolveTenantId(req)
    const current = await getContaRow(kind, tenantId, id)
    if (!current) return fail(404, { error: 'Não encontrado ou sem permissão' })

    const currentStatus = normalizeStatus(kind, current.status || 'pendente')
    if (!isAllowedStatus(kind, currentStatus)) {
      return fail(409, {
        code: code(kind, 'STATUS_UNKNOWN'),
        error: `Status atual inválido para ${action}: ${currentStatus || '(vazio)'}`,
        result: { success: false, message: 'Status atual inválido', data: { id, current_status: currentStatus } },
      })
    }

    const targetStatus = rule.toStatus(cfg)
    if (currentStatus === targetStatus && action !== 'estornar') {
      return ok({
        success: true,
        message: `${cfg.label} já estava ${targetStatus}`,
        data: { id, status: targetStatus, unchanged: true },
      })
    }

    const allowedFrom = rule.allowedFrom(cfg)
    if (!allowedFrom.includes(currentStatus)) {
      return fail(409, {
        code: code(kind, `${action.toUpperCase()}_NOT_ALLOWED`),
        error: `${action} não permitido para status ${currentStatus}`,
        result: {
          success: false,
          message: `${action} não permitido neste status`,
          data: { id, current_status: currentStatus, allowed_statuses: allowedFrom },
        },
      })
    }

    const noteRaw = toText(
      payload.motivo || payload.motivo_cancelamento || payload.motivo_estorno || payload.observacao || payload.descricao,
    )
    const note = noteRaw ? `${rule.notePrefix} ${noteRaw}` : rule.notePrefix
    const observacao = appendObservation(current.observacao, note)

    const updated = await updateById(kind, tenantId, id, [
      { col: 'status', val: targetStatus },
      { col: 'observacao', val: observacao },
    ])
    if (!updated) return fail(404, { error: 'Não encontrado ou sem permissão' })

    return ok({
      success: true,
      message: `${cfg.label} ${rule.successVerb}`,
      data: { id, status: targetStatus },
    })
  } catch (e: unknown) {
    const msg = (e as Error)?.message || String(e)
    const pgCode = String((e as any)?.code || '')
    if (pgCode === '23514') return fail(400, { error: `Violação de regra de dados: ${msg}` })
    return fail(500, { error: msg })
  }
}

export function getContaStatusSpecForDocs() {
  return {
    contas_a_pagar: {
      canonical_statuses: AP_CANONICAL,
      aliases: AP_ALIASES,
      transitions: AP_TRANSITIONS,
      business_actions: {
        baixar: { from: ACTION_RULES.baixar.allowedFrom(CONFIG.ap), to: CONFIG.ap.paidStatus },
        estornar: { from: ACTION_RULES.estornar.allowedFrom(CONFIG.ap), to: 'pendente' },
        cancelar: { from: ACTION_RULES.cancelar.allowedFrom(CONFIG.ap), to: 'cancelado' },
        reabrir: { from: ACTION_RULES.reabrir.allowedFrom(CONFIG.ap), to: 'pendente' },
      },
    },
    contas_a_receber: {
      canonical_statuses: AR_CANONICAL,
      aliases: AR_ALIASES,
      transitions: AR_TRANSITIONS,
      business_actions: {
        baixar: { from: ACTION_RULES.baixar.allowedFrom(CONFIG.ar), to: CONFIG.ar.paidStatus },
        estornar: { from: ACTION_RULES.estornar.allowedFrom(CONFIG.ar), to: 'pendente' },
        cancelar: { from: ACTION_RULES.cancelar.allowedFrom(CONFIG.ar), to: 'cancelado' },
        reabrir: { from: ACTION_RULES.reabrir.allowedFrom(CONFIG.ar), to: 'pendente' },
      },
    },
  }
}
