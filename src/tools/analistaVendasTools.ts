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
      const conditions: string[] = []
      const params: unknown[] = []
      let i = 1
      if (ano && String(ano).length === 4) { conditions.push(`ano = $${i++}`); params.push(ano) }
      if (mes && mes >= 1 && mes <= 12) { conditions.push(`mes = $${i++}`); params.push(mes) }
      if (vendedor_id) { conditions.push(`vendedor_id = $${i++}`); params.push(vendedor_id) }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const baseSql = `SELECT
        m.meta_id,
        m.vendedor_id,
        m.vendedor,
        m.mes,
        m.ano,
        m.tipo_meta,
        m.valor_meta,
        comercial.fn_calcular_realizado_meta(m.meta_id, m.tipo_meta) AS realizado,
        comercial.fn_calcular_realizado_meta(m.meta_id, m.tipo_meta) - m.valor_meta AS diferenca,
        CASE 
            WHEN m.valor_meta > 0 THEN 
                ROUND(
                    comercial.fn_calcular_realizado_meta(m.meta_id, m.tipo_meta) 
                    / m.valor_meta * 100
                , 2)
            ELSE 0 
        END AS atingimento_percentual
      FROM (
          SELECT DISTINCT
              meta_id,
              vendedor_id,
              vendedor,
              mes,
              ano,
              tipo_meta,
              valor_meta
          FROM comercial.vw_metas_detalhe
          ${where}
      ) m`

      const whitelist: Record<string, string> = {
        vendedor: 'vendedor',
        ano: 'ano',
        mes: 'mes',
        tipo_meta: 'tipo_meta',
        valor_meta: 'valor_meta',
        realizado: 'realizado',
        atingimento_percentual: 'atingimento_percentual',
      }
      const ob = order_by ? whitelist[order_by] : undefined
      const od = order_dir === 'desc' ? 'DESC' : 'ASC'
      const orderClause = ob ? `ORDER BY ${ob} ${od}` : 'ORDER BY vendedor, tipo_meta'

      const offset = (page - 1) * pageSize
      const listSql = `${baseSql} ${orderClause} LIMIT $${i}::int OFFSET $${i + 1}::int`.trim()
      const rows = await runQuery<DesempenhoRow>(listSql, [...params, pageSize, offset])

      // Total (por meta_id para colapsar por meta)
      const totalSql = `SELECT COUNT(DISTINCT meta_id)::int AS total FROM (${baseSql}) t`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      const count = totalRows[0]?.total ?? rows.length

      return {
        success: true,
        rows,
        count,
        page,
        pageSize,
        message: `Desempenho: ${rows.length} linhas (total ${count} metas)`,
        sql_query: listSql,
        sql_params: fmt([...params, pageSize, offset]),
      }
    } catch (error) {
      return { success: false, rows: [], count: 0, page, pageSize, message: `Erro ao obter desempenho: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})

