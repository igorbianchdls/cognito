import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

export const analiseTerritorio = tool({
  description: 'Analisa território com drill-down para vendedores',
  inputSchema: z.object({
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
  }),
  execute: async ({ data_de, data_ate }) => {
    try {
      const params: string[] = []
      let whereClause = ''

      if (data_de && data_ate) {
        whereClause = 'WHERE data_pedido BETWEEN $1 AND $2'
        params.push(data_de, data_ate)
      }

      const sql = `
        (
          SELECT
            1 AS nivel,
            territorio_nome AS nome,
            NULL AS vendedor_nome,
            SUM(item_subtotal) AS faturamento_total
          FROM vendas.vw_pedidos_completo
          ${whereClause}
          GROUP BY territorio_nome
        )
        UNION ALL
        (
          SELECT
            2 AS nivel,
            territorio_nome AS nome,
            vendedor_nome,
            SUM(item_subtotal) AS faturamento_total
          FROM vendas.vw_pedidos_completo
          ${whereClause}
          GROUP BY territorio_nome, vendedor_nome
        )
        ORDER BY nome, nivel, faturamento_total DESC
      `

      const rows = await runQuery(sql, params)

      return {
        success: true,
        message: 'OK',
        data: {
          summary: rows,
          topVendedores: [],
          topProdutos: []
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro',
        data: {
          summary: [],
          topVendedores: [],
          topProdutos: []
        }
      }
    }
  },
})
