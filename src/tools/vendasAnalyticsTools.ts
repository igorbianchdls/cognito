import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

export const analiseTerritorio = tool({
  description: 'Analisa território com drill-down (vendedor ou canal de venda) e filtros de período/território',
  inputSchema: z.object({
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
    territorio_nome: z.string().optional(),
    nivel2: z.enum(['vendedor', 'canal']).default('vendedor').optional(),
  }),
  execute: async ({ data_de, data_ate, territorio_nome, nivel2 = 'vendedor' }) => {
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

      // Whitelist para evitar SQL injection em nome de coluna
      const detailCol = nivel2 === 'canal' ? 'canal_venda_nome' : 'vendedor_nome'

      const sql = `
        (
          SELECT
            1 AS nivel,
            territorio_nome AS nome,
            NULL AS detalhe_nome,
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
            ${detailCol} AS detalhe_nome,
            SUM(item_subtotal) AS faturamento_total
          FROM vendas.vw_pedidos_completo
          ${whereClause}
          GROUP BY territorio_nome, ${detailCol}
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
          topProdutos: [],
          nivel2,
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
          nivel2,
        }
      }
    }
  },
})
