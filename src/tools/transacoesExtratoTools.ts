import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

export const getTransacoesExtrato = tool({
  description: 'Consulta transações documentadas e extrato bancário do sistema de gestão de documentos',
  inputSchema: z.object({
    limit: z.number().default(50).describe('Número máximo de resultados'),
    data_inicial: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().optional().describe('Data final (YYYY-MM-DD)'),
    tipo: z.string().optional().describe('Filtrar por tipo de transação'),
    status: z.string().optional().describe('Filtrar por status'),
  }),
  execute: async ({
    limit,
    data_inicial,
    data_final,
    tipo,
    status,
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

      if (data_inicial) pushCondition('data >=', data_inicial);
      if (data_final) pushCondition('data <=', data_final);
      if (tipo) pushCondition('tipo =', tipo);
      if (status) pushCondition('status =', status);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // PLACEHOLDER QUERY - User will provide actual query
      const listSql = `
        SELECT
          id,
          data,
          descricao,
          tipo,
          valor,
          status,
          created_at
        FROM gestaodocumentos.transacoes
        ${whereClause}
        ORDER BY data DESC
        LIMIT $${paramIndex}
      `.trim();

      const listParams = [...params, limit ?? 50];

      const rows = await runQuery<Record<string, unknown>>(listSql, listParams);

      const aggSql = `
        SELECT
          COUNT(*) AS total_transacoes,
          SUM(valor) AS total_valor
        FROM gestaodocumentos.transacoes
        ${whereClause}
      `.trim();

      const [agg] = await runQuery<{
        total_transacoes: number | null;
        total_valor: number | null;
      }>(aggSql, params);

      const totalValor = Number(agg?.total_valor ?? 0);
      const totalTransacoes = Number(agg?.total_transacoes ?? rows.length);

      return {
        success: true,
        rows,
        count: rows.length,
        total_valor: totalValor,
        total_transacoes: totalTransacoes,
        message: `Encontradas ${rows.length} transações (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${aggSql}`,
        sql_params: formatSqlParams(listParams),
      };
    } catch (error) {
      console.error('ERRO getTransacoesExtrato:', error);
      return {
        success: false,
        message: `Erro ao buscar transações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
        count: 0,
      };
    }
  },
});
