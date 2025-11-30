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
      const filters: string[] = []
      let i = 1
      // Filtros por período/vendedor (iguais aos usados nas abas)
      if (ano && String(ano).length === 4) { filters.push(`m.ano = $${i++}`); params.push(ano) }
      if (mes && mes >= 1 && mes <= 12) { filters.push(`m.mes = $${i++}`); params.push(mes) }
      if (vendedor_id) { filters.push(`m.vendedor_id = $${i++}`); params.push(vendedor_id) }
      const whereMetas = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

      // Datas (para cálculo de novos clientes e ticket médio por janela)
      // Quando ano/mes não informados, mantém nulos e calcula sem janela específica
      const de = (ano && mes) ? `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-01` : null
      // próxima virada do mês
      const ate = (ano && mes) ? (mes === 12 ? `${String(ano + 1)}-01-01` : `${String(ano)}-${String(mes + 1).padStart(2, '0')}-01`) : null

      // Base: metas únicas por meta_id/tipo_meta (vendedor/periodo)
      const metasSql = `
        WITH metas AS (
          SELECT DISTINCT
            m.meta_id,
            m.vendedor_id,
            m.vendedor,
            m.mes,
            m.ano,
            m.tipo_meta,
            m.valor_meta
          FROM comercial.vw_metas_detalhe m
          ${whereMetas}
        ),
        realizado_vendedor AS (
          SELECT
            v.id AS vendedor_id,
            SUM(i.subtotal) AS faturamento_total,
            COUNT(DISTINCT p.id) AS pedidos_total
          FROM comercial.vendedores v
          LEFT JOIN vendas.pedidos p
            ON p.vendedor_id = v.id
           AND p.status = 'concluido'
          ${de && ate ? `AND p.data_pedido >= '${de}' AND p.data_pedido < '${ate}'` : ''}
          LEFT JOIN vendas.pedidos_itens i
            ON i.pedido_id = p.id
          GROUP BY v.id
        ),
        novos_clientes AS (
          ${de && ate ? `
          SELECT
            p.vendedor_id,
            COUNT(DISTINCT p.cliente_id) AS novos
          FROM vendas.pedidos p
          WHERE p.status = 'concluido'
            AND p.data_pedido >= '${de}' AND p.data_pedido < '${ate}'
            AND p.cliente_id IN (
              SELECT cliente_id
              FROM vendas.pedidos
              GROUP BY cliente_id
              HAVING MIN(data_pedido) >= '${de}' AND MIN(data_pedido) < '${ate}'
            )
          GROUP BY p.vendedor_id
          ` : `
          SELECT 0::bigint AS vendedor_id, 0::int AS novos
          `}
        )
        SELECT
          m.meta_id,
          m.vendedor_id,
          m.vendedor,
          m.mes,
          m.ano,
          m.tipo_meta,
          m.valor_meta,
          CASE
            WHEN m.tipo_meta = 'faturamento' THEN COALESCE(rv.faturamento_total, 0)
            WHEN m.tipo_meta = 'ticket_medio' THEN CASE WHEN COALESCE(rv.pedidos_total, 0) > 0 THEN COALESCE(rv.faturamento_total, 0) / rv.pedidos_total ELSE 0 END
            WHEN m.tipo_meta = 'novos_clientes' THEN COALESCE(nc.novos, 0)
            ELSE 0
          END AS realizado
        FROM metas m
        LEFT JOIN realizado_vendedor rv ON rv.vendedor_id = m.vendedor_id
        LEFT JOIN novos_clientes nc ON nc.vendedor_id = m.vendedor_id
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
        message: `Desempenho: ${rows.length} linhas (total ${count} metas)` + (ano && mes ? ` — ${String(mes).padStart(2,'0')}/${ano}` : ''),
        sql_query: listSql,
        sql_params: fmt([...params, pageSize, offset]),
      }
    } catch (error) {
      return { success: false, rows: [], count: 0, page, pageSize, message: `Erro ao obter desempenho: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})
