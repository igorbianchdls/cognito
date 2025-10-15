import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

export const obterDespesasPorCentroCusto = tool({
  description: 'Analisa despesas agrupadas por centro de custo com totais e percentuais',
  inputSchema: z.object({
    data_inicial: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().describe('Data final (YYYY-MM-DD)'),
    limit: z.number().default(20).describe('Número máximo de centros de custo'),
  }),
  execute: async ({
    data_inicial,
    data_final,
    limit,
  }) => {
    try {
      const params: unknown[] = [data_inicial, data_final, limit];

      // PLACEHOLDER QUERY - User will provide actual query
      const sql = `
        SELECT
          cc.id AS centro_custo_id,
          cc.nome AS centro_custo_nome,
          cc.codigo,
          COUNT(cp.id) AS quantidade_despesas,
          SUM(cp.valor) AS total_despesas,
          ROUND(
            (SUM(cp.valor) * 100.0 / NULLIF(
              (SELECT SUM(valor) FROM gestaofinanceira.contas_a_pagar
               WHERE data_vencimento BETWEEN $1 AND $2),
              0
            )),
            2
          ) AS percentual
        FROM gestaofinanceira.centros_custo cc
        LEFT JOIN gestaofinanceira.contas_a_pagar cp
          ON cp.centro_custo_id = cc.id
          AND cp.data_vencimento BETWEEN $1 AND $2
        WHERE cc.ativo = TRUE
        GROUP BY cc.id, cc.nome, cc.codigo
        HAVING SUM(cp.valor) > 0
        ORDER BY total_despesas DESC
        LIMIT $3
      `.trim();

      const rows = await runQuery<Record<string, unknown>>(sql, params);

      const totalSql = `
        SELECT
          SUM(valor) AS total_geral,
          COUNT(*) AS total_despesas
        FROM gestaofinanceira.contas_a_pagar
        WHERE data_vencimento BETWEEN $1 AND $2
      `.trim();

      const [totals] = await runQuery<{
        total_geral: number | null;
        total_despesas: number | null;
      }>(totalSql, [data_inicial, data_final]);

      const totalGeral = Number(totals?.total_geral ?? 0);

      return {
        success: true,
        rows,
        count: rows.length,
        totals: {
          total_geral: totalGeral,
          total_despesas: Number(totals?.total_despesas ?? 0),
        },
        periodo: {
          data_inicial,
          data_final,
        },
        message: `${rows.length} centros de custo com despesas (Total: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${sql}\n\n-- Total Geral\n${totalSql}`,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO obterDespesasPorCentroCusto:', error);
      return {
        success: false,
        message: `Erro ao buscar despesas por centro de custo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
        count: 0,
      };
    }
  },
});
