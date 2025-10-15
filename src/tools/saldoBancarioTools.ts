import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

export const obterSaldoBancario = tool({
  description: 'Obtém saldos atuais de todas as contas bancárias com distribuição por tipo',
  inputSchema: z.object({
    incluir_inativas: z.boolean().default(false).describe('Incluir contas inativas'),
    tipo_conta: z.string().optional().describe('Filtrar por tipo de conta (corrente, poupança, etc)'),
  }),
  execute: async ({
    incluir_inativas,
    tipo_conta,
  }) => {
    try {
      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      const pushCondition = (clause: string, value: unknown) => {
        conditions.push(`${clause} $${paramIndex}`);
        params.push(value);
        paramIndex += 1;
      };

      if (!incluir_inativas) {
        conditions.push('ativa = TRUE');
      }

      if (tipo_conta) pushCondition('tipo =', tipo_conta);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // PLACEHOLDER QUERY - User will provide actual query
      const listSql = `
        SELECT
          id,
          nome,
          banco,
          agencia,
          numero_conta,
          tipo,
          saldo,
          ativa
        FROM gestaofinanceira.contas
        ${whereClause}
        ORDER BY saldo DESC
      `.trim();

      const rows = await runQuery<Record<string, unknown>>(listSql, params);

      const aggSql = `
        SELECT
          SUM(saldo) AS saldo_total,
          COUNT(*) AS total_contas,
          SUM(CASE WHEN saldo > 0 THEN saldo ELSE 0 END) AS saldo_positivo,
          SUM(CASE WHEN saldo < 0 THEN saldo ELSE 0 END) AS saldo_negativo
        FROM gestaofinanceira.contas
        ${whereClause}
      `.trim();

      const [agg] = await runQuery<{
        saldo_total: number | null;
        total_contas: number | null;
        saldo_positivo: number | null;
        saldo_negativo: number | null;
      }>(aggSql, params);

      const saldoTotal = Number(agg?.saldo_total ?? 0);
      const saldoPositivo = Number(agg?.saldo_positivo ?? 0);
      const saldoNegativo = Number(agg?.saldo_negativo ?? 0);

      return {
        success: true,
        rows,
        count: rows.length,
        totals: {
          saldo_total: saldoTotal,
          saldo_positivo: saldoPositivo,
          saldo_negativo: saldoNegativo,
          total_contas: Number(agg?.total_contas ?? rows.length),
        },
        message: `${rows.length} contas bancárias (Saldo total: ${saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${aggSql}`,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO obterSaldoBancario:', error);
      return {
        success: false,
        message: `Erro ao buscar saldos bancários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
        count: 0,
      };
    }
  },
});
