import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

export const getMovimentos = tool({
  description: 'Consulta movimentos financeiros efetivados (entradas/saídas) com filtros opcionais.',
  inputSchema: z.object({
    limit: z.number().default(50).describe('Número máximo de resultados'),
    conta_id: z.string().optional().describe('Filtrar por ID da conta bancária'),
    tipo: z.enum(['entrada', 'saída']).optional().describe('Filtrar por tipo'),
    data_inicial: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().optional().describe('Data final (YYYY-MM-DD)'),
    categoria_id: z.string().optional().describe('Filtrar por categoria'),
    valor_minimo: z.number().optional().describe('Valor mínimo'),
    valor_maximo: z.number().optional().describe('Valor máximo'),
  }),
  execute: async ({
    limit,
    conta_id,
    tipo,
    data_inicial,
    data_final,
    categoria_id,
    valor_minimo,
    valor_maximo,
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

      if (conta_id) pushCondition('conta_id =', conta_id);
      if (tipo) pushCondition('tipo =', tipo);
      if (data_inicial) pushCondition('data >=', data_inicial);
      if (data_final) pushCondition('data <=', data_final);
      if (categoria_id) pushCondition('categoria_id =', categoria_id);
      if (valor_minimo !== undefined) pushCondition('valor >=', valor_minimo);
      if (valor_maximo !== undefined) pushCondition('valor <=', valor_maximo);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const listSql = `
        SELECT
          id,
          conta_id,
          categoria_id,
          tipo,
          valor,
          data,
          descricao,
          conta_a_pagar_id,
          conta_a_receber_id,
          created_at
        FROM gestaofinanceira.movimentos
        ${whereClause}
        ORDER BY data DESC
        LIMIT $${paramIndex}
      `.trim();

      const listParams = [...params, limit ?? 50];

      const rows = await runQuery<{
        id: string;
        conta_id: string;
        categoria_id: string | null;
        tipo: 'entrada' | 'saída';
        valor: number;
        data: string;
        descricao: string | null;
        conta_a_pagar_id: string | null;
        conta_a_receber_id: string | null;
        created_at: string | null;
      }>(listSql, listParams);

      const aggSql = `
        SELECT
          SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) AS total_entradas,
          SUM(CASE WHEN tipo = 'saída' THEN valor ELSE 0 END) AS total_saidas,
          COUNT(*) AS total_movimentos
        FROM gestaofinanceira.movimentos
        ${whereClause}
      `.trim();

      const [agg] = await runQuery<{
        total_entradas: number | null;
        total_saidas: number | null;
        total_movimentos: number | null;
      }>(aggSql, params);

      const totalEntradas = Number(agg?.total_entradas ?? 0);
      const totalSaidas = Number(agg?.total_saidas ?? 0);
      const saldoLiquido = totalEntradas - totalSaidas;

      return {
        success: true,
        rows,
        totals: {
          total_entradas: totalEntradas,
          total_saidas: totalSaidas,
          saldo_liquido: saldoLiquido,
          total_movimentos: Number(agg?.total_movimentos ?? rows.length),
        },
        message: `Movimentos encontrados: ${rows.length} (Entradas: ${totalEntradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Saídas: ${totalSaidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${aggSql}`,
        sql_params: formatSqlParams(listParams),
      };
    } catch (error) {
      console.error('ERRO getMovimentos:', error);
      return {
        success: false,
        message: `Erro ao buscar movimentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
      };
    }
  },
});

export const createMovimento = tool({
  description: 'Cria um movimento financeiro (entrada ou saída) manualmente registrado no sistema.',
  inputSchema: z.object({
    conta_id: z.string().describe('ID da conta bancária'),
    tipo: z.enum(['entrada', 'saída']).describe('Tipo de movimento'),
    valor: z.number().positive().describe('Valor em reais'),
    data: z.string().describe('Data do movimento (YYYY-MM-DD)'),
    categoria_id: z.string().optional().describe('Categoria (opcional)'),
    descricao: z.string().optional().describe('Descrição do movimento'),
    conta_a_pagar_id: z.string().optional().describe('Vínculo com conta a pagar'),
    conta_a_receber_id: z.string().optional().describe('Vínculo com conta a receber'),
  }),
  execute: async ({
    conta_id,
    tipo,
    valor,
    data,
    categoria_id,
    descricao,
    conta_a_pagar_id,
    conta_a_receber_id,
  }) => {
    try {
      if (conta_a_pagar_id && conta_a_receber_id) {
        throw new Error('O movimento não pode referenciar conta a pagar e a receber ao mesmo tempo');
      }

      const insertSql = `
        INSERT INTO gestaofinanceira.movimentos
          (conta_id, categoria_id, tipo, valor, data, descricao, conta_a_pagar_id, conta_a_receber_id)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `.trim();

      const [movimento] = await runQuery<{
        id: string;
        conta_id: string;
        categoria_id: string | null;
        tipo: 'entrada' | 'saída';
        valor: number;
        data: string;
        descricao: string | null;
        conta_a_pagar_id: string | null;
        conta_a_receber_id: string | null;
        created_at: string | null;
      }>(insertSql, [
        conta_id,
        categoria_id ?? null,
        tipo,
        valor,
        data,
        descricao ?? null,
        conta_a_pagar_id ?? null,
        conta_a_receber_id ?? null,
      ]);

      const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      return {
        success: true,
        message: `Movimento ${tipo === 'entrada' ? 'de entrada' : 'de saída'} registrado (${valorFormatado}) em ${data}`,
        movimento,
        sql_query: insertSql,
        sql_params: formatSqlParams([
          conta_id,
          categoria_id ?? null,
          tipo,
          valor,
          data,
          descricao ?? null,
          conta_a_pagar_id ?? null,
          conta_a_receber_id ?? null,
        ]),
      };
    } catch (error) {
      console.error('ERRO createMovimento:', error);
      return {
        success: false,
        message: `Erro ao criar movimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
