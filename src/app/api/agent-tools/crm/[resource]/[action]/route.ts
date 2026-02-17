import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

type Params = { resource: string; action: string }
type JsonMap = Record<string, unknown>

type CrmResource = 'contas' | 'contatos' | 'leads' | 'oportunidades' | 'atividades'
type CrudAction = 'listar' | 'criar' | 'atualizar' | 'deletar'

const RESOURCE_ACTIONS: Record<CrmResource, CrudAction[]> = {
  contas: ['listar', 'criar', 'atualizar', 'deletar'],
  contatos: ['listar', 'criar', 'atualizar', 'deletar'],
  leads: ['listar', 'criar', 'atualizar', 'deletar'],
  oportunidades: ['listar', 'criar', 'atualizar', 'deletar'],
  atividades: ['listar', 'criar', 'atualizar', 'deletar'],
}

function toObj(input: unknown): JsonMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function textOrNull(value: unknown): string | null {
  const out = toText(value)
  return out ? out : null
}

function hasOwn(obj: JsonMap, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function intOrNull(value: unknown): number | null {
  const n = numberOrNull(value)
  return n == null ? null : Math.trunc(n)
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const k = Math.trunc(n)
  return k > 0 ? k : fallback
}

function normalizeResource(value: unknown): CrmResource | null {
  const v = toText(value).toLowerCase()
  if (v === 'contas' || v === 'contatos' || v === 'leads' || v === 'oportunidades' || v === 'atividades') {
    return v
  }
  return null
}

function normalizeAction(value: unknown): CrudAction | null {
  const v = toText(value).toLowerCase()
  if (v === 'listar' || v === 'criar' || v === 'atualizar' || v === 'deletar') return v
  return null
}

function parseTenantId(req: NextRequest, payload: JsonMap): number {
  const fromHeader = Number(req.headers.get('x-tenant-id') || '')
  if (Number.isFinite(fromHeader) && fromHeader > 0) return Math.trunc(fromHeader)
  const fromPayload = Number(payload.tenant_id)
  if (Number.isFinite(fromPayload) && fromPayload > 0) return Math.trunc(fromPayload)
  return 1
}

function unauthorized(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return !verifyAgentToken(chatId, token)
}

async function listRows(resource: CrmResource, tenantId: number, payload: JsonMap) {
  const q = toText(payload.q)
  const status = toText(payload.status).toLowerCase()
  const page = parsePositiveInt(payload.page, 1)
  const pageSize = Math.min(parsePositiveInt(payload.pageSize ?? payload.limit, 20), 200)
  const offset = (page - 1) * pageSize

  if (resource === 'contas') {
    const params: unknown[] = [tenantId]
    const where: string[] = ['tenant_id = $1']
    if (q) {
      params.push(q)
      where.push(`(nome ILIKE '%' || $${params.length} || '%' OR COALESCE(setor,'') ILIKE '%' || $${params.length} || '%' OR COALESCE(site,'') ILIKE '%' || $${params.length} || '%')`)
    }
    const whereSql = `WHERE ${where.join(' AND ')}`
    const rows = await runQuery(
      `SELECT id, nome, setor, site, telefone, endereco_cobranca, responsavel_id, criado_em, atualizado_em
       FROM crm.contas
       ${whereSql}
       ORDER BY id DESC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset]
    )
    const [{ total }] = await runQuery<{ total: number }>(`SELECT COUNT(*)::int AS total FROM crm.contas ${whereSql}`, params)
    return { rows, count: total ?? rows.length }
  }

  if (resource === 'contatos') {
    const params: unknown[] = [tenantId]
    const where: string[] = ['tenant_id = $1']
    if (q) {
      params.push(q)
      where.push(`(nome ILIKE '%' || $${params.length} || '%' OR COALESCE(email,'') ILIKE '%' || $${params.length} || '%' OR COALESCE(cargo,'') ILIKE '%' || $${params.length} || '%')`)
    }
    const contaId = intOrNull(payload.conta_id)
    if (contaId != null) {
      params.push(contaId)
      where.push(`conta_id = $${params.length}`)
    }
    const whereSql = `WHERE ${where.join(' AND ')}`
    const rows = await runQuery(
      `SELECT id, conta_id, nome, cargo, email, telefone, responsavel_id, criado_em, atualizado_em
       FROM crm.contatos
       ${whereSql}
       ORDER BY id DESC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset]
    )
    const [{ total }] = await runQuery<{ total: number }>(`SELECT COUNT(*)::int AS total FROM crm.contatos ${whereSql}`, params)
    return { rows, count: total ?? rows.length }
  }

  if (resource === 'leads') {
    const params: unknown[] = [tenantId]
    const where: string[] = ['tenant_id = $1']
    if (q) {
      params.push(q)
      where.push(`(nome ILIKE '%' || $${params.length} || '%' OR COALESCE(empresa,'') ILIKE '%' || $${params.length} || '%' OR COALESCE(email,'') ILIKE '%' || $${params.length} || '%')`)
    }
    if (status) {
      params.push(status)
      where.push(`LOWER(COALESCE(status, '')) = $${params.length}`)
    }
    const whereSql = `WHERE ${where.join(' AND ')}`
    const rows = await runQuery(
      `SELECT id, nome, empresa, email, telefone, origem_id, status, responsavel_id, tag, descricao, criado_em, atualizado_em
       FROM crm.leads
       ${whereSql}
       ORDER BY id DESC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset]
    )
    const [{ total }] = await runQuery<{ total: number }>(`SELECT COUNT(*)::int AS total FROM crm.leads ${whereSql}`, params)
    return { rows, count: total ?? rows.length }
  }

  if (resource === 'oportunidades') {
    const params: unknown[] = [tenantId]
    const where: string[] = ['o.tenant_id = $1']
    if (q) {
      params.push(q)
      where.push(`(o.nome ILIKE '%' || $${params.length} || '%' OR COALESCE(c.nome,'') ILIKE '%' || $${params.length} || '%' OR COALESCE(l.nome,'') ILIKE '%' || $${params.length} || '%')`)
    }
    if (status) {
      params.push(status)
      where.push(`LOWER(COALESCE(o.status, '')) = $${params.length}`)
    }
    const whereSql = `WHERE ${where.join(' AND ')}`
    const rows = await runQuery(
      `SELECT o.id, o.nome, o.conta_id, c.nome AS conta_nome, o.lead_id, l.nome AS lead_nome,
              o.vendedor_id, o.fase_pipeline_id, fp.nome AS fase,
              o.valor_estimado, o.probabilidade, o.data_prevista, o.data_fechamento, o.status,
              o.motivo_perda_id, o.descricao, o.criado_em, o.atualizado_em
       FROM crm.oportunidades o
       LEFT JOIN crm.contas c ON c.id = o.conta_id AND c.tenant_id = o.tenant_id
       LEFT JOIN crm.leads l ON l.id = o.lead_id AND l.tenant_id = o.tenant_id
       LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id AND fp.tenant_id = o.tenant_id
       ${whereSql}
       ORDER BY o.id DESC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset]
    )
    const [{ total }] = await runQuery<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM crm.oportunidades o ${whereSql}`,
      params
    )
    return { rows, count: total ?? rows.length }
  }

  const params: unknown[] = [tenantId]
  const where: string[] = ['tenant_id = $1']
  if (q) {
    params.push(q)
    where.push(`(COALESCE(assunto,'') ILIKE '%' || $${params.length} || '%' OR COALESCE(descricao,'') ILIKE '%' || $${params.length} || '%')`)
  }
  if (status) {
    params.push(status)
    where.push(`LOWER(COALESCE(status, '')) = $${params.length}`)
  }
  const whereSql = `WHERE ${where.join(' AND ')}`
  const rows = await runQuery(
    `SELECT id, conta_id, contato_id, lead_id, oportunidade_id, tipo, assunto, descricao,
            data_prevista, data_conclusao, status, responsavel_id, anotacoes, criado_em, atualizado_em
     FROM crm.atividades
     ${whereSql}
     ORDER BY id DESC
     LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
    [...params, pageSize, offset]
  )
  const [{ total }] = await runQuery<{ total: number }>(`SELECT COUNT(*)::int AS total FROM crm.atividades ${whereSql}`, params)
  return { rows, count: total ?? rows.length }
}

