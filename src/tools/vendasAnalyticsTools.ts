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
    measure: z.enum(['faturamento', 'quantidade', 'pedidos', 'itens']).default('faturamento').optional(),
  }),
  execute: async ({ data_de, data_ate, territorio_nome, nivel2_dim = 'vendedor_nome', nivel2_time_grain, measure = 'faturamento' }) => {
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
      let detailExpr = ''
      let groupByExpr = ''
      if (nivel2_dim === 'data_pedido') {
        const grain = nivel2_time_grain === 'year' ? 'year' : 'month'
        const truncExpr = `date_trunc('${grain}', data_pedido)`
        detailExpr = grain === 'year'
          ? `to_char(${truncExpr}, 'YYYY')`
          : `to_char(${truncExpr}, 'YYYY-MM')`
        groupByExpr = detailExpr
      } else {
        detailExpr = nivel2_dim
        groupByExpr = nivel2_dim
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
            NULL::text AS detalhe_nome,
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
            ${detailExpr} AS detalhe_nome,
            ${measureExpr} AS valor
          FROM vendas.vw_pedidos_completo
          ${whereClause}
          GROUP BY territorio_nome, ${groupByExpr}
        )
        ORDER BY nome, nivel, valor DESC
      `

      const rows = await runQuery(sql, params)

      return {
        success: true,
        message: 'OK',
        data: {
          summary: rows,
          topVendedores: [],
          topProdutos: [],
          meta: { nivel2_dim, nivel2_time_grain, measure },
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
          meta: { nivel2_dim, nivel2_time_grain, measure },
        }
      }
    }
  },
})
