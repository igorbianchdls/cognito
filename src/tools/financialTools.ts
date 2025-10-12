import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

type AccountsFilters = {
  limit?: number;
  status?: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  entidade_id?: string;
  categoria_id?: string;
  vence_em_dias?: number;
  venceu_ha_dias?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  data_emissao_de?: string;
  data_emissao_ate?: string;
};

const buildAccountsQuery = (table: 'contas_a_receber' | 'contas_a_pagar', filters: AccountsFilters) => {
  const {
    limit = 20,
    status,
    entidade_id,
    categoria_id,
    vence_em_dias,
    venceu_ha_dias,
    valor_minimo,
    valor_maximo,
    data_emissao_de,
    data_emissao_ate,
  } = filters;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let index = 1;

  const push = (clause: string, value: unknown) => {
    conditions.push(`${clause} $${index}`);
    params.push(value);
    index += 1;
  };

  if (status) push('status =', status);
  if (entidade_id) push(table === 'contas_a_receber' ? 'cliente_id =' : 'fornecedor_id =', entidade_id);
  if (categoria_id) push('categoria_id =', categoria_id);
  if (valor_minimo !== undefined) push('valor >=', valor_minimo);
  if (valor_maximo !== undefined) push('valor <=', valor_maximo);

  if (vence_em_dias !== undefined) {
    conditions.push(`data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${index}::int) * INTERVAL '1 day'`);
    params.push(vence_em_dias);
    index += 1;
  }

  if (venceu_ha_dias !== undefined) {
    conditions.push(`data_vencimento BETWEEN CURRENT_DATE - ($${index}::int) * INTERVAL '1 day' AND CURRENT_DATE - INTERVAL '1 day'`);
    params.push(venceu_ha_dias);
    index += 1;
  }

  if (data_emissao_de) push('data_emissao >=', data_emissao_de);
  if (data_emissao_ate) push('data_emissao <=', data_emissao_ate);

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const listSql = `
    SELECT *
    FROM gestaofinanceira.${table}
    ${whereClause}
    ORDER BY data_vencimento ASC, data_emissao ASC
    LIMIT $${index}
  `.trim();

  const totalsSql = `
    SELECT
      SUM(valor) AS total_valor,
      COUNT(*) AS total_registros
    FROM gestaofinanceira.${table}
    ${whereClause}
  `.trim();

  const paramsWithLimit = [...params, limit];

  return {
    listSql,
    totalsSql,
    params,
    paramsWithLimit,
  };
};

