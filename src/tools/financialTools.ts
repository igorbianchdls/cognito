import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 500;

const FINANCE_TABLES = [
  'categorias',
  'contas',
  'contas_a_pagar',
  'contas_a_receber',
  'conciliacao_bancaria',
  'movimentos',
  'contratos',
  'documentos',
  'documento_itens',
  'entidades',
] as const;

type FinanceTable = (typeof FINANCE_TABLES)[number];

const normalizeLimit = (limit?: number) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), MIN_LIMIT), MAX_LIMIT);
};

const TABLE_ORDER_COLUMNS: Record<FinanceTable, string> = {
  categorias: 'criado_em',
  contas: 'criado_em',
  contas_a_pagar: 'data_vencimento',
  contas_a_receber: 'data_vencimento',
  conciliacao_bancaria: 'data_extrato',
  movimentos: 'data',
  contratos: 'criado_em',
  documentos: 'criado_em',
  documento_itens: 'criado_em',
  entidades: 'criado_em',
};

const TABLE_DATE_COLUMNS: Partial<Record<FinanceTable, { from: string; to?: string }>> = {
  categorias: { from: 'criado_em' },
  contas: { from: 'criado_em' },
  contas_a_pagar: { from: 'data_vencimento' },
  contas_a_receber: { from: 'data_vencimento' },
  conciliacao_bancaria: { from: 'data_extrato' },
  movimentos: { from: 'data' },
  contratos: { from: 'criado_em' },
  documentos: { from: 'criado_em' },
  documento_itens: { from: 'criado_em' },
  entidades: { from: 'criado_em' },
};

