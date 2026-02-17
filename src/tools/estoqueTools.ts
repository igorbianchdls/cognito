import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

const ESTOQUE_SCHEMA = process.env.ESTOQUE_SCHEMA || 'estoque'
const PROD_SCHEMA = process.env.PRODUTOS_SCHEMA || 'produtos'
const fmtParams = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]')

const normalizeLimit = (limit?: number, def = 20, min = 1, max = 1000) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return def
  return Math.min(Math.max(Math.trunc(limit), min), max)
}

function buildWhere(push: (expr: string, val: unknown) => void, col?: string, de?: string, ate?: string) {
  if (!col) return
  if (de) push(`${col} >=`, de)
  if (ate) push(`${col} <=`, ate)
}

export const listarAlmoxarifadosEstoque = tool({
  description: 'Lista almoxarifados do schema de estoque'.trim(),
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, de, ate, q }) => {
    const a = `${ESTOQUE_SCHEMA}.almoxarifados`
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT a.id AS id,
                              a.nome AS almoxarifado,
                              a.tipo AS tipo,
                              a.endereco AS endereco,
                              a.responsavel AS responsavel,
                              CASE WHEN a.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                              a.criado_em AS criado_em`
    const baseSql = `FROM ${a} a`

    if (status) push(`LOWER(CASE WHEN a.ativo THEN 'ativo' ELSE 'inativo' END) =`, status.toLowerCase())
    if (q) { conditions.push(`(a.nome ILIKE '%' || $${i} || '%' OR a.responsavel ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'a.criado_em', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY a.nome ASC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} almoxarifado(s)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar almoxarifados', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarEstoqueAtual = tool({
  description: 'Lista o estoque atual por produto e almoxarifado'.trim(),
  inputSchema: z.object({
    limit: z.number().default(20),
    almoxarifado_id: z.string().optional(),
    produto_id: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, almoxarifado_id, produto_id, de, ate, q }) => {
    const ea = `${ESTOQUE_SCHEMA}.estoques_atual`
    const a = `${ESTOQUE_SCHEMA}.almoxarifados`
    const p = `${PROD_SCHEMA}.produto`
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT ea.id AS id,
                              COALESCE(p.nome, ea.produto_id::text) AS produto,
                              a.nome AS almoxarifado,
                              ea.quantidade AS quantidade_atual,
                              ea.custo_medio AS custo_medio,
                              ROUND(ea.quantidade * ea.custo_medio, 2) AS valor_total,
                              ea.atualizado_em AS atualizado_em`
    const baseSql = `FROM ${ea} ea
                     LEFT JOIN ${a} a ON ea.almoxarifado_id = a.id
                     LEFT JOIN ${p} p ON ea.produto_id = p.id`

    if (almoxarifado_id) push('ea.almoxarifado_id =', almoxarifado_id)
    if (produto_id) push('ea.produto_id =', produto_id)
    if (q) { conditions.push(`(COALESCE(p.nome,'') ILIKE '%' || $${i} || '%' OR a.nome ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'ea.atualizado_em', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY a.nome ASC, p.nome ASC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} registro(s) de estoque`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar estoque atual', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarMovimentacoesEstoque = tool({
  description: 'Lista movimentações de estoque'.trim(),
  inputSchema: z.object({
    limit: z.number().default(20),
    almoxarifado_id: z.string().optional(),
    produto_id: z.string().optional(),
    tipo_movimento: z.string().optional(),
    natureza: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, almoxarifado_id, produto_id, tipo_movimento, natureza, de, ate, q }) => {
    const m = `${ESTOQUE_SCHEMA}.movimentacoes_estoque`
    const tm = `${ESTOQUE_SCHEMA}.tipos_movimentacao`
    const a = `${ESTOQUE_SCHEMA}.almoxarifados`
    const p = `${PROD_SCHEMA}.produto`
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT m.id AS id,
                              COALESCE(p.nome, m.produto_id::text) AS produto,
                              a.nome AS almoxarifado,
                              m.tipo_movimento AS tipo_movimento,
                              tm.descricao AS descricao_movimento,
                              tm.natureza AS natureza,
                              m.quantidade AS quantidade,
                              m.valor_unitario AS valor_unitario,
                              m.valor_total AS valor_total,
                              m.data_movimento AS data_movimento,
                              m.origem AS origem,
                              m.observacoes AS observacoes`
    const baseSql = `FROM ${m} m
                     LEFT JOIN ${tm} tm ON m.tipo_codigo = tm.codigo
                     LEFT JOIN ${a} a ON m.almoxarifado_id = a.id
                     LEFT JOIN ${p} p ON m.produto_id = p.id`

    if (almoxarifado_id) push('m.almoxarifado_id =', almoxarifado_id)
    if (produto_id) push('m.produto_id =', produto_id)
    if (tipo_movimento) push('LOWER(m.tipo_movimento) =', tipo_movimento.toLowerCase())
    if (natureza) push('LOWER(tm.natureza) =', natureza.toLowerCase())
    if (q) { conditions.push(`(COALESCE(p.nome,'') ILIKE '%' || $${i} || '%' OR tm.descricao ILIKE '%' || $${i} || '%' OR COALESCE(m.observacoes,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'm.data_movimento', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY m.data_movimento DESC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} movimentação(ões)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar movimentações', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarTiposMovimentacao = tool({
  description: 'Lista tipos de movimentação de estoque'.trim(),
  inputSchema: z.object({
    limit: z.number().default(100),
    natureza: z.string().optional(),
    status: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, natureza, status, q }) => {
    const tm = `${ESTOQUE_SCHEMA}.tipos_movimentacao`
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT tm.codigo AS codigo,
                              tm.descricao AS descricao,
                              tm.natureza AS natureza,
                              CASE WHEN tm.gera_financeiro THEN 'Sim' ELSE 'Não' END AS gera_financeiro,
                              CASE WHEN tm.ativo THEN 'Ativo' ELSE 'Inativo' END AS status`
    const baseSql = `FROM ${tm} tm`

    if (natureza) push('LOWER(tm.natureza) =', natureza.toLowerCase())
    if (status) push(`LOWER(CASE WHEN tm.ativo THEN 'ativo' ELSE 'inativo' END) =`, status.toLowerCase())
    if (q) { conditions.push(`(tm.descricao ILIKE '%' || $${i} || '%' OR tm.natureza ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY tm.natureza ASC, tm.descricao ASC'
    const lim = normalizeLimit(limit, 100)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} tipo(s) de movimentação`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar tipos de movimentação', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})