async function resolveFasePipelineId(tenantId: number, payload: JsonMap): Promise<number | null> {
  const faseId = intOrNull(payload.fase_pipeline_id)
  if (faseId != null) return faseId

  const stageName = toText(payload.estagio || payload.fase)
  if (stageName) {
    const rows = await runQuery<{ id: number }>(
      `SELECT id
       FROM crm.fases_pipeline
       WHERE tenant_id = $1
         AND LOWER(nome) = LOWER($2)
         AND COALESCE(ativo, true) = true
       ORDER BY ordem ASC, id ASC
       LIMIT 1`,
      [tenantId, stageName]
    )
    if (rows[0]?.id) return Number(rows[0].id)
  }

  const fallback = await runQuery<{ id: number }>(
    `SELECT id
     FROM crm.fases_pipeline
     WHERE tenant_id = $1
       AND COALESCE(ativo, true) = true
     ORDER BY ordem ASC, id ASC
     LIMIT 1`,
    [tenantId]
  )
  return fallback[0]?.id ? Number(fallback[0].id) : null
}

async function createRow(resource: CrmResource, tenantId: number, payload: JsonMap) {
  if (resource === 'contas') {
    const nome = toText(payload.nome)
    if (!nome) return { status: 400, body: { ok: false, error: 'nome é obrigatório' } }

    const rows = await runQuery<{ id: number }>(
      `INSERT INTO crm.contas (tenant_id, nome, setor, site, telefone, endereco_cobranca, responsavel_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [
        tenantId,
        nome,
        textOrNull(payload.setor),
        textOrNull(payload.site),
        textOrNull(payload.telefone),
        textOrNull(payload.endereco_cobranca),
        intOrNull(payload.responsavel_id ?? payload.usuario_id),
      ]
    )
    return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Conta criada' } } }
  }

  if (resource === 'contatos') {
    const nome = toText(payload.nome)
    const primeiroNome = toText(payload.primeiro_nome)
    const sobrenome = toText(payload.sobrenome)
    const nomeFinal = nome || [primeiroNome, sobrenome].filter(Boolean).join(' ').trim()
    if (!nomeFinal) return { status: 400, body: { ok: false, error: 'nome é obrigatório' } }

    const rows = await runQuery<{ id: number }>(
      `INSERT INTO crm.contatos (tenant_id, conta_id, nome, cargo, email, telefone, responsavel_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [
        tenantId,
        intOrNull(payload.conta_id),
        nomeFinal,
        textOrNull(payload.cargo),
        textOrNull(payload.email),
        textOrNull(payload.telefone),
        intOrNull(payload.responsavel_id ?? payload.usuario_id),
      ]
    )
    return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Contato criado' } } }
  }

  if (resource === 'leads') {
    const nome = toText(payload.nome)
    const primeiroNome = toText(payload.primeiro_nome)
    const sobrenome = toText(payload.sobrenome)
    const nomeFinal = nome || [primeiroNome, sobrenome].filter(Boolean).join(' ').trim()
    if (!nomeFinal) return { status: 400, body: { ok: false, error: 'nome é obrigatório' } }

    let origemId = intOrNull(payload.origem_id)
    const origemNome = toText(payload.origem)
    if (origemId == null && origemNome) {
      const existing = await runQuery<{ id: number }>(
        `SELECT id FROM crm.origens_lead WHERE tenant_id = $1 AND LOWER(nome) = LOWER($2) LIMIT 1`,
        [tenantId, origemNome]
      )
      if (existing[0]?.id) {
        origemId = Number(existing[0].id)
      } else {
        const created = await runQuery<{ id: number }>(
          `INSERT INTO crm.origens_lead (tenant_id, nome, ativo)
           VALUES ($1, $2, true)
           RETURNING id`,
          [tenantId, origemNome]
        )
        origemId = created[0]?.id ? Number(created[0].id) : null
      }
    }

    const rows = await runQuery<{ id: number }>(
      `INSERT INTO crm.leads (tenant_id, nome, empresa, email, telefone, origem_id, status, responsavel_id, tag, descricao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        tenantId,
        nomeFinal,
        textOrNull(payload.empresa),
        textOrNull(payload.email),
        textOrNull(payload.telefone),
        origemId,
        textOrNull(payload.status),
        intOrNull(payload.responsavel_id ?? payload.usuario_id),
        textOrNull(payload.tag),
        textOrNull(payload.descricao),
      ]
    )
    return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Lead criado' } } }
  }

  if (resource === 'oportunidades') {
    const nome = toText(payload.nome)
    if (!nome) return { status: 400, body: { ok: false, error: 'nome é obrigatório' } }

    const fasePipelineId = await resolveFasePipelineId(tenantId, payload)
    if (fasePipelineId == null) {
      return { status: 400, body: { ok: false, error: 'Nenhuma fase de pipeline encontrada em crm.fases_pipeline' } }
    }

    const rows = await runQuery<{ id: number }>(
      `INSERT INTO crm.oportunidades
        (tenant_id, nome, conta_id, lead_id, cliente_id, vendedor_id, territorio_id, fase_pipeline_id, valor_estimado, probabilidade, data_prevista, data_fechamento, status, motivo_perda_id, descricao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        tenantId,
        nome,
        intOrNull(payload.conta_id),
        intOrNull(payload.lead_id),
        intOrNull(payload.cliente_id),
        intOrNull(payload.vendedor_id ?? payload.usuario_id ?? payload.responsavel_id),
        intOrNull(payload.territorio_id),
        fasePipelineId,
        numberOrNull(payload.valor_estimado ?? payload.valor),
        numberOrNull(payload.probabilidade),
        textOrNull(payload.data_prevista ?? payload.data_fechamento),
        textOrNull(payload.data_fechamento),
        textOrNull(payload.status),
        intOrNull(payload.motivo_perda_id),
        textOrNull(payload.descricao),
      ]
    )
    return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Oportunidade criada' } } }
  }

  const assunto = toText(payload.assunto || payload.descricao)
  if (!assunto) return { status: 400, body: { ok: false, error: 'assunto é obrigatório' } }

  const rows = await runQuery<{ id: number }>(
    `INSERT INTO crm.atividades
      (tenant_id, conta_id, contato_id, lead_id, oportunidade_id, tipo, descricao, data_prevista, data_conclusao, status, responsavel_id, assunto, anotacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id`,
    [
      tenantId,
      intOrNull(payload.conta_id),
      intOrNull(payload.contato_id),
      intOrNull(payload.lead_id),
      intOrNull(payload.oportunidade_id),
      textOrNull(payload.tipo) || 'tarefa',
      assunto,
      textOrNull(payload.data_prevista ?? payload.data_vencimento),
      textOrNull(payload.data_conclusao),
      textOrNull(payload.status),
      intOrNull(payload.responsavel_id ?? payload.usuario_id),
      assunto,
      textOrNull(payload.anotacoes),
    ]
  )

  return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Atividade criada' } } }
}

async function updateRow(resource: CrmResource, tenantId: number, payload: JsonMap) {
  const id = intOrNull(payload.id)
  if (id == null || id <= 0) return { status: 400, body: { ok: false, error: 'id é obrigatório para atualizar' } }

  const setParts: string[] = []
  const values: unknown[] = []
  const add = (column: string, value: unknown) => {
    setParts.push(`${column} = $${values.length + 1}`)
    values.push(value)
  }

  if (resource === 'contas') {
    if (hasOwn(payload, 'nome')) add('nome', textOrNull(payload.nome))
    if (hasOwn(payload, 'setor')) add('setor', textOrNull(payload.setor))
    if (hasOwn(payload, 'site')) add('site', textOrNull(payload.site))
    if (hasOwn(payload, 'telefone')) add('telefone', textOrNull(payload.telefone))
    if (hasOwn(payload, 'endereco_cobranca')) add('endereco_cobranca', textOrNull(payload.endereco_cobranca))
    if (hasOwn(payload, 'responsavel_id') || hasOwn(payload, 'usuario_id')) add('responsavel_id', intOrNull(payload.responsavel_id ?? payload.usuario_id))
  } else if (resource === 'contatos') {
    if (hasOwn(payload, 'nome')) add('nome', textOrNull(payload.nome))
    if (hasOwn(payload, 'conta_id')) add('conta_id', intOrNull(payload.conta_id))
    if (hasOwn(payload, 'cargo')) add('cargo', textOrNull(payload.cargo))
    if (hasOwn(payload, 'email')) add('email', textOrNull(payload.email))
    if (hasOwn(payload, 'telefone')) add('telefone', textOrNull(payload.telefone))
    if (hasOwn(payload, 'responsavel_id') || hasOwn(payload, 'usuario_id')) add('responsavel_id', intOrNull(payload.responsavel_id ?? payload.usuario_id))
  } else if (resource === 'leads') {
    if (hasOwn(payload, 'nome')) add('nome', textOrNull(payload.nome))
    if (hasOwn(payload, 'empresa')) add('empresa', textOrNull(payload.empresa))
    if (hasOwn(payload, 'email')) add('email', textOrNull(payload.email))
    if (hasOwn(payload, 'telefone')) add('telefone', textOrNull(payload.telefone))
    if (hasOwn(payload, 'origem_id')) add('origem_id', intOrNull(payload.origem_id))
    if (hasOwn(payload, 'status')) add('status', textOrNull(payload.status))
    if (hasOwn(payload, 'responsavel_id') || hasOwn(payload, 'usuario_id')) add('responsavel_id', intOrNull(payload.responsavel_id ?? payload.usuario_id))
    if (hasOwn(payload, 'tag')) add('tag', textOrNull(payload.tag))
    if (hasOwn(payload, 'descricao')) add('descricao', textOrNull(payload.descricao))
  } else if (resource === 'oportunidades') {
    if (hasOwn(payload, 'nome')) add('nome', textOrNull(payload.nome))
    if (hasOwn(payload, 'conta_id')) add('conta_id', intOrNull(payload.conta_id))
    if (hasOwn(payload, 'lead_id')) add('lead_id', intOrNull(payload.lead_id))
    if (hasOwn(payload, 'cliente_id')) add('cliente_id', intOrNull(payload.cliente_id))
    if (hasOwn(payload, 'vendedor_id') || hasOwn(payload, 'usuario_id') || hasOwn(payload, 'responsavel_id')) {
      add('vendedor_id', intOrNull(payload.vendedor_id ?? payload.usuario_id ?? payload.responsavel_id))
    }
    if (hasOwn(payload, 'territorio_id')) add('territorio_id', intOrNull(payload.territorio_id))
    if (hasOwn(payload, 'fase_pipeline_id')) add('fase_pipeline_id', intOrNull(payload.fase_pipeline_id))
    if (hasOwn(payload, 'valor_estimado') || hasOwn(payload, 'valor')) add('valor_estimado', numberOrNull(payload.valor_estimado ?? payload.valor))
    if (hasOwn(payload, 'probabilidade')) add('probabilidade', numberOrNull(payload.probabilidade))
    if (hasOwn(payload, 'data_prevista')) add('data_prevista', textOrNull(payload.data_prevista))
    if (hasOwn(payload, 'data_fechamento')) add('data_fechamento', textOrNull(payload.data_fechamento))
    if (hasOwn(payload, 'status')) add('status', textOrNull(payload.status))
    if (hasOwn(payload, 'motivo_perda_id')) add('motivo_perda_id', intOrNull(payload.motivo_perda_id))
    if (hasOwn(payload, 'descricao')) add('descricao', textOrNull(payload.descricao))
  } else {
    if (hasOwn(payload, 'conta_id')) add('conta_id', intOrNull(payload.conta_id))
    if (hasOwn(payload, 'contato_id')) add('contato_id', intOrNull(payload.contato_id))
    if (hasOwn(payload, 'lead_id')) add('lead_id', intOrNull(payload.lead_id))
    if (hasOwn(payload, 'oportunidade_id')) add('oportunidade_id', intOrNull(payload.oportunidade_id))
    if (hasOwn(payload, 'tipo')) add('tipo', textOrNull(payload.tipo))
    if (hasOwn(payload, 'descricao')) add('descricao', textOrNull(payload.descricao))
    if (hasOwn(payload, 'assunto')) add('assunto', textOrNull(payload.assunto))
    if (hasOwn(payload, 'data_prevista') || hasOwn(payload, 'data_vencimento')) add('data_prevista', textOrNull(payload.data_prevista ?? payload.data_vencimento))
    if (hasOwn(payload, 'data_conclusao')) add('data_conclusao', textOrNull(payload.data_conclusao))
    if (hasOwn(payload, 'status')) add('status', textOrNull(payload.status))
    if (hasOwn(payload, 'responsavel_id') || hasOwn(payload, 'usuario_id')) add('responsavel_id', intOrNull(payload.responsavel_id ?? payload.usuario_id))
    if (hasOwn(payload, 'anotacoes')) add('anotacoes', textOrNull(payload.anotacoes))
  }

  if (setParts.length === 0) {
    return { status: 400, body: { ok: false, error: 'Nenhum campo para atualizar' } }
  }

  const table = resource === 'contas'
    ? 'crm.contas'
    : resource === 'contatos'
      ? 'crm.contatos'
      : resource === 'leads'
        ? 'crm.leads'
        : resource === 'oportunidades'
          ? 'crm.oportunidades'
          : 'crm.atividades'

  const rows = await runQuery<{ id: number }>(
    `UPDATE ${table}
     SET ${setParts.join(', ')}
     WHERE id = $${values.length + 1}
       AND tenant_id = $${values.length + 2}
     RETURNING id`,
    [...values, id, tenantId]
  )

  if (!rows[0]?.id) {
    return { status: 404, body: { ok: false, error: 'Registro não encontrado para atualizar' } }
  }

  return { status: 200, body: { ok: true, result: { success: true, id: rows[0].id, message: 'Registro atualizado' } } }
}

async function deleteRow(resource: CrmResource, tenantId: number, payload: JsonMap) {
  const id = intOrNull(payload.id)
  if (id == null || id <= 0) return { status: 400, body: { ok: false, error: 'id é obrigatório para deletar' } }

  const table = resource === 'contas'
    ? 'crm.contas'
    : resource === 'contatos'
      ? 'crm.contatos'
      : resource === 'leads'
        ? 'crm.leads'
        : resource === 'oportunidades'
          ? 'crm.oportunidades'
          : 'crm.atividades'

  const rows = await runQuery<{ id: number }>(
    `DELETE FROM ${table}
     WHERE id = $1 AND tenant_id = $2
     RETURNING id`,
    [id, tenantId]
  )

  if (!rows[0]?.id) {
    return { status: 404, body: { ok: false, error: 'Registro não encontrado para deletar' } }
  }

  return { status: 200, body: { ok: true, result: { success: true, id: rows[0].id, message: 'Registro deletado' } } }
}

async function handle(req: NextRequest, params: Params, payload: JsonMap) {
  if (unauthorized(req)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const resource = normalizeResource(params.resource)
  if (!resource) {
    return Response.json({ ok: false, error: `resource inválido para CRM: ${params.resource}` }, { status: 400 })
  }

  const action = normalizeAction(params.action)
  if (!action) {
    return Response.json({ ok: false, error: `action inválida: ${params.action}` }, { status: 400 })
  }

  if (!RESOURCE_ACTIONS[resource].includes(action)) {
    return Response.json(
      { ok: false, error: `action não suportada para crm/${resource}: ${action}` },
      { status: 400 }
    )
  }

  const tenantId = parseTenantId(req, payload)

  try {
    if (action === 'listar') {
      const out = await listRows(resource, tenantId, payload)
      return Response.json({ ok: true, result: { success: true, ...out, message: `${out.count} registros em crm/${resource}` } })
    }

    if (action === 'criar') {
      const out = await createRow(resource, tenantId, payload)
      return Response.json(out.body, { status: out.status })
    }

    if (action === 'atualizar') {
      const out = await updateRow(resource, tenantId, payload)
      return Response.json(out.body, { status: out.status })
    }

    const out = await deleteRow(resource, tenantId, payload)
    return Response.json(out.body, { status: out.status })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  const payload = toObj(await req.json().catch(() => ({})))
  return handle(req, params, payload)
}

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  const payload = Object.fromEntries(new URL(req.url).searchParams.entries()) as JsonMap
  return handle(req, params, payload)
}
