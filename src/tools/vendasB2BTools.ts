import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

const fmtParams = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]')

export const listarPedidosVendas = tool({
  description: 'Lista pedidos de vendas (schema gestaovendas) com filtros e paginação',
  inputSchema: z.object({
    page: z.number().default(1),
    pageSize: z.number().default(20),
    de: z.string().optional(),
    ate: z.string().optional(),
    status: z.string().optional(),
    cliente_id: z.string().optional(),
    vendedor_id: z.string().optional(),
    canal_venda_id: z.string().optional(),
    valor_min: z.number().optional(),
    valor_max: z.number().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ page = 1, pageSize = 20, de, ate, status, cliente_id, vendedor_id, canal_venda_id, valor_min, valor_max, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT p.id,
                              p.numero_pedido,
                              c.nome AS cliente,
                              cv.nome AS canal_venda,
                              v.nome AS vendedor,
                              p.status,
                              p.data_pedido,
                              p.valor_produtos,
                              p.valor_frete,
                              p.valor_desconto,
                              p.valor_total AS valor_total_pedido,
                              (e.cidade || ' - ' || e.estado) AS cidade_uf,
                              p.created_at`
    const baseSql = `FROM gestaovendas.pedidos p
                     LEFT JOIN gestaovendas.clientes c ON p.cliente_id = c.id
                     LEFT JOIN gestaovendas.canais_venda cv ON p.canal_venda_id = cv.id
                     LEFT JOIN gestaovendas.vendedores v ON p.usuario_id = v.id
                     LEFT JOIN gestaovendas.enderecos_clientes e ON p.endereco_entrega_id = e.id`

    if (status) push('LOWER(p.status) =', status.toLowerCase())
    if (cliente_id) push('p.cliente_id =', cliente_id)
    if (vendedor_id) push('p.usuario_id =', vendedor_id)
    if (canal_venda_id) push('p.canal_venda_id =', canal_venda_id)
    if (valor_min !== undefined) push('p.valor_total >=', valor_min)
    if (valor_max !== undefined) push('p.valor_total <=', valor_max)
    if (q) { conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR p.numero_pedido ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    if (de) push('p.data_pedido >=', de)
    if (ate) push('p.data_pedido <=', ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY p.data_pedido DESC'
    const limitOffset = `LIMIT $${i}::int OFFSET $${i + 1}::int`
    const paramsWithPage = [...params, pageSize, (Math.max(1, page) - 1) * pageSize]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitOffset}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithPage)
      // total
      const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      const count = totalRows[0]?.total ?? rows.length
      return { success: true, message: `✅ ${rows.length} pedidos`, rows, count, sql_query: sql, sql_params: fmtParams(paramsWithPage) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar pedidos', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithPage) }
    }
  }
})

export const listarClientesVendas = tool({
  description: 'Lista clientes (schema gestaovendas) com filtros e paginação',
  inputSchema: z.object({
    page: z.number().default(1),
    pageSize: z.number().default(20),
    de: z.string().optional(),
    ate: z.string().optional(),
    ativo: z.enum(['true','false']).optional(),
    vendedor_id: z.string().optional(),
    territorio_id: z.string().optional(),
    status: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ page = 1, pageSize = 20, de, ate, ativo, vendedor_id, territorio_id, status, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT c.id,
                              c.nome AS cliente,
                              COALESCE(c.nome_fantasia, c.razao_social) AS nome_fantasia_ou_razao,
                              c.cpf_cnpj,
                              c.email,
                              c.telefone,
                              v.nome AS vendedor_responsavel,
                              t.nome AS territorio,
                              c.status_cliente,
                              c.cliente_desde,
                              c.data_ultima_compra,
                              c.faturamento_estimado_anual,
                              c.frequencia_pedidos_mensal,
                              c.ativo`
    const baseSql = `FROM gestaovendas.clientes c
                     LEFT JOIN gestaovendas.vendedores v ON c.vendedor_id = v.id
                     LEFT JOIN gestaovendas.territorios_venda t ON c.territorio_id = t.id`

    if (ativo) push('CAST(c.ativo AS TEXT) =', ativo)
    if (vendedor_id) push('c.vendedor_id =', vendedor_id)
    if (territorio_id) push('c.territorio_id =', territorio_id)
    if (status) push('LOWER(c.status_cliente) =', status.toLowerCase())
    if (q) { conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR c.cpf_cnpj ILIKE '%' || $${i} || '%' OR c.email ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    if (de) push('c.cliente_desde >=', de)
    if (ate) push('c.cliente_desde <=', ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY c.nome ASC'
    const limitOffset = `LIMIT $${i}::int OFFSET $${i + 1}::int`
    const paramsWithPage = [...params, pageSize, (Math.max(1, page) - 1) * pageSize]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitOffset}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithPage)
      const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      const count = totalRows[0]?.total ?? rows.length
      return { success: true, message: `✅ ${rows.length} clientes`, rows, count, sql_query: sql, sql_params: fmtParams(paramsWithPage) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar clientes', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithPage) }
    }
  }
})

export const listarTerritoriosVendas = tool({
  description: 'Lista territórios de vendas (schema gestaovendas) com agregados',
  inputSchema: z.object({ q: z.string().optional() }),
  execute: async ({ q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT t.id,
                              t.nome AS territorio,
                              COUNT(DISTINCT c.id) AS qtd_clientes,
                              COUNT(DISTINCT v.id) AS qtd_vendedores,
                              t.created_at`
    const baseSql = `FROM gestaovendas.territorios_venda t
                     LEFT JOIN gestaovendas.clientes c ON c.territorio_id = t.id
                     LEFT JOIN gestaovendas.vendedores v ON v.territorio_id = t.id`
    if (q) { conditions.push(`(t.nome ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const groupBy = 'GROUP BY t.id, t.nome, t.created_at'
    const orderClause = 'ORDER BY t.nome ASC'
    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${groupBy}\n${orderClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params)
      return { success: true, message: `✅ ${rows.length} territórios`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(params) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar territórios', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(params) }
    }
  }
})

export const listarEquipesVendas = tool({
  description: 'Lista equipes de vendas (schema gestaovendas) com agregados',
  inputSchema: z.object({ ativo: z.enum(['true','false']).optional(), q: z.string().optional() }),
  execute: async ({ ativo, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT eq.id,
                              eq.nome AS equipe,
                              eq.descricao,
                              COUNT(DISTINCT v.id) AS qtd_vendedores,
                              STRING_AGG(DISTINCT t.nome, ', ') AS territorios_atendidos,
                              eq.ativo,
                              eq.created_at`
    const baseSql = `FROM gestaovendas.equipes_venda eq
                     LEFT JOIN gestaovendas.vendedores v ON v.equipe_id = eq.id
                     LEFT JOIN gestaovendas.territorios_venda t ON v.territorio_id = t.id`
    if (ativo) push('CAST(eq.ativo AS TEXT) =', ativo)
    if (q) { conditions.push(`(eq.nome ILIKE '%' || $${i} || '%' OR eq.descricao ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const groupBy = 'GROUP BY eq.id, eq.nome, eq.descricao, eq.ativo, eq.created_at'
    const orderClause = 'ORDER BY eq.nome ASC'
    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${groupBy}\n${orderClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params)
      return { success: true, message: `✅ ${rows.length} equipe(s)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(params) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar equipes', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(params) }
    }
  }
})

export const listarCanaisVendas = tool({
  description: 'Lista canais de venda (schema gestaovendas) com agregados',
  inputSchema: z.object({ de: z.string().optional(), ate: z.string().optional(), q: z.string().optional() }),
  execute: async ({ de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT cv.id,
                              cv.nome AS canal_venda,
                              COUNT(p.id) AS qtd_pedidos,
                              COALESCE(SUM(p.valor_total), 0) AS total_vendido,
                              MIN(p.data_pedido) AS primeira_venda,
                              MAX(p.data_pedido) AS ultima_venda`
    const baseSql = `FROM gestaovendas.canais_venda cv
                     LEFT JOIN gestaovendas.pedidos p ON p.canal_venda_id = cv.id`
    if (q) { conditions.push(`(cv.nome ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    if (de) push('p.data_pedido >=', de)
    if (ate) push('p.data_pedido <=', ate)
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const groupBy = 'GROUP BY cv.id, cv.nome'
    const orderClause = 'ORDER BY cv.nome ASC'
    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${groupBy}\n${orderClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params)
      return { success: true, message: `✅ ${rows.length} canal(is)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(params) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar canais', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(params) }
    }
  }
})

export const kpisVendas = tool({
  description: 'KPIs de vendas no período (schema gestaovendas)',
  inputSchema: z.object({ de: z.string().optional(), ate: z.string().optional() }),
  execute: async ({ de, ate }) => {
    const params: unknown[] = []
    let i = 1
    const push = (val: unknown) => { params.push(val); i += 1 }

    // Pedidos
    let where = ''
    if (de) { where += `${where ? ' AND' : 'WHERE'} p.data_pedido >= $${i}`; push(de) }
    if (ate) { where += `${where ? ' AND' : 'WHERE'} p.data_pedido <= $${i}`; push(ate) }
    const sql = `SELECT COUNT(*)::int AS total_pedidos,
                        COALESCE(SUM(p.valor_total),0)::numeric AS receita_total,
                        AVG(p.valor_total)::numeric AS ticket_medio,
                        COUNT(DISTINCT p.cliente_id)::int AS clientes_unicos
                 FROM gestaovendas.pedidos p ${where}`
    try {
      const [row] = await runQuery<{ total_pedidos: number; receita_total: number; ticket_medio: number; clientes_unicos: number }>(sql, params)
      const kpis = {
        total_pedidos: row?.total_pedidos ?? 0,
        receita_total: Number(row?.receita_total ?? 0),
        ticket_medio: Number(row?.ticket_medio ?? 0),
        clientes_unicos: row?.clientes_unicos ?? 0,
      }
      return { success: true, message: '✅ KPIs de vendas', kpis, sql_query: sql }
    } catch (error) {
      return { success: false, message: '❌ Erro ao calcular KPIs de vendas', kpis: {}, error: error instanceof Error ? error.message : String(error) }
    }
  }
})

