import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

const fmt = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]')

// ==========================
// METAS (leitura)
// ==========================
export type MetaRow = {
  meta_id: number
  mes: number
  ano: number
  vendedor_id: number
  vendedor: string
  meta_item_id: number | null
  tipo_meta: string | null
  tipo_valor: string | null
  valor_meta: number | null
  meta_percentual: number | null
  criado_em: string | null
  atualizado_em: string | null
}

export type GetMetasOutput = {
  success: boolean
  rows: MetaRow[]
  count: number
  page: number
  pageSize: number
  message: string
  sql_query?: string
  sql_params?: string
}

export const getMetas = tool({
  description: 'Lista metas comerciais (vendedores) com filtros de período (ano/mes) e por vendedor',
  inputSchema: z.object({
    ano: z.number().optional(),
    mes: z.number().optional(),
    vendedor_id: z.number().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(20),
    order_by: z.enum(['vendedor', 'ano', 'mes', 'tipo_meta', 'valor_meta', 'meta_percentual']).optional(),
    order_dir: z.enum(['asc', 'desc']).optional(),
  }),
  execute: async ({ ano, mes, vendedor_id, page = 1, pageSize = 20, order_by, order_dir }) => {
    try {
      const params: unknown[] = []
      const conditions: string[] = [ 'vendedor_id IS NOT NULL' ]
      let i = 1
      if (ano && String(ano).length === 4) { conditions.push(`ano = $${i++}`); params.push(ano) }
      if (mes && mes >= 1 && mes <= 12) { conditions.push(`mes = $${i++}`); params.push(mes) }
      if (vendedor_id) { conditions.push(`vendedor_id = $${i++}`); params.push(vendedor_id) }
      const where = `WHERE ${conditions.join(' AND ')}`

      const selectSql = `SELECT DISTINCT
        meta_id,
        mes,
        ano,
        vendedor_id,
        vendedor,
        meta_item_id,
        tipo_meta,
        tipo_valor,
        valor_meta,
        meta_percentual,
        criado_em,
        atualizado_em
      FROM comercial.vw_metas_detalhe`

      const whitelist: Record<string, string> = {
        vendedor: 'vendedor',
        ano: 'ano',
        mes: 'mes',
        tipo_meta: 'tipo_meta',
        valor_meta: 'valor_meta',
        meta_percentual: 'meta_percentual',
      }
      const ob = order_by ? whitelist[order_by] : undefined
      const od = order_dir === 'desc' ? 'DESC' : 'ASC'
      const orderClause = ob ? `ORDER BY ${ob} ${od}` : 'ORDER BY vendedor, meta_id, meta_item_id'

      const offset = (page - 1) * pageSize
      const listSql = `${selectSql} ${where} ${orderClause} LIMIT $${i}::int OFFSET $${i + 1}::int`.trim()
      const rows = await runQuery<MetaRow>(listSql, [...params, pageSize, offset])

      // Total (conta metas únicas)
      const totalSql = `SELECT COUNT(DISTINCT meta_id)::int AS total FROM (${selectSql} ${where}) t`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      const count = totalRows[0]?.total ?? rows.length

      return {
        success: true,
        rows,
        count,
        page,
        pageSize,
        message: `Metas: ${rows.length} (total ${count})`,
        sql_query: listSql,
        sql_params: fmt([...params, pageSize, offset]),
      }
    } catch (error) {
      return { success: false, rows: [], count: 0, page, pageSize, message: `Erro ao listar metas: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})

// ==========================
// DESEMPENHO (leitura)
// ==========================
export type DesempenhoRow = {
  meta_id: number
  vendedor_id: number
  vendedor: string
  mes: number
  ano: number
  tipo_meta: string
  valor_meta: number
  realizado: string | number // NUMERIC vindo do driver pode ser string
  diferenca: string | number
  atingimento_percentual: string | number
}

export type GetDesempenhoOutput = {
  success: boolean
  rows: DesempenhoRow[]
  count: number
  page: number
  pageSize: number
  message: string
  sql_query?: string
  sql_params?: string
}

// ==========================
// VISÃO GERAL (KPIs agregados)
// ==========================
export type VisaoGeralRow = Record<string, unknown>
export type GetVisaoGeralOutput = {
  success: boolean
  rows: VisaoGeralRow[]
  message: string
  sql_query?: string
  sql_params?: string
}

export const getVisaoGeral = tool({
  description: 'KPIs de Visão Geral (faturamento, pedidos, ticket, etc) por vendedores ou territórios, com filtros opcionais de período (ano/mes) e ordenação',
  inputSchema: z.object({
    scope: z.enum(['vendedores', 'territorios']).default('vendedores').optional(),
    ano: z.number().optional(),
    mes: z.number().optional(),
    order_by: z.string().optional(),
    order_dir: z.enum(['asc', 'desc']).optional(),
  }),
  execute: async ({ scope = 'vendedores', ano, mes, order_by, order_dir }) => {
    try {
      const params: unknown[] = []
      const whereParts: string[] = ["p.status = 'concluido'"]
      if (ano && String(ano).length === 4) {
        whereParts.push(`EXTRACT(YEAR FROM p.data_pedido) = $${params.length + 1}`)
        params.push(ano)
      }
      if (mes && mes >= 1 && mes <= 12) {
        whereParts.push(`EXTRACT(MONTH FROM p.data_pedido) = $${params.length + 1}`)
        params.push(mes)
      }
      const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

      let sql = ''
      let defaultOrder = ''
      if (scope === 'territorios') {
        sql = `SELECT
  t.id AS territorio_id,
  t.nome AS territorio_nome,
  COALESCE(SUM(i.subtotal), 0) AS faturamento_total,
  COUNT(DISTINCT p.id) AS total_pedidos,
  COALESCE(SUM(i.quantidade), 0) AS quantidade_servicos,
  CASE WHEN COUNT(DISTINCT p.id) > 0
       THEN COALESCE(SUM(i.subtotal),0) / COUNT(DISTINCT p.id)
       ELSE 0 END AS ticket_medio
FROM comercial.territorios t
LEFT JOIN vendas.pedidos p ON p.territorio_id = t.id
LEFT JOIN vendas.pedidos_itens i ON i.pedido_id = p.id
${whereClause}
GROUP BY t.id, t.nome`
        defaultOrder = 'ORDER BY faturamento_total DESC'
      } else {
        sql = `SELECT
  v.id AS vendedor_id,
  f.nome AS vendedor_nome,
  t.nome AS territorio_nome,
  COALESCE(SUM(i.subtotal), 0) AS faturamento_total,
  COUNT(DISTINCT p.id) AS total_pedidos,
  COALESCE(SUM(i.quantidade), 0) AS quantidade_servicos,
  CASE WHEN COUNT(DISTINCT p.id) > 0
       THEN COALESCE(SUM(i.subtotal),0) / COUNT(DISTINCT p.id)
       ELSE 0 END AS ticket_medio
FROM comercial.vendedores v
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
LEFT JOIN comercial.territorios t ON t.id = v.territorio_id
LEFT JOIN vendas.pedidos p ON p.vendedor_id = v.id
LEFT JOIN vendas.pedidos_itens i ON i.pedido_id = p.id
${whereClause}
GROUP BY v.id, f.nome, t.nome`
        defaultOrder = 'ORDER BY faturamento_total DESC'
      }

      const whitelist: Record<string, string> = {
        vendedor_nome: 'vendedor_nome',
        territorio_nome: 'territorio_nome',
        faturamento_total: 'faturamento_total',
        total_pedidos: 'total_pedidos',
        quantidade_servicos: 'quantidade_servicos',
        ticket_medio: 'ticket_medio',
      }
      const ob = order_by ? whitelist[order_by] : undefined
      const od = order_dir === 'desc' ? 'DESC' : 'ASC'
      const orderClause = ob ? `ORDER BY ${ob} ${od}` : defaultOrder

      const listSql = `${sql} ${orderClause}`.trim()
      const rows = await runQuery<VisaoGeralRow>(listSql, params)
      return { success: true, rows, message: 'OK', sql_query: listSql, sql_params: fmt(params) }
    } catch (error) {
      return { success: false, rows: [], message: `Erro ao obter visão geral: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})

// ==========================
// METAS x REALIZADO (agregado por vendedor/território)
// ==========================
export type MetasXRealizadoRow = Record<string, unknown>
export type GetMetasXRealizadoOutput = {
  success: boolean
  rows: MetasXRealizadoRow[]
  count: number
  message: string
  sql_query?: string
  sql_params?: string
}

export const getMetasXRealizado = tool({
  description: 'Compara Metas x Realizado por vendedor ou território no mês/ano informados (mesma lógica da aba Metas x Realizado)'.trim(),
  inputSchema: z.object({
    scope: z.enum(['vendedores', 'territorios']).default('vendedores').optional(),
    ano: z.number(),
    mes: z.number().min(1).max(12),
    metric: z.enum(['faturamento', 'novos_clientes', 'ticket_medio']).default('faturamento').optional(),
    order_by: z.string().optional(),
    order_dir: z.enum(['asc', 'desc']).optional(),
  }),
  execute: async ({ scope = 'vendedores', ano, mes, metric = 'faturamento', order_by, order_dir }) => {
    try {
      const params: unknown[] = []
      const anoVal = Number(ano)
      const mesVal = Number(mes)
      if (!Number.isFinite(anoVal) || String(anoVal).length !== 4 || !Number.isFinite(mesVal) || mesVal < 1 || mesVal > 12) {
        return { success: false, rows: [], count: 0, message: 'Informe ano (AAAA) e mes (1..12) válidos' }
      }

      const de = `${String(anoVal).padStart(4,'0')}-${String(mesVal).padStart(2,'0')}-01`
      const ate = mesVal === 12 ? `${String(anoVal + 1)}-01-01` : `${String(anoVal)}-${String(mesVal + 1).padStart(2,'0')}-01`

      let selectSql = ''
      if (scope === 'territorios') {
        selectSql = `WITH metas_por_territorio AS (
  SELECT
      m.id AS meta_id,
      m.territorio_id,
      t.nome AS territorio_nome,
      MAX(CASE WHEN mi.tipo_meta_id = 1 THEN mi.valor_meta END) AS meta_faturamento,
      MAX(CASE WHEN mi.tipo_meta_id = 5 THEN mi.valor_meta END) AS meta_ticket_medio,
      MAX(CASE WHEN mi.tipo_meta_id = 4 THEN mi.valor_meta END) AS meta_novos_clientes
  FROM comercial.metas m
  LEFT JOIN comercial.metas_itens mi ON mi.meta_id = m.id
  LEFT JOIN comercial.territorios t ON t.id = m.territorio_id
  WHERE m.ano = ${anoVal}
    AND m.mes = ${mesVal}
    AND m.territorio_id IS NOT NULL
  GROUP BY m.id, m.territorio_id, t.nome
),
realizado AS (
  SELECT
      p.territorio_id,
      SUM(i.subtotal) AS realizado_faturamento,
      CASE WHEN COUNT(DISTINCT p.id) > 0 THEN SUM(i.subtotal) / COUNT(DISTINCT p.id) ELSE 0 END AS realizado_ticket_medio,
      COUNT(DISTINCT p.cliente_id) FILTER (
          WHERE p.data_pedido >= '${de}' AND p.data_pedido < '${ate}'
            AND p.cliente_id IN (
                SELECT cliente_id FROM vendas.pedidos GROUP BY cliente_id HAVING MIN(data_pedido) >= '${de}' AND MIN(data_pedido) < '${ate}'
            )
      ) AS realizado_novos_clientes
  FROM vendas.pedidos p
  LEFT JOIN vendas.pedidos_itens i ON i.pedido_id = p.id
  WHERE p.status = 'concluido'
    AND p.data_pedido >= '${de}' AND p.data_pedido < '${ate}'
  GROUP BY p.territorio_id
)
SELECT
  mt.territorio_id,
  mt.territorio_nome,
  mt.meta_faturamento,
  mt.meta_ticket_medio,
  mt.meta_novos_clientes,
  COALESCE(r.realizado_faturamento, 0) AS realizado_faturamento,
  COALESCE(r.realizado_ticket_medio, 0) AS realizado_ticket_medio,
  COALESCE(r.realizado_novos_clientes, 0) AS realizado_novos_clientes
FROM metas_por_territorio mt
LEFT JOIN realizado r ON r.territorio_id = mt.territorio_id`
      } else {
        selectSql = `WITH metas_por_vendedor AS (
  SELECT
      m.id AS meta_id,
      m.vendedor_id,
      f.nome AS vendedor_nome,
      MAX(CASE WHEN mi.tipo_meta_id = 1 THEN mi.valor_meta END) AS meta_faturamento,
      MAX(CASE WHEN mi.tipo_meta_id = 5 THEN mi.valor_meta END) AS meta_ticket_medio,
      MAX(CASE WHEN mi.tipo_meta_id = 4 THEN mi.valor_meta END) AS meta_novos_clientes
  FROM comercial.metas m
  LEFT JOIN comercial.metas_itens mi ON mi.meta_id = m.id
  LEFT JOIN comercial.vendedores v ON v.id = m.vendedor_id
  LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
  WHERE m.ano = ${anoVal}
    AND m.mes = ${mesVal}
    AND m.vendedor_id IS NOT NULL
  GROUP BY m.id, m.vendedor_id, f.nome
),
realizado AS (
  SELECT
      p.vendedor_id,
      SUM(i.subtotal) AS realizado_faturamento,
      CASE WHEN COUNT(DISTINCT p.id) > 0 THEN SUM(i.subtotal) / COUNT(DISTINCT p.id) ELSE 0 END AS realizado_ticket_medio,
      COUNT(DISTINCT p.cliente_id) FILTER (
          WHERE p.data_pedido >= '${de}' AND p.data_pedido < '${ate}'
            AND p.cliente_id IN (
                SELECT cliente_id FROM vendas.pedidos GROUP BY cliente_id HAVING MIN(data_pedido) >= '${de}' AND MIN(data_pedido) < '${ate}'
            )
      ) AS realizado_novos_clientes
  FROM vendas.pedidos p
  LEFT JOIN vendas.pedidos_itens i ON i.pedido_id = p.id
  WHERE p.status = 'concluido'
    AND p.data_pedido >= '${de}' AND p.data_pedido < '${ate}'
  GROUP BY p.vendedor_id
)
SELECT
  mv.vendedor_id,
  mv.vendedor_nome,
  mv.meta_faturamento,
  mv.meta_ticket_medio,
  mv.meta_novos_clientes,
  COALESCE(r.realizado_faturamento, 0) AS realizado_faturamento,
  COALESCE(r.realizado_ticket_medio, 0) AS realizado_ticket_medio,
  COALESCE(r.realizado_novos_clientes, 0) AS realizado_novos_clientes
FROM metas_por_vendedor mv
LEFT JOIN realizado r ON r.vendedor_id = mv.vendedor_id`
      }

      // Projeção final apenas das colunas para a métrica pedida
      const labelCol = scope === 'territorios' ? 'territorio_nome' : 'vendedor_nome'
      const idCol = scope === 'territorios' ? 'territorio_id' : 'vendedor_id'
      const metaCol = metric === 'faturamento'
        ? 'meta_faturamento'
        : metric === 'ticket_medio'
          ? 'meta_ticket_medio'
          : 'meta_novos_clientes'
      const realCol = metric === 'faturamento'
        ? 'realizado_faturamento'
        : metric === 'ticket_medio'
          ? 'realizado_ticket_medio'
          : 'realizado_novos_clientes'

      const projectionSql = `
        SELECT
          ${idCol} AS id,
          ${labelCol} AS label,
          ${metaCol} AS ${metaCol},
          ${realCol} AS ${realCol}
        FROM (
          ${selectSql}
        ) base
      `

      // Ordenação: permitir 'label' | 'meta' | 'realizado' (genéricos) e também os nomes exatos das colunas
      const whitelist: Record<string, string> = {
        label: 'label',
        meta: metaCol,
        realizado: realCol,
        [metaCol]: metaCol,
        [realCol]: realCol,
        [labelCol]: 'label',
      }
      const ob = order_by ? whitelist[order_by] : undefined
      const od = order_dir === 'desc' ? 'DESC' : 'ASC'
      const defaultOrder = ` ORDER BY ${realCol} DESC`
      const orderClause = ob ? ` ORDER BY ${ob} ${od}` : defaultOrder

      const listSql = `${projectionSql}${orderClause}`
      const rows = await runQuery<MetasXRealizadoRow>(listSql, params)
      return { success: true, rows, count: rows.length, message: `OK — métrica: ${metric}`, sql_query: listSql, sql_params: fmt(params) }
    } catch (error) {
      return { success: false, rows: [], count: 0, message: `Erro: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})

export const getDesempenho = tool({
  description: 'Desempenho por meta e tipo de meta, usando comercial.fn_calcular_realizado_meta e filtros de período/vendedor',
  inputSchema: z.object({
    ano: z.number().optional(),
    mes: z.number().optional(),
    vendedor_id: z.number().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(20),
    order_by: z.enum(['vendedor', 'ano', 'mes', 'tipo_meta', 'valor_meta', 'realizado', 'atingimento_percentual']).optional(),
    order_dir: z.enum(['asc', 'desc']).optional(),
  }),
  execute: async ({ ano, mes, vendedor_id, page = 1, pageSize = 20, order_by, order_dir }) => {
    try {
      const params: unknown[] = []
      let i = 1
      // Datas do período
      const anoVal = (ano && String(ano).length === 4) ? ano : undefined
      const mesVal = (mes && mes >= 1 && mes <= 12) ? mes : undefined
      const de = (anoVal && mesVal) ? `${String(anoVal).padStart(4, '0')}-${String(mesVal).padStart(2, '0')}-01` : null
      const ate = (anoVal && mesVal) ? (mesVal === 12 ? `${String(anoVal + 1)}-01-01` : `${String(anoVal)}-${String(mesVal + 1).padStart(2, '0')}-01`) : null

      const whereMetas: string[] = ["m.vendedor_id IS NOT NULL"]
      if (anoVal) whereMetas.push(`m.ano = $${i++}`), params.push(anoVal)
      if (mesVal) whereMetas.push(`m.mes = $${i++}`), params.push(mesVal)
      if (vendedor_id) whereMetas.push(`m.vendedor_id = $${i++}`), params.push(vendedor_id)
      const whereMetasSql = whereMetas.length ? `WHERE ${whereMetas.join(' AND ')}` : ''

      const metasSql = `
        WITH metas_por_vendedor AS (
          SELECT
            m.id AS meta_id,
            m.mes,
            m.ano,
            m.vendedor_id,
            f.nome AS vendedor_nome,
            MAX(CASE WHEN mi.tipo_meta_id = 1 THEN mi.valor_meta END) AS meta_faturamento,
            MAX(CASE WHEN mi.tipo_meta_id = 5 THEN mi.valor_meta END) AS meta_ticket_medio,
            MAX(CASE WHEN mi.tipo_meta_id = 4 THEN mi.valor_meta END) AS meta_novos_clientes
          FROM comercial.metas m
          LEFT JOIN comercial.metas_itens mi ON mi.meta_id = m.id
          LEFT JOIN comercial.vendedores v ON v.id = m.vendedor_id
          LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
          ${whereMetasSql}
          GROUP BY m.id, m.mes, m.ano, m.vendedor_id, f.nome
        ),
        realizado AS (
          SELECT
            p.vendedor_id,
            SUM(i.subtotal) AS realizado_faturamento,
            CASE WHEN COUNT(DISTINCT p.id) > 0 THEN SUM(i.subtotal) / COUNT(DISTINCT p.id) ELSE 0 END AS realizado_ticket_medio,
            ${de && ate ? `
            COUNT(DISTINCT p.cliente_id) FILTER (
              WHERE p.data_pedido >= '${de}' AND p.data_pedido < '${ate}'
                AND p.cliente_id IN (
                  SELECT cliente_id FROM vendas.pedidos GROUP BY cliente_id HAVING MIN(data_pedido) >= '${de}' AND MIN(data_pedido) < '${ate}'
                )
            )
            ` : `0` } AS realizado_novos_clientes
          FROM vendas.pedidos p
          LEFT JOIN vendas.pedidos_itens i ON i.pedido_id = p.id
          WHERE p.status = 'concluido'
          ${de && ate ? `AND p.data_pedido >= '${de}' AND p.data_pedido < '${ate}'` : ''}
          GROUP BY p.vendedor_id
        ),
        linhas AS (
          SELECT
            mv.meta_id,
            mv.vendedor_id,
            mv.vendedor_nome AS vendedor,
            mv.mes,
            mv.ano,
            'faturamento'::text AS tipo_meta,
            COALESCE(mv.meta_faturamento, 0) AS valor_meta,
            COALESCE(r.realizado_faturamento, 0) AS realizado
          FROM metas_por_vendedor mv
          LEFT JOIN realizado r ON r.vendedor_id = mv.vendedor_id
          UNION ALL
          SELECT
            mv.meta_id,
            mv.vendedor_id,
            mv.vendedor_nome AS vendedor,
            mv.mes,
            mv.ano,
            'ticket_medio'::text AS tipo_meta,
            COALESCE(mv.meta_ticket_medio, 0) AS valor_meta,
            COALESCE(r.realizado_ticket_medio, 0) AS realizado
          FROM metas_por_vendedor mv
          LEFT JOIN realizado r ON r.vendedor_id = mv.vendedor_id
          UNION ALL
          SELECT
            mv.meta_id,
            mv.vendedor_id,
            mv.vendedor_nome AS vendedor,
            mv.mes,
            mv.ano,
            'novos_clientes'::text AS tipo_meta,
            COALESCE(mv.meta_novos_clientes, 0) AS valor_meta,
            COALESCE(r.realizado_novos_clientes, 0) AS realizado
          FROM metas_por_vendedor mv
          LEFT JOIN realizado r ON r.vendedor_id = mv.vendedor_id
        )
        SELECT * FROM linhas
      `

      const whitelist: Record<string, string> = {
        vendedor: 'vendedor',
        ano: 'ano',
        mes: 'mes',
        tipo_meta: 'tipo_meta',
        valor_meta: 'valor_meta',
        realizado: 'realizado'
      }
      const ob = order_by ? whitelist[order_by] : undefined
      const od = order_dir === 'desc' ? 'DESC' : 'ASC'
      const orderClause = ob ? `ORDER BY ${ob} ${od}` : 'ORDER BY vendedor, tipo_meta'

      const offset = (page - 1) * pageSize
      // Calcula diferenca e atingimento no SELECT externo para manter compatibilidade
      const listSql = `
        SELECT
          x.meta_id,
          x.vendedor_id,
          x.vendedor,
          x.mes,
          x.ano,
          x.tipo_meta,
          x.valor_meta,
          x.realizado,
          (COALESCE(x.realizado, 0) - COALESCE(x.valor_meta, 0)) AS diferenca,
          CASE WHEN COALESCE(x.valor_meta, 0) > 0
            THEN ROUND(COALESCE(x.realizado, 0) / x.valor_meta * 100, 2)
            ELSE 0 END AS atingimento_percentual
        FROM (
          ${metasSql}
        ) x
        ${orderClause}
        LIMIT $${i}::int OFFSET $${i + 1}::int
      `.trim()
      const rows = await runQuery<DesempenhoRow>(listSql, [...params, pageSize, offset])

      // Total (por meta_id para colapsar por meta)
      const totalSql = `SELECT COUNT(DISTINCT meta_id)::int AS total FROM (${metasSql}) t`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      const count = totalRows[0]?.total ?? rows.length

      return {
        success: true,
        rows,
        count,
        page,
        pageSize,
        message: `Desempenho: ${rows.length} linhas (total ${count} metas)` + (anoVal && mesVal ? ` — ${String(mesVal).padStart(2,'0')}/${anoVal}` : ''),
        sql_query: listSql,
        sql_params: fmt([...params, pageSize, offset]),
      }
    } catch (error) {
      return { success: false, rows: [], count: 0, page, pageSize, message: `Erro ao obter desempenho: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})