const buildGetFinancialDataQuery = (args: {
  table: FinanceTable;
  limit: number;
  status?: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  cliente_id?: string;
  fornecedor_id?: string;
  categoria_id?: string;
  conta_id?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  vence_em_dias?: number;
  venceu_ha_dias?: number;
  data_de?: string;
  data_ate?: string;
}) => {
  const {
    table,
    limit,
    status,
    cliente_id,
    fornecedor_id,
    categoria_id,
    conta_id,
    valor_minimo,
    valor_maximo,
    vence_em_dias,
    venceu_ha_dias,
    data_de,
    data_ate,
  } = args;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const push = (clause: string, value: unknown) => {
    conditions.push(`${clause} $${idx}`);
    params.push(value);
    idx += 1;
  };

  if (status && (table === 'contas_a_pagar' || table === 'contas_a_receber')) {
    push('status =', status);
  }

  if (cliente_id && table === 'contas_a_receber') {
    push('cliente_id =', cliente_id);
  }

  if (fornecedor_id && table === 'contas_a_pagar') {
    push('fornecedor_id =', fornecedor_id);
  }

  if (categoria_id && (table === 'contas_a_pagar' || table === 'contas_a_receber' || table === 'movimentos')) {
    push('categoria_id =', categoria_id);
  }

  if (conta_id && (table === 'movimentos' || table === 'contas_a_pagar' || table === 'contas_a_receber' || table === 'conciliacao_bancaria')) {
    push('conta_id =', conta_id);
  }

  if (typeof valor_minimo === 'number' && (table === 'contas_a_pagar' || table === 'contas_a_receber' || table === 'movimentos')) {
    push('valor >=', valor_minimo);
  }

  if (typeof valor_maximo === 'number' && (table === 'contas_a_pagar' || table === 'contas_a_receber' || table === 'movimentos')) {
    push('valor <=', valor_maximo);
  }

  if (typeof vence_em_dias === 'number' && (table === 'contas_a_pagar' || table === 'contas_a_receber')) {
    conditions.push(`data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${idx}::int) * INTERVAL '1 day'`);
    params.push(vence_em_dias);
    idx += 1;
  }

  if (typeof venceu_ha_dias === 'number' && (table === 'contas_a_pagar' || table === 'contas_a_receber')) {
    conditions.push(`data_vencimento BETWEEN CURRENT_DATE - ($${idx}::int) * INTERVAL '1 day' AND CURRENT_DATE - INTERVAL '1 day'`);
    params.push(venceu_ha_dias);
    idx += 1;
  }

  const dateCols = TABLE_DATE_COLUMNS[table];
  if (data_de && dateCols?.from) {
    push(`${dateCols.from} >=`, data_de);
  }
  if (data_ate) {
    const col = dateCols?.to ?? dateCols?.from;
    if (col) push(`${col} <=`, data_ate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = TABLE_ORDER_COLUMNS[table] ?? 'criado_em';
  const limitIndex = idx;
  params.push(limit);

  const sql = `
    SELECT *
    FROM gestaofinanceira.${table}
    ${whereClause}
    ORDER BY ${orderBy} DESC
    LIMIT $${limitIndex}
  `.trim();

  return { sql, params };
};

export const getFinancialData = tool({
  description: 'Busca dados financeiros (categorias, contas, pagar/receber, conciliação, movimentos, contratos, documentos)',
  inputSchema: z.object({
    table: z.enum(FINANCE_TABLES).describe('Tabela do schema gestaofinanceira'),
    limit: z.number().default(DEFAULT_LIMIT).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional(),
    cliente_id: z.string().optional(),
    fornecedor_id: z.string().optional(),
    categoria_id: z.string().optional(),
    conta_id: z.string().optional(),
    valor_minimo: z.number().optional(),
    valor_maximo: z.number().optional(),
    vence_em_dias: z.number().optional(),
    venceu_ha_dias: z.number().optional(),
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
  }),
  execute: async (input) => {
    let sql: string | null = null;
    let params: unknown[] = [];
    try {
      const limit = normalizeLimit(input.limit);
      const query = buildGetFinancialDataQuery({ ...input, limit });
      sql = query.sql;
      params = query.params;
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        count: rows.length,
        table: input.table,
        message: `✅ ${rows.length} registros encontrados em ${input.table}`,
        rows,
        data: rows,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO getFinancialData:', error);
      return {
        success: false,
        table: input.table,
        message: `❌ Erro ao buscar dados de ${input.table}`,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        rows: [],
        data: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});

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

export const cashflowOverview = tool({
  description: 'Resumo de fluxo de caixa: entradas, saídas e saldo por dia',
  inputSchema: z.object({
    date_range_days: z.number().default(30),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);
    const sql = `
      SELECT
        data::date AS dia,
        SUM(CASE WHEN LOWER(tipo) = 'entrada' THEN valor ELSE 0 END) AS entradas,
        SUM(CASE WHEN LOWER(tipo) = 'saida'   THEN valor ELSE 0 END) AS saidas
      FROM gestaofinanceira.movimentos
      WHERE data::date >= CURRENT_DATE - ($1::int - 1)
      GROUP BY dia
      ORDER BY dia
    `;
    try {
      const rows = await runQuery<{ dia: string; entradas: string | number | null; saidas: string | number | null }>(sql, [range]);
      const formatted = rows.map(r => ({
        dia: r.dia,
        entradas: Number(r.entradas ?? 0),
        saidas: Number(r.saidas ?? 0),
        saldo: Number(r.entradas ?? 0) - Number(r.saidas ?? 0),
      }));
      const totalEntradas = formatted.reduce((a, r) => a + r.entradas, 0);
      const totalSaidas = formatted.reduce((a, r) => a + r.saidas, 0);
      const saldoPeriodo = totalEntradas - totalSaidas;
      return {
        success: true,
        message: `Fluxo dos últimos ${range} dias` ,
        periodo_dias: range,
        metricas: {
          total_entradas: totalEntradas,
          total_saidas: totalSaidas,
          saldo_periodo: saldoPeriodo,
          media_diaria_entradas: Number((totalEntradas / range).toFixed(2)),
          media_diaria_saidas: Number((totalSaidas / range).toFixed(2)),
        },
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO cashflowOverview:', error);
      return { success: false, message: `Erro no fluxo de caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
});

export const accountsAgingReceivables = tool({
  description: 'Aging de contas a receber por faixas de atraso/vencimento',
  inputSchema: z.object({}),
  execute: async () => {
    const sql = `
      WITH base AS (
        SELECT id, cliente_id, valor, data_vencimento::date AS venc
        FROM gestaofinanceira.contas_a_receber
        WHERE status = 'pendente'
      )
      SELECT CASE
               WHEN venc >= CURRENT_DATE THEN 'A Vencer'
               WHEN venc BETWEEN CURRENT_DATE-30 AND CURRENT_DATE-1 THEN '1-30'
               WHEN venc BETWEEN CURRENT_DATE-60 AND CURRENT_DATE-31 THEN '31-60'
               WHEN venc BETWEEN CURRENT_DATE-90 AND CURRENT_DATE-61 THEN '61-90'
               ELSE '90+'
             END AS faixa,
             COUNT(*) AS titulos,
             SUM(valor) AS total
      FROM base
      GROUP BY faixa
      ORDER BY CASE faixa WHEN 'A Vencer' THEN 0 WHEN '1-30' THEN 1 WHEN '31-60' THEN 2 WHEN '61-90' THEN 3 ELSE 4 END
    `;
    try {
      const rows = await runQuery<{ faixa: string; titulos: string | number | null; total: string | number | null }>(sql);
      const formatted = rows.map(r => ({ faixa: r.faixa, titulos: Number(r.titulos ?? 0), total: Number(r.total ?? 0) }));
      return { success: true, message: 'Aging de contas a receber', rows: formatted, sql_query: sql, sql_params: formatSqlParams([]) };
    } catch (error) {
      console.error('ERRO accountsAgingReceivables:', error);
      return { success: false, message: `Erro no aging de CR: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
});

export const accountsAgingPayables = tool({
  description: 'Aging de contas a pagar por faixas de atraso/vencimento',
  inputSchema: z.object({}),
  execute: async () => {
    const sql = `
      WITH base AS (
        SELECT id, fornecedor_id, valor, data_vencimento::date AS venc
        FROM gestaofinanceira.contas_a_pagar
        WHERE status = 'pendente'
      )
      SELECT CASE
               WHEN venc >= CURRENT_DATE THEN 'A Vencer'
               WHEN venc BETWEEN CURRENT_DATE-30 AND CURRENT_DATE-1 THEN '1-30'
               WHEN venc BETWEEN CURRENT_DATE-60 AND CURRENT_DATE-31 THEN '31-60'
               WHEN venc BETWEEN CURRENT_DATE-90 AND CURRENT_DATE-61 THEN '61-90'
               ELSE '90+'
             END AS faixa,
             COUNT(*) AS titulos,
             SUM(valor) AS total
      FROM base
      GROUP BY faixa
      ORDER BY CASE faixa WHEN 'A Vencer' THEN 0 WHEN '1-30' THEN 1 WHEN '31-60' THEN 2 WHEN '61-90' THEN 3 ELSE 4 END
    `;
    try {
      const rows = await runQuery<{ faixa: string; titulos: string | number | null; total: string | number | null }>(sql);
      const formatted = rows.map(r => ({ faixa: r.faixa, titulos: Number(r.titulos ?? 0), total: Number(r.total ?? 0) }));
      return { success: true, message: 'Aging de contas a pagar', rows: formatted, sql_query: sql, sql_params: formatSqlParams([]) };
    } catch (error) {
      console.error('ERRO accountsAgingPayables:', error);
      return { success: false, message: `Erro no aging de CP: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
});

export const receivablesForecast = tool({
  description: 'Previsão de recebimentos (pendentes) por dia no período futuro',
  inputSchema: z.object({ future_days: z.number().default(30) }),
  execute: async ({ future_days = 30 }) => {
    const horizon = Math.min(Math.max(Math.trunc(future_days), 1), 365);
    const sql = `
      SELECT data_vencimento::date AS dia, SUM(valor) AS previsto
      FROM gestaofinanceira.contas_a_receber
      WHERE status = 'pendente'
        AND data_vencimento::date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1::int - 1)
      GROUP BY dia
      ORDER BY dia
    `;
    try {
      const rows = await runQuery<{ dia: string; previsto: string | number | null }>(sql, [horizon]);
      const formatted = rows.map(r => ({ dia: r.dia, previsto: Number(r.previsto ?? 0) }));
      const total = formatted.reduce((a, r) => a + r.previsto, 0);
      return { success: true, message: `Recebimentos previstos próximos ${horizon} dias`, rows: formatted, total_previsto: total, sql_query: sql, sql_params: formatSqlParams([horizon]) };
    } catch (error) {
      console.error('ERRO receivablesForecast:', error);
      return { success: false, message: `Erro na previsão de recebimentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
});

export const payablesSchedule = tool({
  description: 'Cronograma de pagamentos (pendentes) por dia no período futuro',
  inputSchema: z.object({ future_days: z.number().default(30) }),
  execute: async ({ future_days = 30 }) => {
    const horizon = Math.min(Math.max(Math.trunc(future_days), 1), 365);
    const sql = `
      SELECT data_vencimento::date AS dia, SUM(valor) AS previsto
      FROM gestaofinanceira.contas_a_pagar
      WHERE status = 'pendente'
        AND data_vencimento::date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1::int - 1)
      GROUP BY dia
      ORDER BY dia
    `;
    try {
      const rows = await runQuery<{ dia: string; previsto: string | number | null }>(sql, [horizon]);
      const formatted = rows.map(r => ({ dia: r.dia, previsto: Number(r.previsto ?? 0) }));
      const total = formatted.reduce((a, r) => a + r.previsto, 0);
      return { success: true, message: `Pagamentos previstos próximos ${horizon} dias`, rows: formatted, total_previsto: total, sql_query: sql, sql_params: formatSqlParams([horizon]) };
    } catch (error) {
      console.error('ERRO payablesSchedule:', error);
      return { success: false, message: `Erro no cronograma de pagamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
});

export const expenseBreakdownByCategory = tool({
  description: 'Quebra de despesas por categoria no período',
  inputSchema: z.object({ date_range_days: z.number().default(30) }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);
    const sql = `
      SELECT COALESCE(c.nome, 'Sem categoria') AS categoria,
             SUM(m.valor) AS total
      FROM gestaofinanceira.movimentos m
      LEFT JOIN gestaofinanceira.categorias c ON c.id = m.categoria_id
      WHERE m.data::date >= CURRENT_DATE - ($1::int - 1) AND LOWER(m.tipo) = 'saida'
      GROUP BY categoria
      ORDER BY total DESC
    `;
    try {
      const rows = await runQuery<{ categoria: string | null; total: string | number | null }>(sql, [range]);
      const formatted = rows.map(r => ({ categoria: r.categoria ?? 'Sem categoria', total: Number(r.total ?? 0) }));
      return { success: true, message: `Despesas por categoria (${range} dias)`, rows: formatted, sql_query: sql, sql_params: formatSqlParams([range]) };
    } catch (error) {
      console.error('ERRO expenseBreakdownByCategory:', error);
      return { success: false, message: `Erro no breakdown de despesas: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
});

export const profitabilityByCategory = tool({
  description: 'Lucro/Prejuízo por categoria no período (receita - despesa)',
  inputSchema: z.object({ date_range_days: z.number().default(30) }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);
    const sql = `
      SELECT COALESCE(c.nome, 'Sem categoria') AS categoria,
             SUM(CASE WHEN LOWER(m.tipo)='entrada' THEN m.valor ELSE 0 END) AS receita,
             SUM(CASE WHEN LOWER(m.tipo)='saida'   THEN m.valor ELSE 0 END) AS despesa,
             SUM(CASE WHEN LOWER(m.tipo)='entrada' THEN m.valor ELSE 0 END)
             -SUM(CASE WHEN LOWER(m.tipo)='saida'   THEN m.valor ELSE 0 END) AS resultado
      FROM gestaofinanceira.movimentos m
      LEFT JOIN gestaofinanceira.categorias c ON c.id = m.categoria_id
      WHERE m.data::date >= CURRENT_DATE - ($1::int - 1)
      GROUP BY categoria
      ORDER BY resultado DESC
    `;
    try {
      const rows = await runQuery<{ categoria: string | null; receita: string | number | null; despesa: string | number | null; resultado: string | number | null }>(sql, [range]);
      const formatted = rows.map(r => ({ categoria: r.categoria ?? 'Sem categoria', receita: Number(r.receita ?? 0), despesa: Number(r.despesa ?? 0), resultado: Number(r.resultado ?? 0) }));
      return { success: true, message: `Resultado por categoria (${range} dias)`, rows: formatted, sql_query: sql, sql_params: formatSqlParams([range]) };
    } catch (error) {
      console.error('ERRO profitabilityByCategory:', error);
      return { success: false, message: `Erro em resultado por categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
});

export const bankReconciliationStatus = tool({
  description: 'Status de conciliação bancária e diferenças no período',
  inputSchema: z.object({ date_range_days: z.number().default(30), diff_threshold: z.number().default(0) }),
  execute: async ({ date_range_days = 30, diff_threshold = 0 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);
    const timelineSql = `
      SELECT data_extrato::date AS dia,
             COUNT(*) AS total_extratos,
             SUM(COALESCE(saldo_sistema,0) - COALESCE(saldo_extrato,0)) AS diferenca_total
      FROM gestaofinanceira.conciliacao_bancaria
      WHERE data_extrato::date >= CURRENT_DATE - ($1::int - 1)
      GROUP BY dia
      ORDER BY dia
    `;
    const unrecSql = `
      SELECT COUNT(*) AS movimentos_nao_conciliados, SUM(valor) AS valor
      FROM gestaofinanceira.movimentos
      WHERE data::date >= CURRENT_DATE - ($1::int - 1)
        AND (conciliado IS DISTINCT FROM TRUE)
    `;
    try {
      const timeline = await runQuery<{ dia: string; total_extratos: string | number | null; diferenca_total: string | number | null }>(timelineSql, [range]);
      const unrec = (await runQuery<{ movimentos_nao_conciliados: string | number | null; valor: string | number | null }>(unrecSql, [range]))[0] ?? { movimentos_nao_conciliados: 0, valor: 0 };
      const rows = timeline.map(r => ({ dia: r.dia, total_extratos: Number(r.total_extratos ?? 0), diferenca_total: Number(r.diferenca_total ?? 0) }));
      const red_flags: string[] = [];
      const anyOver = rows.some(r => Math.abs(r.diferenca_total) > diff_threshold);
      if (anyOver && diff_threshold > 0) red_flags.push('Diferenças de conciliação acima do threshold');
      const naoConc = Number(unrec.movimentos_nao_conciliados ?? 0);
      if (naoConc > 0) red_flags.push(`${naoConc} movimentos não conciliados`);
      return {
        success: true,
        message: `Conciliação nos últimos ${range} dias`,
        periodo_dias: range,
        rows,
        red_flags,
        nao_conciliados: {
          quantidade: naoConc,
          valor: Number(unrec.valor ?? 0),
        },
        sql_query: timelineSql,
        sql_params: formatSqlParams([range]),
        sql_queries: [
          { name: 'timeline', sql: timelineSql, params: [range] },
          { name: 'nao_conciliados', sql: unrecSql, params: [range] },
        ],
      };
    } catch (error) {
      console.error('ERRO bankReconciliationStatus:', error);
      return { success: false, message: `Erro em conciliação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
});

// === Novas tools: Contas a Pagar e Receber ===

export const situacaoOperacionalContas = tool({
  description: 'Resumo operacional de contas a pagar e a receber no período',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
SELECT
  CASE WHEN tipo = 'pagar' THEN 'Contas a Pagar' ELSE 'Contas a Receber' END AS tipo_conta,
  COUNT(*) AS total,
  SUM(valor) AS valor_total,
  SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) AS valor_pendente,
  SUM(CASE WHEN status IN ('pago','recebido') THEN valor ELSE 0 END) AS valor_pago
FROM (
  SELECT 'pagar' AS tipo, valor, status, data_vencimento
  FROM gestaofinanceira.contas_a_pagar
  WHERE data_vencimento >= $1::date AND data_vencimento < ($2::date + INTERVAL '1 day')
  UNION ALL
  SELECT 'receber', valor, status, data_vencimento
  FROM gestaofinanceira.contas_a_receber
  WHERE data_vencimento >= $1::date AND data_vencimento < ($2::date + INTERVAL '1 day')
) sub
GROUP BY tipo_conta
ORDER BY tipo_conta`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `Situação operacional (${data_de} a ${data_ate})`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO situacaoOperacionalContas:', error);
      return { success: false, message: 'Erro na situação operacional', rows: [], sql_query: sql, sql_params: formatSqlParams(params) };
    }
  },
});

export const alertaAumentoAnormalDespesas = tool({
  description: 'Detecta variações anormais de despesas mensais (contas a pagar)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
WITH mensal AS (
  SELECT
    DATE_TRUNC('month', data_vencimento) AS mes,
    SUM(valor) AS total_despesas
  FROM gestaofinanceira.contas_a_pagar
  WHERE data_vencimento >= $1::date AND data_vencimento < ($2::date + INTERVAL '1 day')
  GROUP BY 1
),
media_geral AS (
  SELECT AVG(total_despesas) AS media_mensal FROM mensal
)
SELECT
  TO_CHAR(m.mes, 'YYYY-MM') AS mes,
  ROUND(m.total_despesas::numeric, 2) AS despesas_mes,
  ROUND(media_geral.media_mensal::numeric, 2) AS media_geral,
  ROUND(((m.total_despesas - media_geral.media_mensal) / NULLIF(media_geral.media_mensal,0)) * 100, 1) AS variacao_pct,
  CASE
    WHEN ((m.total_despesas - media_geral.media_mensal) / NULLIF(media_geral.media_mensal,0)) * 100 > 25 THEN '🚨 Despesa anômala'
    WHEN ((m.total_despesas - media_geral.media_mensal) / NULLIF(media_geral.media_mensal,0)) * 100 > 10 THEN '⚠️ Tendência de aumento'
    ELSE '✅ Normal'
  END AS alerta
FROM mensal m, media_geral
ORDER BY m.mes`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return { success: true, message: `Despesas mensais (${data_de} a ${data_ate})`, rows, count: rows.length, sql_query: sql, sql_params: formatSqlParams(params) };
    } catch (error) {
      console.error('ERRO alertaAumentoAnormalDespesas:', error);
      return { success: false, message: 'Erro no alerta de despesas', rows: [], sql_query: sql, sql_params: formatSqlParams(params) };
    }
  },
});

export const atrasosInadimplencia = tool({
  description: 'Monitoramento de atrasos e inadimplência em pagar/receber',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
SELECT
  'A Pagar' AS tipo,
  COUNT(*) FILTER (WHERE data_pagamento IS NULL AND data_vencimento < CURRENT_DATE) AS qtd_atrasadas,
  ROUND(SUM(valor) FILTER (WHERE data_pagamento IS NULL AND data_vencimento < CURRENT_DATE)::numeric, 2) AS valor_atrasado
FROM gestaofinanceira.contas_a_pagar
WHERE data_vencimento >= $1::date AND data_vencimento < ($2::date + INTERVAL '1 day')

UNION ALL

SELECT
  'A Receber' AS tipo,
  COUNT(*) FILTER (WHERE data_recebimento IS NULL AND data_vencimento < CURRENT_DATE) AS qtd_atrasadas,
  ROUND(SUM(valor) FILTER (WHERE data_recebimento IS NULL AND data_vencimento < CURRENT_DATE)::numeric, 2) AS valor_atrasado
FROM gestaofinanceira.contas_a_receber
WHERE data_vencimento >= $1::date AND data_vencimento < ($2::date + INTERVAL '1 day')`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return { success: true, message: `Atrasos e inadimplência (${data_de} a ${data_ate})`, rows, count: rows.length, sql_query: sql, sql_params: formatSqlParams(params) };
    } catch (error) {
      console.error('ERRO atrasosInadimplencia:', error);
      return { success: false, message: 'Erro no monitoramento de atrasos/inadimplência', rows: [], sql_query: sql, sql_params: formatSqlParams(params) };
    }
  },
});

export const detectFinancialAnomalies = tool({
  description: 'Detecta anomalias em saídas diárias (z-score) e riscos financeiros',
  inputSchema: z.object({ date_range_days: z.number().default(60), sensitivity: z.number().default(2), diff_threshold: z.number().default(1000) }),
  execute: async ({ date_range_days = 60, sensitivity = 2, diff_threshold = 1000 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 7), 365);
    const seriesSql = `
      SELECT data::date AS dia, SUM(valor) AS saidas
      FROM gestaofinanceira.movimentos
      WHERE data::date >= CURRENT_DATE - ($1::int - 1)
        AND LOWER(tipo) = 'saida'
      GROUP BY dia
      ORDER BY dia
    `;
    const negativeSql = `
      SELECT id, nome, saldo
      FROM gestaofinanceira.contas
      WHERE saldo < 0
    `;
    const concDiffSql = `
      SELECT data_extrato, (COALESCE(saldo_sistema,0) - COALESCE(saldo_extrato,0)) AS diferenca
      FROM gestaofinanceira.conciliacao_bancaria
      WHERE ABS(COALESCE(saldo_sistema,0) - COALESCE(saldo_extrato,0)) > $1
    `;
    try {
      const series = await runQuery<{ dia: string; saidas: string | number | null }>(seriesSql, [range]);
      if (!series.length) {
        return { success: false, message: 'Dados insuficientes para anomalias', sql_query: seriesSql, sql_params: formatSqlParams([range]) };
      }
      const values = series.map(r => Number(r.saidas ?? 0));
      const mean = values.reduce((a, v) => a + v, 0) / values.length;
      const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length;
      const dev = Math.sqrt(variance);
      const anomalies = series
        .map(r => {
          const val = Number(r.saidas ?? 0);
          const z = dev > 0 ? (val - mean) / dev : 0;
          if (Math.abs(z) <= sensitivity) return null;
          return { data: r.dia, saidas: val, media: Math.round(mean), z_score: Number(z.toFixed(2)), severidade: Math.abs(z) > sensitivity * 1.5 ? 'CRÍTICA' : 'ALTA' };
        })
        .filter(Boolean);
      const negatives = await runQuery<{ id: string; nome: string | null; saldo: string | number | null }>(negativeSql);
      const concDiffs = await runQuery<{ data_extrato: string; diferenca: string | number | null }>(concDiffSql, [diff_threshold]);
      const red_flags: string[] = [];
      if (negatives.length > 0) red_flags.push(`${negatives.length} conta(s) com saldo negativo`);
      if (concDiffs.length > 0) red_flags.push(`${concDiffs.length} dia(s) com diferença de conciliação > R$ ${diff_threshold}`);
      return {
        success: true,
        message: `${(anomalies as unknown[]).length} anomalias de saída detectadas`,
        periodo_dias: range,
        sensitivity,
        rows: anomalies,
        red_flags,
        sql_query: seriesSql,
        sql_params: formatSqlParams([range]),
        sql_queries: [
          { name: 'series_saidas', sql: seriesSql, params: [range] },
          { name: 'contas_negativas', sql: negativeSql, params: [] },
          { name: 'conc_diffs', sql: concDiffSql, params: [diff_threshold] },
        ],
      };
    } catch (error) {
      console.error('ERRO detectFinancialAnomalies:', error);
      return { success: false, message: `Erro em detecção de anomalias financeiras: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  },
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
