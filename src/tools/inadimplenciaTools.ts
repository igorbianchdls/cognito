import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

export const analisarInadimplencia = tool({
  description: 'Analisa inadimplência de contas a receber e a pagar por faixas de atraso (aging)',
  inputSchema: z.object({
    tipo: z.enum(['receber', 'pagar', 'ambos']).default('ambos')
      .describe('Tipo de análise: contas a receber, a pagar ou ambos'),
  }),
  execute: async ({ tipo }) => {
    try {
      // PLACEHOLDER QUERY - User will provide actual query
      const sql = `
        WITH base_receber AS (
          SELECT
            id,
            cliente_id,
            valor,
            data_vencimento::date AS venc,
            'A Receber' AS tipo_conta
          FROM gestaofinanceira.contas_a_receber
          WHERE status = 'pendente'
        ),
        base_pagar AS (
          SELECT
            id,
            fornecedor_id,
            valor,
            data_vencimento::date AS venc,
            'A Pagar' AS tipo_conta
          FROM gestaofinanceira.contas_a_pagar
          WHERE status = 'pendente'
        ),
        combined AS (
          ${tipo === 'pagar' ? '-- ' : ''}SELECT * FROM base_receber
          ${tipo === 'ambos' ? 'UNION ALL' : ''}
          ${tipo === 'receber' ? '-- ' : ''}SELECT * FROM base_pagar
        )
        SELECT
          tipo_conta,
          CASE
            WHEN venc >= CURRENT_DATE THEN 'A Vencer'
            WHEN venc BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE - 1 THEN '1-30 dias'
            WHEN venc BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31 THEN '31-60 dias'
            WHEN venc BETWEEN CURRENT_DATE - 90 AND CURRENT_DATE - 61 THEN '61-90 dias'
            ELSE '90+ dias'
          END AS faixa,
          COUNT(*) AS quantidade,
          SUM(valor) AS valor_total,
          ROUND(AVG(CURRENT_DATE - venc), 0) AS dias_atraso_medio
        FROM combined
        GROUP BY tipo_conta, faixa
        ORDER BY
          tipo_conta,
          CASE faixa
            WHEN 'A Vencer' THEN 0
            WHEN '1-30 dias' THEN 1
            WHEN '31-60 dias' THEN 2
            WHEN '61-90 dias' THEN 3
            ELSE 4
          END
      `.trim();

      const rows = await runQuery<Record<string, unknown>>(sql, []);

      // Calculate percentages
      const totalGeral = rows.reduce((sum, row) => sum + Number(row.valor_total || 0), 0);
      const rowsWithPercentual = rows.map(row => ({
        ...row,
        percentual_valor: totalGeral > 0
          ? Number(((Number(row.valor_total || 0) / totalGeral) * 100).toFixed(2))
          : 0,
      }));

      const totalSql = `
        SELECT
          SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) AS total_inadimplencia,
          COUNT(CASE WHEN status = 'pendente' AND data_vencimento < CURRENT_DATE THEN 1 END) AS total_vencidas
        FROM (
          ${tipo === 'pagar' ? '-- ' : ''}SELECT valor, status, data_vencimento FROM gestaofinanceira.contas_a_receber
          ${tipo === 'ambos' ? 'UNION ALL' : ''}
          ${tipo === 'receber' ? '-- ' : ''}SELECT valor, status, data_vencimento FROM gestaofinanceira.contas_a_pagar
        ) AS all_contas
      `.trim();

      const [totals] = await runQuery<{
        total_inadimplencia: number | null;
        total_vencidas: number | null;
      }>(totalSql, []);

      const totalInadimplencia = Number(totals?.total_inadimplencia ?? 0);
      const totalVencidas = Number(totals?.total_vencidas ?? 0);

      return {
        success: true,
        rows: rowsWithPercentual,
        count: rowsWithPercentual.length,
        totals: {
          total_inadimplencia: totalInadimplencia,
          total_vencidas: totalVencidas,
        },
        message: `Análise de inadimplência: ${totalVencidas} títulos vencidos (${totalInadimplencia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${sql}\n\n-- Totais\n${totalSql}`,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO analisarInadimplencia:', error);
      return {
        success: false,
        message: `Erro ao analisar inadimplência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
        count: 0,
      };
    }
  },
});
