import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

export const analiseTerritorio = tool({
  description: 'Analisa território',
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
        SELECT
          territorio_nome,
          SUM(item_subtotal) AS faturamento_total,
          COUNT(DISTINCT pedido_id) AS total_pedidos,
          SUM(quantidade) AS total_itens,
          CASE WHEN COUNT(DISTINCT pedido_id) > 0
               THEN SUM(item_subtotal) / COUNT(DISTINCT pedido_id)
               ELSE 0 END AS ticket_medio,
          ROUND(
            SUM(item_subtotal) * 100.0 / SUM(SUM(item_subtotal)) OVER(),
            2
          ) AS participacao_faturamento
        FROM vendas.vw_pedidos_completo
        ${whereClause}
        GROUP BY territorio_nome
        ORDER BY faturamento_total DESC
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
