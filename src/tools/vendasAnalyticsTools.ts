import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

export const analiseTerritorio = tool({
  description: 'Analisa território com drill-down flexível (dimensão nível 2 e medida) e filtros de período/território',
  inputSchema: z.object({
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
    territorio_nome: z.string().optional(),
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
    measure: z.enum(['faturamento', 'quantidade', 'pedidos', 'itens']).default('faturamento').optional(),
  }),
  execute: async ({ data_de, data_ate, territorio_nome, nivel2_dim = 'vendedor_nome', nivel2_time_grain, nivel3_dim, nivel3_time_grain, measure = 'faturamento' }) => {
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

      // Dimensão de nível 2 (expressão e agrupamento), com whitelist
      let detail1Expr = ''
      let groupBy1Expr = ''
      if (nivel2_dim === 'data_pedido') {
        const grain = nivel2_time_grain === 'year' ? 'year' : 'month'
        const truncExpr = `date_trunc('${grain}', data_pedido)`
        detail1Expr = grain === 'year'
          ? `to_char(${truncExpr}, 'YYYY')`
          : `to_char(${truncExpr}, 'YYYY-MM')`
        groupBy1Expr = detail1Expr
      } else {
        detail1Expr = nivel2_dim
        groupBy1Expr = nivel2_dim
      }

      // Dimensão de nível 3 (opcional)
      let detail2Expr = ''
      let groupBy2Expr = ''
      const hasLevel3 = Boolean(nivel3_dim && nivel3_dim !== nivel2_dim && nivel3_dim !== 'territorio_nome')
      if (hasLevel3 && nivel3_dim) {
        if (nivel3_dim === 'data_pedido') {
          const grain3 = nivel3_time_grain === 'year' ? 'year' : 'month'
          const truncExpr3 = `date_trunc('${grain3}', data_pedido)`
          detail2Expr = grain3 === 'year'
            ? `to_char(${truncExpr3}, 'YYYY')`
            : `to_char(${truncExpr3}, 'YYYY-MM')`
          groupBy2Expr = detail2Expr
        } else {
          detail2Expr = nivel3_dim
          groupBy2Expr = nivel3_dim
        }
      }

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

      const sql = `
        (
          SELECT
            1 AS nivel,
            territorio_nome AS nome,
            NULL::text AS detalhe1_nome,
            NULL::text AS detalhe2_nome,
            ${measureExpr} AS valor
          FROM vendas.vw_pedidos_completo
          ${whereClause}
          GROUP BY territorio_nome
        )
        UNION ALL
        (
          SELECT
            2 AS nivel,
            territorio_nome AS nome,
            ${detail1Expr} AS detalhe1_nome,
            NULL::text AS detalhe2_nome,
            ${measureExpr} AS valor
          FROM vendas.vw_pedidos_completo
          ${whereClause}
          GROUP BY territorio_nome, ${groupBy1Expr}
        )
        ${hasLevel3 ? `UNION ALL
        (
          SELECT
            3 AS nivel,
            territorio_nome AS nome,
            ${detail1Expr} AS detalhe1_nome,
            ${detail2Expr} AS detalhe2_nome,
            ${measureExpr} AS valor
          FROM vendas.vw_pedidos_completo
          ${whereClause}
          GROUP BY territorio_nome, ${groupBy1Expr}, ${groupBy2Expr}
        )` : ''}
        ORDER BY nome, nivel, detalhe1_nome NULLS FIRST, valor DESC
      `

      const rows = await runQuery(sql, params)

      return {
        success: true,
        message: 'OK',
        data: {
          summary: rows,
          topVendedores: [],
          topProdutos: [],
          meta: { nivel2_dim, nivel2_time_grain, nivel3_dim: hasLevel3 ? nivel3_dim : undefined, nivel3_time_grain: hasLevel3 ? nivel3_time_grain : undefined, measure },
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
          meta: { nivel2_dim, nivel2_time_grain, nivel3_dim: nivel3_dim, nivel3_time_grain, measure },
        }
      }
    }
  },
})
