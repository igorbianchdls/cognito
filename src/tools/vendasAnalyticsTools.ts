import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

export const analiseTerritorio = tool({
  description: 'Analisa território com drill-down flexível (dimensão nível 2 e medida) e filtros de período/território',
  inputSchema: z.object({
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
    territorio_nome: z.string().optional(),
    nivel1_dim: z.enum([
      'territorio_nome',
      'vendedor_nome',
      'canal_venda_nome',
      'produto_nome',
      'cliente_nome',
      'campanha_venda_nome',
      'cupom_codigo',
      'centro_lucro_nome',
      'filial_nome',
      'unidade_negocio_nome',
      'sales_office_nome',
      'data_pedido',
    ] as const).default('territorio_nome').optional(),
    nivel1_time_grain: z.enum(['month', 'year']).optional(),
    nivel2_dim: z.enum([
      'vendedor_nome',
      'canal_venda_nome',
      'produto_nome',
      'cliente_nome',
      'campanha_venda_nome',
      'cupom_codigo',
      'centro_lucro_nome',
      'filial_nome',
      'unidade_negocio_nome',
      'sales_office_nome',
      'data_pedido',
    ] as const).default('vendedor_nome').optional(),
    nivel2_time_grain: z.enum(['month', 'year']).optional(),
    nivel3_dim: z.enum([
      'vendedor_nome',
      'canal_venda_nome',
      'produto_nome',
      'cliente_nome',
      'campanha_venda_nome',
      'cupom_codigo',
      'centro_lucro_nome',
      'filial_nome',
      'unidade_negocio_nome',
      'sales_office_nome',
      'data_pedido',
    ] as const).optional(),
    nivel3_time_grain: z.enum(['month', 'year']).optional(),
    nivel4_dim: z.enum([
      'vendedor_nome',
      'canal_venda_nome',
      'produto_nome',
      'cliente_nome',
      'campanha_venda_nome',
      'cupom_codigo',
      'centro_lucro_nome',
      'filial_nome',
      'unidade_negocio_nome',
      'sales_office_nome',
      'data_pedido',
    ] as const).optional(),
    nivel4_time_grain: z.enum(['month', 'year']).optional(),
    nivel5_dim: z.enum([
      'vendedor_nome',
      'canal_venda_nome',
      'produto_nome',
      'cliente_nome',
      'campanha_venda_nome',
      'cupom_codigo',
      'centro_lucro_nome',
      'filial_nome',
      'unidade_negocio_nome',
      'sales_office_nome',
      'data_pedido',
    ] as const).optional(),
    nivel5_time_grain: z.enum(['month', 'year']).optional(),
    measure: z.enum(['faturamento', 'quantidade', 'pedidos', 'itens']).default('faturamento').optional(),
  }),
  execute: async ({ data_de, data_ate, territorio_nome, nivel1_dim = 'territorio_nome', nivel1_time_grain, nivel2_dim = 'vendedor_nome', nivel2_time_grain, nivel3_dim, nivel3_time_grain, nivel4_dim, nivel4_time_grain, nivel5_dim, nivel5_time_grain, measure = 'faturamento' }) => {
    try {
      const params: string[] = []
      const whereParts: string[] = []

      if (data_de && data_ate) {
        whereParts.push(`data_pedido BETWEEN $${params.length + 1} AND $${params.length + 2}`)
        params.push(data_de, data_ate)
      }

      if (territorio_nome && territorio_nome.trim() !== '') {
        whereParts.push(`territorio_nome = $${params.length + 1}`)
        params.push(territorio_nome)
      }

      const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

      // Dimensões serão construídas via helper buildDimExpr abaixo

      // Helpers para montar expressões de dimensão
      const buildDimExpr = (dim?: string, grain?: 'month' | 'year') => {
        if (!dim) return ''
        if (dim === 'data_pedido') {
          const g = grain === 'year' ? 'year' : 'month'
          const trunc = `date_trunc('${g}', data_pedido)`
          return g === 'year' ? `to_char(${trunc}, 'YYYY')` : `to_char(${trunc}, 'YYYY-MM')`
        }
        return dim
      }

      const dim1Expr = buildDimExpr(nivel1_dim, nivel1_time_grain)
      const dim2Expr = buildDimExpr(nivel2_dim, nivel2_time_grain)
      const dim3Expr = buildDimExpr(nivel3_dim, nivel3_time_grain)
      const dim4Expr = buildDimExpr(nivel4_dim, nivel4_time_grain)
      const dim5Expr = buildDimExpr(nivel5_dim, nivel5_time_grain)

      const dimExprs = [dim1Expr, dim2Expr, dim3Expr, dim4Expr, dim5Expr].filter(Boolean)

      // Medida (expressão agregada), com cast para numeric para unificar tipo
      let measureExpr = ''
      switch (measure) {
        case 'quantidade':
          measureExpr = 'SUM(quantidade)::numeric'
          break
        case 'pedidos':
          measureExpr = 'COUNT(DISTINCT pedido_id)::numeric'
          break
        case 'itens':
          measureExpr = 'COUNT(item_id)::numeric'
          break
        case 'faturamento':
        default:
          measureExpr = 'SUM(item_subtotal)::numeric'
      }

      // Montar GROUPING SETS até o número de dimensões fornecidas
      const groupingSets = dimExprs.map((_, idx) => `(${dimExprs.slice(0, idx + 1).join(', ')})`).join(', ')

      // Cálculo de nível com GROUPING()
      const nivelSQL = dimExprs
        .map(expr => `(1 - GROUPING(${expr}))`)
        .join(' + ')

      const selectDims = [
        `${dim1Expr} AS nome`,
        dim2Expr ? `${dim2Expr} AS detalhe1_nome` : `NULL::text AS detalhe1_nome`,
        dim3Expr ? `${dim3Expr} AS detalhe2_nome` : `NULL::text AS detalhe2_nome`,
        dim4Expr ? `${dim4Expr} AS detalhe3_nome` : `NULL::text AS detalhe3_nome`,
        dim5Expr ? `${dim5Expr} AS detalhe4_nome` : `NULL::text AS detalhe4_nome`,
      ].join(', ')

      const sql = `
        SELECT
          ${nivelSQL} AS nivel,
          ${selectDims},
          ${measureExpr} AS valor
        FROM vendas.vw_pedidos_completo
        ${whereClause}
        GROUP BY GROUPING SETS (${groupingSets})
        ORDER BY nome, detalhe1_nome, detalhe2_nome, detalhe3_nome, detalhe4_nome, nivel, valor DESC
      `

      const rows = await runQuery(sql, params)

      return {
        success: true,
        message: 'OK',
        data: {
          summary: rows,
          topVendedores: [],
          topProdutos: [],
          meta: { nivel1_dim, nivel1_time_grain, nivel2_dim, nivel2_time_grain, nivel3_dim, nivel3_time_grain, nivel4_dim, nivel4_time_grain, nivel5_dim, nivel5_time_grain, measure },
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro',
        data: {
          summary: [],
          topVendedores: [],
          topProdutos: [],
          meta: { nivel1_dim, nivel1_time_grain, nivel2_dim, nivel2_time_grain, nivel3_dim, nivel3_time_grain, nivel4_dim, nivel4_time_grain, nivel5_dim, nivel5_time_grain, measure },
        }
      }
    }
  },
})
