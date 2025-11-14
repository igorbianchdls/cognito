import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

export const analiseTerritorio = tool({
  description: 'Analisa a performance de vendas de um território específico, incluindo métricas consolidadas, top vendedores e top produtos',
  parameters: z.object({
    territorio_nome: z.string().optional().describe('Nome do território para análise. Se não fornecido, analisa todos os territórios'),
    data_de: z.string().optional().describe('Data inicial no formato YYYY-MM-DD'),
    data_ate: z.string().optional().describe('Data final no formato YYYY-MM-DD'),
  }),
  execute: async ({ territorio_nome, data_de, data_ate }: { territorio_nome?: string; data_de?: string; data_ate?: string }) => {
    try {
      const params: (string | number)[] = [];
      const whereConditions: string[] = [];
      let paramCounter = 1;

      // Build WHERE clause
      if (territorio_nome) {
        whereConditions.push(`territorio_nome = $${paramCounter}`);
        params.push(territorio_nome);
        paramCounter++;
      }

      if (data_de) {
        whereConditions.push(`data_pedido >= $${paramCounter}::date`);
        params.push(data_de);
        paramCounter++;
      }

      if (data_ate) {
        whereConditions.push(`data_pedido <= $${paramCounter}::date`);
        params.push(data_ate);
        paramCounter++;
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query for territory summary
      const summaryQuery = `
        SELECT
          COALESCE(territorio_nome, 'Não Informado') as territorio,
          COUNT(DISTINCT pedido_id) as total_pedidos,
          COALESCE(SUM(item_subtotal), 0)::float as receita_total,
          COALESCE(AVG(item_subtotal), 0)::float as ticket_medio,
          COUNT(DISTINCT cliente_nome) as total_clientes,
          COUNT(DISTINCT vendedor_nome) as total_vendedores
        FROM vendas.vw_pedidos_completo
        ${whereClause}
        GROUP BY territorio_nome
        ORDER BY receita_total DESC
      `;

      // Query for top sellers in territory
      const topVendedoresQuery = `
        SELECT
          vendedor_nome,
          COUNT(DISTINCT pedido_id) as total_pedidos,
          COALESCE(SUM(item_subtotal), 0)::float as receita_total
        FROM vendas.vw_pedidos_completo
        ${whereClause}
        GROUP BY vendedor_nome
        ORDER BY receita_total DESC
        LIMIT 10
      `;

      // Query for top products in territory
      const topProdutosQuery = `
        SELECT
          produto_nome,
          SUM(quantidade)::int as quantidade_vendida,
          COALESCE(SUM(item_subtotal), 0)::float as receita_total
        FROM vendas.vw_pedidos_completo
        ${whereClause}
        GROUP BY produto_nome
        ORDER BY receita_total DESC
        LIMIT 10
      `;

      const [summary, topVendedores, topProdutos] = await Promise.all([
        runQuery(summaryQuery, params),
        runQuery(topVendedoresQuery, params),
        runQuery(topProdutosQuery, params),
      ]);

      return {
        success: true,
        message: territorio_nome
          ? `Análise do território: ${territorio_nome}`
          : 'Análise de todos os territórios',
        data: {
          summary,
          topVendedores,
          topProdutos,
        },
        filters: {
          territorio_nome,
          data_de,
          data_ate,
        },
        sql_query: summaryQuery,
        sql_params: JSON.stringify(params),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        success: false,
        message: `Erro ao analisar território: ${errorMessage}`,
        error: errorMessage,
      };
    }
  },
});
