import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

export const listarReembolsos = tool({
  description: 'Busca reembolsos com filtros avançados de status, categoria, solicitante e período',
  inputSchema: z.object({
    limit: z.number().default(50).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'aprovado', 'reprovado', 'reembolsado']).optional()
      .describe('Filtrar por status do reembolso'),
    categoria: z.string().optional()
      .describe('Filtrar por categoria (alimentacao, transporte, hospedagem, etc)'),
    solicitante_id: z.string().optional()
      .describe('Filtrar por ID do solicitante (funcionário)'),
    data_de: z.string().optional()
      .describe('Data inicial da despesa (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final da despesa (formato YYYY-MM-DD)'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
  }),

  execute: async ({
    limit = 50,
    status,
    categoria,
    solicitante_id,
    data_de,
    data_ate,
    valor_minimo,
    valor_maximo,
  }) => {
    try {
      const conditions: string[] = [];
      const params: unknown[] = [];
      let index = 1;

      const push = (clause: string, value: unknown) => {
        conditions.push(`${clause} $${index}`);
        params.push(value);
        index += 1;
      };

      // Filtros
      if (status) push('r.status =', status);
      if (categoria) push('r.categoria =', categoria);
      if (solicitante_id) push('r.solicitante_id =', solicitante_id);
      if (data_de) push('r.data_despesa >=', data_de);
      if (data_ate) push('r.data_despesa <=', data_ate);
      if (valor_minimo !== undefined) push('r.valor >=', valor_minimo);
      if (valor_maximo !== undefined) push('r.valor <=', valor_maximo);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const listSql = `
        SELECT
          r.id,
          r.solicitante_id,
          f.nome AS solicitante_nome,
          r.aprovador_id,
          a.nome AS aprovador_nome,
          r.categoria,
          r.valor,
          r.descricao,
          r.justificativa,
          r.data_despesa,
          r.data_solicitacao,
          r.data_aprovacao,
          r.status,
          r.observacao_aprovador,
          r.motivo_reprovacao,
          r.score_conformidade,
          r.centro_custo_id,
          r.anexo_url,
          r.created_at
        FROM gestaofinanceira.reembolsos AS r
        LEFT JOIN entidades.funcionarios AS f ON f.id = r.solicitante_id
        LEFT JOIN entidades.funcionarios AS a ON a.id = r.aprovador_id
        ${whereClause}
        ORDER BY r.data_solicitacao DESC
        LIMIT $${index}
      `.trim();

      const paramsWithLimit = [...params, limit];

      const totalsSql = `
        SELECT
          SUM(r.valor) AS total_valor,
          COUNT(*) AS total_registros
        FROM gestaofinanceira.reembolsos AS r
        ${whereClause}
      `.trim();

      const rowsRaw = await runQuery<Record<string, unknown>>(listSql, paramsWithLimit);
      const [totals] = await runQuery<{
        total_valor: number | null;
        total_registros: number | null;
      }>(totalsSql, params);

      const totalValor = Number(totals?.total_valor ?? 0);
      const count = rowsRaw.length;

      return {
        success: true,
        count,
        total_valor: totalValor,
        rows: rowsRaw,
        message: `Encontrados ${count} reembolsos (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${totalsSql}`,
        sql_params: formatSqlParams(paramsWithLimit),
      };
    } catch (error) {
      console.error('ERRO listarReembolsos:', error);
      return {
        success: false,
        rows: [],
        message: `Erro ao buscar reembolsos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
});
