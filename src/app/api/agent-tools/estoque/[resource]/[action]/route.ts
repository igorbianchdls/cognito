import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

type Params = { resource: string; action: string }
type JsonMap = Record<string, unknown>

type EstoqueResource = 'almoxarifados' | 'movimentacoes' | 'estoque-atual' | 'tipos-movimentacao'
type CrudAction = 'listar' | 'criar' | 'atualizar' | 'deletar'

const RESOURCE_ACTIONS: Record<EstoqueResource, CrudAction[]> = {
  almoxarifados: ['listar', 'criar', 'atualizar', 'deletar'],
  movimentacoes: ['listar', 'criar', 'atualizar', 'deletar'],
  'estoque-atual': ['listar'],
  'tipos-movimentacao': ['listar'],
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

function boolOrNull(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  const txt = toText(value).toLowerCase()
  if (!txt) return null
  if (txt === '1' || txt === 'true' || txt === 'sim' || txt === 'yes') return true
  if (txt === '0' || txt === 'false' || txt === 'nao' || txt === 'não' || txt === 'no') return false
  return null
}

function normalizeResource(value: unknown): EstoqueResource | null {
  const v = toText(value).toLowerCase()
  if (v === 'almoxarifados' || v === 'movimentacoes' || v === 'estoque-atual' || v === 'tipos-movimentacao') {
    return v
  }
  return null
}

function normalizeAction(value: unknown): CrudAction | null {
  const v = toText(value).toLowerCase()
  if (v === 'listar' || v === 'criar' || v === 'atualizar' || v === 'deletar') return v
  return null
}

function unauthorized(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return !verifyAgentToken(chatId, token)
}

async function inferTipoMovimento(tipoCodigo: string | null): Promise<string> {
  if (!tipoCodigo) return 'entrada'
  const rows = await runQuery<{ natureza: string | null }>(
    `SELECT natureza FROM estoque.tipos_movimentacao WHERE codigo = $1 LIMIT 1`,
    [tipoCodigo]
  )
  const natureza = toText(rows[0]?.natureza).toLowerCase()
  if (natureza === 'saida' || natureza === 'saída') return 'saida'
  return 'entrada'
}

async function recalculateEstoqueAtual(produtoId: number, almoxarifadoId: number) {
  const totals = await runQuery<{ quantidade: number | string | null; valor: number | string | null }>(
    `SELECT
       COALESCE(SUM(
         CASE
           WHEN LOWER(COALESCE(tipo_movimento, '')) IN ('saida', 'saída') THEN -ABS(COALESCE(quantidade, 0)::numeric)
           ELSE ABS(COALESCE(quantidade, 0)::numeric)
         END
       ), 0)::numeric AS quantidade,
       COALESCE(SUM(
         CASE
           WHEN LOWER(COALESCE(tipo_movimento, '')) IN ('saida', 'saída') THEN -ABS(COALESCE(valor_total, 0)::numeric)
           ELSE ABS(COALESCE(valor_total, 0)::numeric)
         END
       ), 0)::numeric AS valor
     FROM estoque.movimentacoes_estoque
     WHERE produto_id = $1 AND almoxarifado_id = $2`,
    [produtoId, almoxarifadoId]
  )

  const qtd = Number(totals[0]?.quantidade ?? 0)
  const val = Number(totals[0]?.valor ?? 0)
  const custoMedio = qtd > 0 ? val / qtd : 0

  const updated = await runQuery<{ id: number }>(
    `UPDATE estoque.estoques_atual
     SET quantidade = $3, custo_medio = $4, atualizado_em = now()
     WHERE produto_id = $1 AND almoxarifado_id = $2
     RETURNING id`,
    [produtoId, almoxarifadoId, qtd, custoMedio]
  )

  if (!updated[0]?.id) {
    await runQuery(
      `INSERT INTO estoque.estoques_atual (produto_id, almoxarifado_id, quantidade, custo_medio, atualizado_em)
       VALUES ($1, $2, $3, $4, now())`,
      [produtoId, almoxarifadoId, qtd, custoMedio]
    )
  }
}

async function listRows(resource: EstoqueResource, payload: JsonMap) {
  const q = toText(payload.q)
  const status = toText(payload.status).toLowerCase()
  const page = parsePositiveInt(payload.page, 1)
  const pageSize = Math.min(parsePositiveInt(payload.pageSize ?? payload.limit, 20), 200)
  const offset = (page - 1) * pageSize

  if (resource === 'almoxarifados') {
    const params: unknown[] = []
    const where: string[] = []
    if (status) {
      params.push(status)
      where.push(`LOWER(CASE WHEN a.ativo THEN 'ativo' ELSE 'inativo' END) = $${params.length}`)
    }
    if (q) {
      params.push(q)
      where.push(`(a.nome ILIKE '%' || $${params.length} || '%' OR COALESCE(a.responsavel, '') ILIKE '%' || $${params.length} || '%')`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = await runQuery(
      `SELECT a.id, a.nome AS almoxarifado, a.tipo, a.endereco, a.responsavel,
              CASE WHEN a.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
              a.criado_em
       FROM estoque.almoxarifados a
       ${whereSql}
       ORDER BY a.nome ASC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset]
    )
    const [{ total }] = await runQuery<{ total: number }>(`SELECT COUNT(*)::int AS total FROM estoque.almoxarifados a ${whereSql}`, params)
    return { rows, count: total ?? rows.length }
  }

  if (resource === 'movimentacoes') {
    const params: unknown[] = []
    const where: string[] = []
    const almoxarifadoId = intOrNull(payload.almoxarifado_id)
    const produtoId = intOrNull(payload.produto_id)
    if (almoxarifadoId != null) {
      params.push(almoxarifadoId)
      where.push(`m.almoxarifado_id = $${params.length}`)
    }
    if (produtoId != null) {
      params.push(produtoId)
      where.push(`m.produto_id = $${params.length}`)
    }
    if (status) {
      params.push(status)
      where.push(`LOWER(COALESCE(m.tipo_movimento, '')) = $${params.length}`)
    }
    if (q) {
      params.push(q)
      where.push(`(COALESCE(p.nome, '') ILIKE '%' || $${params.length} || '%' OR COALESCE(tm.descricao, '') ILIKE '%' || $${params.length} || '%' OR COALESCE(m.observacoes, '') ILIKE '%' || $${params.length} || '%')`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = await runQuery(
      `SELECT m.id, m.produto_id, COALESCE(p.nome, m.produto_id::text) AS produto,
              m.almoxarifado_id, a.nome AS almoxarifado,
              m.tipo_codigo, tm.descricao AS descricao_movimento, m.tipo_movimento,
              m.quantidade, m.valor_unitario, m.valor_total,
              m.data_movimento, m.origem, m.observacoes
       FROM estoque.movimentacoes_estoque m
       LEFT JOIN estoque.tipos_movimentacao tm ON tm.codigo = m.tipo_codigo
       LEFT JOIN estoque.almoxarifados a ON a.id = m.almoxarifado_id
       LEFT JOIN produtos.produto p ON p.id = m.produto_id
       ${whereSql}
       ORDER BY m.data_movimento DESC, m.id DESC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset]
    )
    const [{ total }] = await runQuery<{ total: number }>(`SELECT COUNT(*)::int AS total FROM estoque.movimentacoes_estoque m ${whereSql}`, params)
    return { rows, count: total ?? rows.length }
  }

  if (resource === 'estoque-atual') {
    const params: unknown[] = []
    const where: string[] = []
    const almoxarifadoId = intOrNull(payload.almoxarifado_id)
    const produtoId = intOrNull(payload.produto_id)
    if (almoxarifadoId != null) {
      params.push(almoxarifadoId)
      where.push(`ea.almoxarifado_id = $${params.length}`)
    }
    if (produtoId != null) {
      params.push(produtoId)
      where.push(`ea.produto_id = $${params.length}`)
    }
    if (q) {
      params.push(q)
      where.push(`(COALESCE(p.nome, '') ILIKE '%' || $${params.length} || '%' OR COALESCE(a.nome, '') ILIKE '%' || $${params.length} || '%')`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = await runQuery(
      `SELECT ea.id, ea.produto_id, COALESCE(p.nome, ea.produto_id::text) AS produto,
              ea.almoxarifado_id, a.nome AS almoxarifado,
              ea.quantidade AS quantidade_atual, ea.custo_medio,
              ROUND(ea.quantidade * ea.custo_medio, 2) AS valor_total,
              ea.atualizado_em
       FROM estoque.estoques_atual ea
       LEFT JOIN estoque.almoxarifados a ON a.id = ea.almoxarifado_id
       LEFT JOIN produtos.produto p ON p.id = ea.produto_id
       ${whereSql}
       ORDER BY a.nome ASC, p.nome ASC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset]
    )
    const [{ total }] = await runQuery<{ total: number }>(`SELECT COUNT(*)::int AS total FROM estoque.estoques_atual ea ${whereSql}`, params)
    return { rows, count: total ?? rows.length }
  }

  const params: unknown[] = []
  const where: string[] = []
  if (status) {
    params.push(status)
    where.push(`LOWER(CASE WHEN tm.ativo THEN 'ativo' ELSE 'inativo' END) = $${params.length}`)
  }
  if (q) {
    params.push(q)
    where.push(`(tm.descricao ILIKE '%' || $${params.length} || '%' OR COALESCE(tm.natureza, '') ILIKE '%' || $${params.length} || '%')`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = await runQuery(
    `SELECT tm.codigo, tm.descricao, tm.natureza, tm.gera_financeiro,
            CASE WHEN tm.ativo THEN 'Ativo' ELSE 'Inativo' END AS status
     FROM estoque.tipos_movimentacao tm
     ${whereSql}
     ORDER BY tm.natureza ASC, tm.descricao ASC
     LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
    [...params, pageSize, offset]
  )
  const [{ total }] = await runQuery<{ total: number }>(`SELECT COUNT(*)::int AS total FROM estoque.tipos_movimentacao tm ${whereSql}`, params)
  return { rows, count: total ?? rows.length }
}

async function createRow(resource: EstoqueResource, payload: JsonMap) {
  if (resource === 'almoxarifados') {
    const nome = toText(payload.nome)
    if (!nome) return { status: 400, body: { ok: false, error: 'nome é obrigatório' } }

    const ativo = boolOrNull(payload.ativo)
    const rows = await runQuery<{ id: number }>(
      `INSERT INTO estoque.almoxarifados (nome, tipo, endereco, responsavel, ativo)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [
        nome,
        textOrNull(payload.tipo),
        textOrNull(payload.endereco),
        textOrNull(payload.responsavel),
        ativo == null ? true : ativo,
      ]
    )
    return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Almoxarifado criado' } } }
  }

  const produtoId = intOrNull(payload.produto_id)
  const almoxarifadoId = intOrNull(payload.almoxarifado_id)
  const quantidadeBase = numberOrNull(payload.quantidade)
  if (produtoId == null || almoxarifadoId == null || quantidadeBase == null) {
    return { status: 400, body: { ok: false, error: 'produto_id, almoxarifado_id e quantidade são obrigatórios' } }
  }

  const tipoCodigo = textOrNull(payload.tipo_codigo)
  const tipoMovimentoInput = toText(payload.tipo_movimento).toLowerCase()
  const tipoMovimento = tipoMovimentoInput || await inferTipoMovimento(tipoCodigo)
  const quantidade = Math.abs(quantidadeBase)
  const valorUnitario = Number(numberOrNull(payload.valor_unitario) ?? 0)
  const valorTotal = Number(numberOrNull(payload.valor_total) ?? (valorUnitario * quantidade))

  const rows = await runQuery<{ id: number }>(
    `INSERT INTO estoque.movimentacoes_estoque
      (produto_id, almoxarifado_id, tipo_codigo, tipo_movimento, quantidade, valor_unitario, valor_total, data_movimento, origem, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      produtoId,
      almoxarifadoId,
      tipoCodigo,
      tipoMovimento,
      quantidade,
      valorUnitario,
      valorTotal,
      textOrNull(payload.data_movimento),
      textOrNull(payload.origem),
      textOrNull(payload.observacoes),
    ]
  )

  await recalculateEstoqueAtual(produtoId, almoxarifadoId)
  return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Movimentação criada' } } }
}

async function updateRow(resource: EstoqueResource, payload: JsonMap) {
  const id = intOrNull(payload.id)
  if (id == null || id <= 0) return { status: 400, body: { ok: false, error: 'id é obrigatório para atualizar' } }

  if (resource === 'almoxarifados') {
    const setParts: string[] = []
    const values: unknown[] = []
    const add = (column: string, value: unknown) => {
      setParts.push(`${column} = $${values.length + 1}`)
      values.push(value)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'nome')) add('nome', textOrNull(payload.nome))
    if (Object.prototype.hasOwnProperty.call(payload, 'tipo')) add('tipo', textOrNull(payload.tipo))
    if (Object.prototype.hasOwnProperty.call(payload, 'endereco')) add('endereco', textOrNull(payload.endereco))
    if (Object.prototype.hasOwnProperty.call(payload, 'responsavel')) add('responsavel', textOrNull(payload.responsavel))
    if (Object.prototype.hasOwnProperty.call(payload, 'ativo')) add('ativo', boolOrNull(payload.ativo))

    if (setParts.length === 0) {
      return { status: 400, body: { ok: false, error: 'Nenhum campo para atualizar' } }
    }

    const rows = await runQuery<{ id: number }>(
      `UPDATE estoque.almoxarifados
       SET ${setParts.join(', ')}
       WHERE id = $${values.length + 1}
       RETURNING id`,
      [...values, id]
    )

    if (!rows[0]?.id) {
      return { status: 404, body: { ok: false, error: 'Registro não encontrado para atualizar' } }
    }

    return { status: 200, body: { ok: true, result: { success: true, id: rows[0].id, message: 'Almoxarifado atualizado' } } }
  }

  const existingRows = await runQuery<{
    id: number
    produto_id: number
    almoxarifado_id: number
    tipo_codigo: string | null
    tipo_movimento: string | null
    quantidade: number | string | null
    valor_unitario: number | string | null
    valor_total: number | string | null
    data_movimento: string | null
    origem: string | null
    observacoes: string | null
  }>(
    `SELECT id, produto_id, almoxarifado_id, tipo_codigo, tipo_movimento, quantidade, valor_unitario, valor_total, data_movimento, origem, observacoes
     FROM estoque.movimentacoes_estoque
     WHERE id = $1
     LIMIT 1`,
    [id]
  )

  const existing = existingRows[0]
  if (!existing) {
    return { status: 404, body: { ok: false, error: 'Movimentação não encontrada para atualizar' } }
  }

  const nextProdutoId = intOrNull(payload.produto_id) ?? Number(existing.produto_id)
  const nextAlmoxId = intOrNull(payload.almoxarifado_id) ?? Number(existing.almoxarifado_id)
  const nextTipoCodigo = Object.prototype.hasOwnProperty.call(payload, 'tipo_codigo')
    ? textOrNull(payload.tipo_codigo)
    : existing.tipo_codigo

  const tipoMovInput = toText(payload.tipo_movimento).toLowerCase()
  const nextTipoMovimento = tipoMovInput || (nextTipoCodigo !== existing.tipo_codigo
    ? await inferTipoMovimento(nextTipoCodigo)
    : toText(existing.tipo_movimento).toLowerCase() || 'entrada')

  const nextQuantidade = Math.abs(numberOrNull(payload.quantidade) ?? Number(existing.quantidade ?? 0))
  const nextValorUnitario = Number(numberOrNull(payload.valor_unitario) ?? Number(existing.valor_unitario ?? 0))
  const nextValorTotal = Number(numberOrNull(payload.valor_total) ?? (nextQuantidade * nextValorUnitario))
  const nextData = Object.prototype.hasOwnProperty.call(payload, 'data_movimento') ? textOrNull(payload.data_movimento) : existing.data_movimento
  const nextOrigem = Object.prototype.hasOwnProperty.call(payload, 'origem') ? textOrNull(payload.origem) : existing.origem
  const nextObs = Object.prototype.hasOwnProperty.call(payload, 'observacoes') ? textOrNull(payload.observacoes) : existing.observacoes

  await runQuery(
    `UPDATE estoque.movimentacoes_estoque
     SET produto_id = $1,
         almoxarifado_id = $2,
         tipo_codigo = $3,
         tipo_movimento = $4,
         quantidade = $5,
         valor_unitario = $6,
         valor_total = $7,
         data_movimento = $8,
         origem = $9,
         observacoes = $10
     WHERE id = $11`,
    [
      nextProdutoId,
      nextAlmoxId,
      nextTipoCodigo,
      nextTipoMovimento,
      nextQuantidade,
      nextValorUnitario,
      nextValorTotal,
      nextData,
      nextOrigem,
      nextObs,
      id,
    ]
  )

  await recalculateEstoqueAtual(Number(existing.produto_id), Number(existing.almoxarifado_id))
  if (nextProdutoId !== Number(existing.produto_id) || nextAlmoxId !== Number(existing.almoxarifado_id)) {
    await recalculateEstoqueAtual(nextProdutoId, nextAlmoxId)
  }

  return { status: 200, body: { ok: true, result: { success: true, id, message: 'Movimentação atualizada' } } }
}

async function deleteRow(resource: EstoqueResource, payload: JsonMap) {
  const id = intOrNull(payload.id)
  if (id == null || id <= 0) return { status: 400, body: { ok: false, error: 'id é obrigatório para deletar' } }

  if (resource === 'almoxarifados') {
    const rows = await runQuery<{ id: number }>(
      `DELETE FROM estoque.almoxarifados
       WHERE id = $1
       RETURNING id`,
      [id]
    )

    if (!rows[0]?.id) {
      return { status: 404, body: { ok: false, error: 'Registro não encontrado para deletar' } }
    }

    return { status: 200, body: { ok: true, result: { success: true, id: rows[0].id, message: 'Almoxarifado deletado' } } }
  }

  const existingRows = await runQuery<{ produto_id: number; almoxarifado_id: number }>(
    `SELECT produto_id, almoxarifado_id
     FROM estoque.movimentacoes_estoque
     WHERE id = $1
     LIMIT 1`,
    [id]
  )

  const existing = existingRows[0]
  if (!existing) {
    return { status: 404, body: { ok: false, error: 'Movimentação não encontrada para deletar' } }
  }

  await runQuery(`DELETE FROM estoque.movimentacoes_estoque WHERE id = $1`, [id])
  await recalculateEstoqueAtual(Number(existing.produto_id), Number(existing.almoxarifado_id))

  return { status: 200, body: { ok: true, result: { success: true, id, message: 'Movimentação deletada' } } }
}

async function handle(req: NextRequest, params: Params, payload: JsonMap) {
  if (unauthorized(req)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const resource = normalizeResource(params.resource)
  if (!resource) {
    return Response.json({ ok: false, error: `resource inválido para estoque: ${params.resource}` }, { status: 400 })
  }

  const action = normalizeAction(params.action)
  if (!action) {
    return Response.json({ ok: false, error: `action inválida: ${params.action}` }, { status: 400 })
  }

  if (!RESOURCE_ACTIONS[resource].includes(action)) {
    return Response.json(
      { ok: false, error: `action não suportada para estoque/${resource}: ${action}` },
      { status: 400 }
    )
  }

  try {
    if (action === 'listar') {
      const out = await listRows(resource, payload)
      return Response.json({ ok: true, result: { success: true, ...out, message: `${out.count} registros em estoque/${resource}` } })
    }

    if (action === 'criar') {
      const out = await createRow(resource, payload)
      return Response.json(out.body, { status: out.status })
    }

    if (action === 'atualizar') {
      const out = await updateRow(resource, payload)
      return Response.json(out.body, { status: out.status })
    }

    const out = await deleteRow(resource, payload)
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