export const getContasAReceber = tool({
  description: 'Busca contas a receber (clientes, receitas) com filtros avançados',
  inputSchema: z.object({
    limit: z.number().default(20).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status do recebimento'),
    cliente_id: z.string().optional()
      .describe('Filtrar por ID do cliente'),
    categoria_id: z.string().optional()
      .describe('Filtrar por ID da categoria'),
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
  }),

  execute: async (filters) => {
    try {
      const { listSql, totalsSql, params, paramsWithLimit } = buildAccountsQuery('contas_a_receber', {
        ...filters,
        entidade_id: filters.cliente_id,
      });

      const rowsRaw = await runQuery<Record<string, unknown>>(listSql, paramsWithLimit);
      const [totals] = await runQuery<{
        total_valor: number | null;
        total_registros: number | null;
      }>(totalsSql, params);

      const totalValor = Number(totals?.total_valor ?? 0);
      const count = rowsRaw.length;

      const rows = rowsRaw.map(row => {
        const rawTotal = (row as { valor_total?: number; valor?: number }).valor_total ?? (row as { valor?: number }).valor ?? 0;
        const valorTotal = Number(rawTotal);
        const valorPago = Number((row as { valor_pago?: number }).valor_pago ?? 0);
        const valorPendente = Number((row as { valor_pendente?: number }).valor_pendente ?? Math.max(0, valorTotal - valorPago));
        const clienteNome = (row as { cliente_nome?: string; cliente?: string; cliente_id?: string }).cliente_nome
          ?? (row as { cliente?: string }).cliente
          ?? (row as { cliente_id?: string }).cliente_id
          ?? 'Sem cliente';

        return {
          ...row,
          cliente: clienteNome,
          valor_total: valorTotal,
          valor_pago: valorPago,
          valor_pendente: valorPendente,
        };
      });

      return {
        success: true,
        count,
        total_valor: totalValor,
        rows,
        message: `Encontradas ${count} contas a receber (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${totalsSql}`,
        sql_params: formatSqlParams(paramsWithLimit),
      };
    } catch (error) {
      console.error('ERRO getContasAReceber:', error);
      return {
        success: false,
        rows: [],
        message: `❌ Erro ao buscar contas a receber: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
});

export const getContasAPagar = tool({
  description: 'Busca contas a pagar (fornecedores, despesas) com filtros avançados',
  inputSchema: z.object({
    limit: z.number().default(20).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status do pagamento'),
    fornecedor_id: z.string().optional()
      .describe('Filtrar por ID do fornecedor'),
    categoria_id: z.string().optional()
      .describe('Filtrar por ID da categoria'),
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
  }),

  execute: async (filters) => {
    try {
      const { listSql, totalsSql, params, paramsWithLimit } = buildAccountsQuery('contas_a_pagar', {
        ...filters,
        entidade_id: filters.fornecedor_id,
      });

      const rowsRaw = await runQuery<Record<string, unknown>>(listSql, paramsWithLimit);
      const [totals] = await runQuery<{
        total_valor: number | null;
        total_registros: number | null;
      }>(totalsSql, params);

      const totalValor = Number(totals?.total_valor ?? 0);
      const count = rowsRaw.length;

      const rows = rowsRaw.map(row => {
        const rawTotal = (row as { valor_total?: number; valor?: number }).valor_total ?? (row as { valor?: number }).valor ?? 0;
        const valorTotal = Number(rawTotal);
        const valorPago = Number((row as { valor_pago?: number }).valor_pago ?? 0);
        const valorPendente = Number((row as { valor_pendente?: number }).valor_pendente ?? Math.max(0, valorTotal - valorPago));
        const fornecedorNome = (row as { fornecedor_nome?: string; fornecedor?: string; fornecedor_id?: string }).fornecedor_nome
          ?? (row as { fornecedor?: string }).fornecedor
          ?? (row as { fornecedor_id?: string }).fornecedor_id
          ?? 'Sem fornecedor';

        return {
          ...row,
          fornecedor: fornecedorNome,
          valor_total: valorTotal,
          valor_pago: valorPago,
          valor_pendente: valorPendente,
        };
      });

      return {
        success: true,
        count,
        total_valor: totalValor,
        rows,
        message: `Encontradas ${count} contas a pagar (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${totalsSql}`,
        sql_params: formatSqlParams(paramsWithLimit),
      };
    } catch (error) {
      console.error('ERRO getContasAPagar:', error);
      return {
        success: false,
        rows: [],
        message: `❌ Erro ao buscar contas a pagar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
});

export const calculateDateRange = tool({
  description: 'Calcula intervalos de datas relativos (últimos X dias, próximos X dias, etc). Use quando usuário pedir períodos relativos como "últimos 30 dias", "próxima semana", etc.',
  inputSchema: z.object({
    periodo: z.enum(['ultimos_dias', 'proximos_dias', 'mes_atual', 'mes_passado', 'ano_atual', 'ano_passado'])
      .describe('Tipo de período a calcular'),
    quantidade_dias: z.number().optional()
      .describe('Quantidade de dias (obrigatório para ultimos_dias e proximos_dias)'),
  }),

  execute: async ({ periodo, quantidade_dias }) => {
    try {
      const hoje = new Date();
      let dataInicial: Date;
      let dataFinal: Date;

      switch (periodo) {
        case 'ultimos_dias':
          if (!quantidade_dias) throw new Error('quantidade_dias é obrigatório para ultimos_dias');
          dataInicial = new Date();
          dataInicial.setDate(hoje.getDate() - quantidade_dias);
          dataFinal = hoje;
          break;

        case 'proximos_dias':
          if (!quantidade_dias) throw new Error('quantidade_dias é obrigatório para proximos_dias');
          dataInicial = hoje;
          dataFinal = new Date();
          dataFinal.setDate(hoje.getDate() + quantidade_dias);
          break;

        case 'mes_atual':
          dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          dataFinal = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
          break;

        case 'mes_passado':
          dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
          dataFinal = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
          break;

        case 'ano_atual':
          dataInicial = new Date(hoje.getFullYear(), 0, 1);
          dataFinal = new Date(hoje.getFullYear(), 11, 31);
          break;

        case 'ano_passado':
          dataInicial = new Date(hoje.getFullYear() - 1, 0, 1);
          dataFinal = new Date(hoje.getFullYear() - 1, 11, 31);
          break;

        default:
          throw new Error('Período inválido');
      }

      const dataInicialStr = dataInicial.toISOString().split('T')[0];
      const dataFinalStr = dataFinal.toISOString().split('T')[0];

      return {
        success: true,
        data_inicial: dataInicialStr,
        data_final: dataFinalStr,
        periodo_descricao: periodo,
        dias_calculados: quantidade_dias,
        message: `📅 Período calculado: ${dataInicialStr} até ${dataFinalStr}`
      };

    } catch (error) {
      console.error('ERRO calculateDateRange:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao calcular período de datas`
      };
    }
  }
});
