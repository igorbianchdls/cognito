import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

const fmtParams = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]')

type BaseFilters = {
  limit?: number
  de?: string
  ate?: string
  q?: string
}

function buildWhere(push: (expr: string, val: unknown) => void, col?: string, de?: string, ate?: string) {
  if (!col) return
  if (de) push(`${col} >=`, de)
  if (ate) push(`${col} <=`, ate)
}

export const listarFornecedoresCompra = tool({
  description: 'Lista fornecedores (schema compras)',
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    ativo: z.enum(['true','false']).optional(),
    pais: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, ativo, pais, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT f.id,
                              f.nome_fantasia AS nome_fantasia,
                              f.razao_social AS razao_social,
                              f.cnpj AS cnpj,
                              (f.cidade || ' - ' || f.estado) AS cidade_uf,
                              f.telefone AS telefone,
                              f.email AS email,
                              f.pais AS pais,
                              CASE WHEN f.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                              f.criado_em AS cadastrado_em`
    const baseSql = `FROM compras.fornecedores f`

    if (status) push(`LOWER(CASE WHEN f.ativo THEN 'ativo' ELSE 'inativo' END) =`, status.toLowerCase())
    if (ativo) push('CAST(f.ativo AS TEXT) =', ativo)
    if (pais) push('LOWER(f.pais) =', pais.toLowerCase())
    if (q) { conditions.push(`(f.nome_fantasia ILIKE '%' || $${i} || '%' OR f.razao_social ILIKE '%' || $${i} || '%' OR f.cnpj ILIKE '%' || $${i} || '%' OR f.email ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'f.criado_em', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY f.nome_fantasia ASC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} fornecedores`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar fornecedores', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarPedidosCompra = tool({
  description: 'Lista pedidos de compra (schema compras)',
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    fornecedor_id: z.string().optional(),
    condicao_pagamento_id: z.string().optional(),
    valor_min: z.number().optional(),
    valor_max: z.number().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, fornecedor_id, condicao_pagamento_id, valor_min, valor_max, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT p.id,
                              p.numero_pedido AS numero_pedido,
                              f.nome_fantasia AS fornecedor,
                              cp.descricao AS condicao_pagamento,
                              p.data_pedido AS data_pedido,
                              p.status AS status,
                              p.valor_total AS valor_total,
                              p.observacoes AS observacoes`
    const baseSql = `FROM compras.pedidos_compra p
                     LEFT JOIN compras.fornecedores f ON p.fornecedor_id = f.id
                     LEFT JOIN compras.condicoes_pagamento cp ON p.condicao_pagamento_id = cp.id`

    if (status) push('LOWER(p.status) =', status.toLowerCase())
    if (fornecedor_id) push('p.fornecedor_id =', fornecedor_id)
    if (condicao_pagamento_id) push('p.condicao_pagamento_id =', condicao_pagamento_id)
    if (valor_min !== undefined) push('p.valor_total >=', valor_min)
    if (valor_max !== undefined) push('p.valor_total <=', valor_max)
    if (q) { conditions.push(`(p.numero_pedido ILIKE '%' || $${i} || '%' OR COALESCE(p.observacoes,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'p.data_pedido', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY p.data_pedido DESC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} pedidos de compra`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar pedidos de compra', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarRecebimentosCompra = tool({
  description: 'Lista recebimentos de compra (schema compras)',
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    pedido_id: z.string().optional(),
    fornecedor_id: z.string().optional(),
    nota: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, pedido_id, fornecedor_id, nota, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT r.id AS id,
                              p.numero_pedido AS pedido,
                              f.nome_fantasia AS fornecedor,
                              r.data_recebimento AS data_recebimento,
                              r.numero_nota_fiscal AS nota_fiscal,
                              r.status AS status,
                              r.observacoes AS observacoes`
    const baseSql = `FROM compras.recebimentos_compra r
                     LEFT JOIN compras.pedidos_compra p ON r.pedido_id = p.id
                     LEFT JOIN compras.fornecedores f ON p.fornecedor_id = f.id`

    if (status) push('LOWER(r.status) =', status.toLowerCase())
    if (pedido_id) push('r.pedido_id =', pedido_id)
    if (fornecedor_id) push('p.fornecedor_id =', fornecedor_id)
    if (nota) push('r.numero_nota_fiscal ILIKE', `%${nota}%`)
    if (q) { conditions.push(`(p.numero_pedido ILIKE '%' || $${i} || '%' OR f.nome_fantasia ILIKE '%' || $${i} || '%' OR r.numero_nota_fiscal ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'r.data_recebimento', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY r.data_recebimento DESC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} recebimento(s)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar recebimentos', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarSolicitacoesCompra = tool({
  description: 'Lista solicitações de compra (schema compras)',
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT s.id AS id,
                              s.data_solicitacao AS data_solicitacao,
                              s.status AS status,
                              s.observacoes AS observacoes,
                              COUNT(si.id) AS itens_solicitados`
    const baseSql = `FROM compras.solicitacoes_compra s
                     LEFT JOIN compras.solicitacoes_itens si ON si.solicitacao_id = s.id`

    if (status) push('LOWER(s.status) =', status.toLowerCase())
    if (q) { conditions.push(`(COALESCE(s.observacoes,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 's.data_solicitacao', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const groupBy = 'GROUP BY s.id, s.data_solicitacao, s.status, s.observacoes'
    const orderClause = 'ORDER BY s.data_solicitacao DESC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${groupBy}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} solicitação(ões)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar solicitações', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarCotacoesCompra = tool({
  description: 'Lista cotações de compra (schema compras)',
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    fornecedor_id: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, fornecedor_id, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT c.id AS id,
                              f.nome_fantasia AS fornecedor,
                              c.data_envio AS data_envio,
                              c.data_retorno AS data_retorno,
                              c.status AS status,
                              COALESCE(SUM(ci.quantidade * ci.preco_unitario), 0) AS valor_cotado,
                              c.observacoes AS observacoes`
    const baseSql = `FROM compras.cotacoes_compra c
                     LEFT JOIN compras.cotacoes_itens ci ON ci.cotacao_id = c.id
                     LEFT JOIN compras.fornecedores f ON c.fornecedor_id = f.id`

    if (status) push('LOWER(c.status) =', status.toLowerCase())
    if (fornecedor_id) push('c.fornecedor_id =', fornecedor_id)
    if (q) { conditions.push(`(f.nome_fantasia ILIKE '%' || $${i} || '%' OR COALESCE(c.observacoes,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'c.data_envio', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const groupBy = 'GROUP BY c.id, f.nome_fantasia, c.data_envio, c.data_retorno, c.status, c.observacoes'
    const orderClause = 'ORDER BY c.data_envio DESC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${groupBy}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} cotação(ões)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar cotações', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const kpisCompras = tool({
  description: 'KPIs de compras (schema compras)',
  inputSchema: z.object({ de: z.string().optional(), ate: z.string().optional() }),
  execute: async ({ de, ate }) => {
    const params: unknown[] = []
    let i = 1
    const push = (val: unknown) => { params.push(val); i += 1 }

    // Pedidos
    let wherePedidos = ''
    if (de) { wherePedidos += `${wherePedidos ? ' AND' : 'WHERE'} p.data_pedido >= $${i}`; push(de) }
    if (ate) { wherePedidos += `${wherePedidos ? ' AND' : 'WHERE'} p.data_pedido <= $${i}`; push(ate) }
    const pedidosSql = `SELECT COUNT(*)::int AS total_pedidos, COALESCE(SUM(p.valor_total),0) AS valor_total FROM compras.pedidos_compra p ${wherePedidos}`

    // Recebimentos
    let whereRec = ''
    if (de) { whereRec += `${whereRec ? ' AND' : 'WHERE'} r.data_recebimento >= $${i}`; push(de) }
    if (ate) { whereRec += `${whereRec ? ' AND' : 'WHERE'} r.data_recebimento <= $${i}`; push(ate) }
    const recebSql = `SELECT COUNT(*)::int AS total_recebimentos FROM compras.recebimentos_compra r ${whereRec}`

    // Cotações
    let whereCot = ''
    if (de) { whereCot += `${whereCot ? ' AND' : 'WHERE'} c.data_envio >= $${i}`; push(de) }
    if (ate) { whereCot += `${whereCot ? ' AND' : 'WHERE'} c.data_envio <= $${i}`; push(ate) }
    const cotSql = `SELECT COUNT(*)::int AS total_cotacoes, COALESCE(SUM(ci.quantidade * ci.preco_unitario),0) AS valor_cotacoes
                    FROM compras.cotacoes_compra c LEFT JOIN compras.cotacoes_itens ci ON ci.cotacao_id = c.id ${whereCot}`

    // Solicitações
    let whereSol = ''
    if (de) { whereSol += `${whereSol ? ' AND' : 'WHERE'} s.data_solicitacao >= $${i}`; push(de) }
    if (ate) { whereSol += `${whereSol ? ' AND' : 'WHERE'} s.data_solicitacao <= $${i}`; push(ate) }
    const solSql = `SELECT COUNT(*)::int AS total_solicitacoes FROM compras.solicitacoes_compra s ${whereSol}`

    try {
      const [ped] = await runQuery<{ total_pedidos: number; valor_total: number }>(pedidosSql, params.slice(0, (wherePedidos.match(/\$/g)?.length || 0)))
      const pedParamsCount = (wherePedidos.match(/\$/g)?.length || 0)
      const recParamsCount = (whereRec.match(/\$/g)?.length || 0)
      const cotParamsCount = (whereCot.match(/\$/g)?.length || 0)
      const solParamsCount = (whereSol.match(/\$/g)?.length || 0)

      const recParams = params.slice(pedParamsCount, pedParamsCount + recParamsCount)
      const cotParams = params.slice(pedParamsCount + recParamsCount, pedParamsCount + recParamsCount + cotParamsCount)
      const solParams = params.slice(pedParamsCount + recParamsCount + cotParamsCount)

      const [rec] = await runQuery<{ total_recebimentos: number }>(recebSql, recParams)
      const [cot] = await runQuery<{ total_cotacoes: number; valor_cotacoes: number }>(cotSql, cotParams)
      const [sol] = await runQuery<{ total_solicitacoes: number }>(solSql, solParams)

      const kpis = {
        total_pedidos: ped?.total_pedidos ?? 0,
        valor_total_pedidos: Number(ped?.valor_total ?? 0),
        total_recebimentos: rec?.total_recebimentos ?? 0,
        total_cotacoes: cot?.total_cotacoes ?? 0,
        valor_cotacoes: Number(cot?.valor_cotacoes ?? 0),
        total_solicitacoes: sol?.total_solicitacoes ?? 0,
      }

      const combinedSql = [
        { name: 'pedidos', sql: pedidosSql, params: params.slice(0, pedParamsCount) },
        { name: 'recebimentos', sql: recebSql, params: recParams },
        { name: 'cotacoes', sql: cotSql, params: cotParams },
        { name: 'solicitacoes', sql: solSql, params: solParams },
      ]

      return { success: true, message: '✅ KPIs de compras', kpis, sql_query: JSON.stringify(combinedSql, null, 2) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao calcular KPIs', kpis: {}, error: error instanceof Error ? error.message : String(error) }
    }
  }
})

