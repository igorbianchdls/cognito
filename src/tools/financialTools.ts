import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

// Normaliza status aceitos pelo schema atual.
// Observação: "vencido" não é valor de coluna; tratamos por regra de data.
const normalizeStatus = (status?: string): string | undefined => {
  if (!status) return undefined;
  const s = status.toLowerCase();
  if (s === 'pendente' || s === 'pago' || s === 'cancelado') return s;
  return undefined;
};

export const getContasAReceber = tool({
  description: 'Busca contas a receber (clientes, receitas) com filtros avançados',
  inputSchema: z.object({
    limit: z.number().default(20).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status do recebimento'),
    cliente_id: z.string().optional()
      .describe('Filtrar por ID do cliente'),
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    data_vencimento_de: z.string().optional()
      .describe('Data inicial de vencimento (formato YYYY-MM-DD)'),
    data_vencimento_ate: z.string().optional()
      .describe('Data final de vencimento (formato YYYY-MM-DD)'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    limit = 20,
    status,
    cliente_id,
    vence_em_dias,
    venceu_ha_dias,
    data_vencimento_de,
    data_vencimento_ate,
    valor_minimo,
    valor_maximo,
    data_emissao_de,
    data_emissao_ate,
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

      // Base no schema unificado
      conditions.push(`lf.tipo = 'conta_a_receber'`);

      // Status: tratar "vencido" por regra de data
      if (status) {
        const s = status.toLowerCase();
        if (s === 'vencido' || s === 'atrasado') {
          conditions.push(`LOWER(lf.status) = 'pendente'`);
          conditions.push(`lf.data_vencimento < CURRENT_DATE`);
        } else {
          const norm = normalizeStatus(s);
          if (norm) push('LOWER(lf.status) =', norm);
        }
      }
      if (cliente_id) push('lf.entidade_id =', cliente_id);
      if (valor_minimo !== undefined) push('lf.valor >=', valor_minimo);
      if (valor_maximo !== undefined) push('lf.valor <=', valor_maximo);

      if (vence_em_dias !== undefined) {
        conditions.push(`lf.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${index}::int) * INTERVAL '1 day'`);
        params.push(vence_em_dias);
        index += 1;
      }

      if (venceu_ha_dias !== undefined) {
        conditions.push(`lf.data_vencimento BETWEEN CURRENT_DATE - ($${index}::int) * INTERVAL '1 day' AND CURRENT_DATE - INTERVAL '1 day'`);
        params.push(venceu_ha_dias);
        index += 1;
      }

      if (data_vencimento_de) push('lf.data_vencimento >=', data_vencimento_de);
      if (data_vencimento_ate) push('lf.data_vencimento <=', data_vencimento_ate);

      if (data_emissao_de) push('lf.data_lancamento >=', data_emissao_de);
      if (data_emissao_ate) push('lf.data_lancamento <=', data_emissao_ate);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const listSql = `
        SELECT
          lf.id,
          e.nome AS cliente,
          lf.descricao,
          lf.valor AS valor_total,
          lf.data_lancamento AS data_emissao,
          lf.data_vencimento,
          NULL::date AS data_recebimento,
          lf.status,
          lf.criado_em
        FROM financeiro.lancamentos_financeiros AS lf
        LEFT JOIN entidades.clientes AS e ON e.id = lf.entidade_id
        LEFT JOIN administrativo.categorias_financeiras cf ON cf.id = lf.categoria_id
        ${whereClause}
        ORDER BY lf.data_vencimento ASC
        LIMIT $${index}
      `.trim();

      const paramsWithLimit = [...params, limit];

      const totalsSql = `
        SELECT
          SUM(lf.valor) AS total_valor,
          COUNT(*) AS total_registros
        FROM financeiro.lancamentos_financeiros AS lf
        LEFT JOIN entidades.clientes AS e ON e.id = lf.entidade_id
        LEFT JOIN administrativo.categorias_financeiras cf ON cf.id = lf.categoria_id
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
        message: `Encontradas ${count} contas a receber (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${totalsSql}`,
        sql_params: formatSqlParams(paramsWithLimit),
      };
    } catch (error) {
      console.error('ERRO getContasAReceber:', error);
      return {
        success: false,
        rows: [],
        message: `Erro ao buscar contas a receber: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
});

export const getPagamentosRecebidos = tool({
  description: 'Busca pagamentos já recebidos (contas a receber pagas) com filtros avançados',
  inputSchema: z.object({
    limit: z.number().default(20).describe('Número máximo de resultados'),
    cliente_id: z.string().optional()
      .describe('Filtrar por ID do cliente'),
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    data_vencimento_de: z.string().optional()
      .describe('Data inicial de vencimento (formato YYYY-MM-DD)'),
    data_vencimento_ate: z.string().optional()
      .describe('Data final de vencimento (formato YYYY-MM-DD)'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    limit = 20,
    cliente_id,
    vence_em_dias,
    venceu_ha_dias,
    data_vencimento_de,
    data_vencimento_ate,
    valor_minimo,
    valor_maximo,
    data_emissao_de,
    data_emissao_ate,
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

      // Base no schema unificado
      conditions.push(`pr.tipo = 'pagamento_recebido'`);

      if (cliente_id) push('pr.entidade_id =', cliente_id);
      if (valor_minimo !== undefined) push('pr.valor >=', valor_minimo);
      if (valor_maximo !== undefined) push('pr.valor <=', valor_maximo);

      // Para pagamentos recebidos, considerar janelas sobre a data de lançamento (pagamento)
      if (vence_em_dias !== undefined) {
        conditions.push(`pr.data_lancamento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${index}::int) * INTERVAL '1 day'`);
        params.push(vence_em_dias);
        index += 1;
      }

      if (venceu_ha_dias !== undefined) {
        conditions.push(`pr.data_lancamento BETWEEN CURRENT_DATE - ($${index}::int) * INTERVAL '1 day' AND CURRENT_DATE - INTERVAL '1 day'`);
        params.push(venceu_ha_dias);
        index += 1;
      }

      // Manter compatibilidade dos nomes dos filtros
      if (data_vencimento_de) push('pr.data_lancamento >=', data_vencimento_de);
      if (data_vencimento_ate) push('pr.data_lancamento <=', data_vencimento_ate);

      if (data_emissao_de) push('pr.data_lancamento >=', data_emissao_de);
      if (data_emissao_ate) push('pr.data_lancamento <=', data_emissao_ate);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const listSql = `
        SELECT
          pr.id,
          ent.nome AS cliente,
          pr.descricao,
          pr.valor AS valor_total,
          pr.data_vencimento,
          pr.data_lancamento AS data_recebimento,
          pr.status
        FROM financeiro.lancamentos_financeiros AS pr
        LEFT JOIN entidades.clientes AS ent ON ent.id = pr.entidade_id
        LEFT JOIN administrativo.categorias_financeiras cat ON cat.id = pr.categoria_id
        LEFT JOIN financeiro.contas_financeiras cf ON cf.id = pr.conta_financeira_id
        ${whereClause}
        ORDER BY pr.data_lancamento DESC
        LIMIT $${index}
      `.trim();

      const paramsWithLimit = [...params, limit];

      const totalsSql = `
        SELECT
          SUM(pr.valor) AS total_valor,
          COUNT(*) AS total_registros
        FROM financeiro.lancamentos_financeiros AS pr
        LEFT JOIN entidades.clientes AS ent ON ent.id = pr.entidade_id
        LEFT JOIN administrativo.categorias_financeiras cat ON cat.id = pr.categoria_id
        LEFT JOIN financeiro.contas_financeiras cf ON cf.id = pr.conta_financeira_id
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
        message: `Encontrados ${count} pagamentos recebidos (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${totalsSql}`,
        sql_params: formatSqlParams(paramsWithLimit),
      };
    } catch (error) {
      console.error('ERRO getPagamentosRecebidos:', error);
      return {
        success: false,
        rows: [],
        message: `Erro ao buscar pagamentos recebidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
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
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    data_vencimento_de: z.string().optional()
      .describe('Data inicial de vencimento (formato YYYY-MM-DD)'),
    data_vencimento_ate: z.string().optional()
      .describe('Data final de vencimento (formato YYYY-MM-DD)'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
  }),

  execute: async ({
    limit = 20,
    status,
    fornecedor_id,
    vence_em_dias,
    venceu_ha_dias,
    data_vencimento_de,
    data_vencimento_ate,
    data_emissao_de,
    data_emissao_ate,
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

      // Base no schema unificado
      conditions.push(`lf.tipo = 'conta_a_pagar'`);

      if (status) {
        const s = status.toLowerCase();
        if (s === 'vencido' || s === 'atrasado') {
          conditions.push(`LOWER(lf.status) = 'pendente'`);
          conditions.push(`lf.data_vencimento < CURRENT_DATE`);
        } else {
          const norm = normalizeStatus(s);
          if (norm) push('LOWER(lf.status) =', norm);
        }
      }
      if (fornecedor_id) push('lf.entidade_id =', fornecedor_id);
      if (valor_minimo !== undefined) push('lf.valor >=', valor_minimo);
      if (valor_maximo !== undefined) push('lf.valor <=', valor_maximo);

      if (vence_em_dias !== undefined) {
        conditions.push(`lf.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${index}::int) * INTERVAL '1 day'`);
        params.push(vence_em_dias);
        index += 1;
      }

      if (venceu_ha_dias !== undefined) {
        conditions.push(`lf.data_vencimento BETWEEN CURRENT_DATE - ($${index}::int) * INTERVAL '1 day' AND CURRENT_DATE - INTERVAL '1 day'`);
        params.push(venceu_ha_dias);
        index += 1;
      }

      if (data_vencimento_de) push('lf.data_vencimento >=', data_vencimento_de);
      if (data_vencimento_ate) push('lf.data_vencimento <=', data_vencimento_ate);

      if (data_emissao_de) push('lf.data_lancamento >=', data_emissao_de);
      if (data_emissao_ate) push('lf.data_lancamento <=', data_emissao_ate);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const listSql = `
        SELECT
          lf.id,
          f.nome AS fornecedor,
          lf.descricao,
          lf.valor AS valor_total,
          lf.data_lancamento AS data_emissao,
          lf.data_vencimento,
          NULL::date AS data_pagamento,
          lf.status,
          lf.criado_em
        FROM financeiro.lancamentos_financeiros AS lf
        LEFT JOIN entidades.fornecedores AS f ON f.id = lf.entidade_id
        LEFT JOIN administrativo.categorias_financeiras cf ON cf.id = lf.categoria_id
        ${whereClause}
        ORDER BY lf.data_vencimento ASC
        LIMIT $${index}
      `.trim();

      const paramsWithLimit = [...params, limit];

      const totalsSql = `
        SELECT
          SUM(lf.valor) AS total_valor,
          COUNT(*) AS total_registros
        FROM financeiro.lancamentos_financeiros AS lf
        LEFT JOIN entidades.fornecedores AS f ON f.id = lf.entidade_id
        LEFT JOIN administrativo.categorias_financeiras cf ON cf.id = lf.categoria_id
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
        message: `Encontradas ${count} contas a pagar (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${totalsSql}`,
        sql_params: formatSqlParams(paramsWithLimit),
      };
    } catch (error) {
      console.error('ERRO getContasAPagar:', error);
      return {
        success: false,
        rows: [],
        message: `Erro ao buscar contas a pagar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
});

export const getPagamentosEfetuados = tool({
  description: 'Busca pagamentos já efetuados (contas a pagar pagas) com filtros avançados',
  inputSchema: z.object({
    limit: z.number().default(20).describe('Número máximo de resultados'),
    fornecedor_id: z.string().optional()
      .describe('Filtrar por ID do fornecedor'),
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    data_vencimento_de: z.string().optional()
      .describe('Data inicial de vencimento (formato YYYY-MM-DD)'),
    data_vencimento_ate: z.string().optional()
      .describe('Data final de vencimento (formato YYYY-MM-DD)'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
  }),

  execute: async ({
    limit = 20,
    fornecedor_id,
    vence_em_dias,
    venceu_ha_dias,
    data_vencimento_de,
    data_vencimento_ate,
    data_emissao_de,
    data_emissao_ate,
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

      // Base no schema unificado
      conditions.push(`pe.tipo = 'pagamento_efetuado'`);

      if (fornecedor_id) push('pe.entidade_id =', fornecedor_id);
      if (valor_minimo !== undefined) push('pe.valor >=', valor_minimo);
      if (valor_maximo !== undefined) push('pe.valor <=', valor_maximo);

      if (vence_em_dias !== undefined) {
        conditions.push(`pe.data_lancamento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${index}::int) * INTERVAL '1 day'`);
        params.push(vence_em_dias);
        index += 1;
      }

      if (venceu_ha_dias !== undefined) {
        conditions.push(`pe.data_lancamento BETWEEN CURRENT_DATE - ($${index}::int) * INTERVAL '1 day' AND CURRENT_DATE - INTERVAL '1 day'`);
        params.push(venceu_ha_dias);
        index += 1;
      }

      if (data_vencimento_de) push('pe.data_lancamento >=', data_vencimento_de);
      if (data_vencimento_ate) push('pe.data_lancamento <=', data_vencimento_ate);

      if (data_emissao_de) push('pe.data_lancamento >=', data_emissao_de);
      if (data_emissao_ate) push('pe.data_lancamento <=', data_emissao_ate);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const listSql = `
        SELECT
          pe.id,
          f.nome AS fornecedor,
          pe.descricao,
          pe.valor AS valor_total,
          pe.data_lancamento AS data_pagamento,
          pe.data_vencimento,
          pe.status
        FROM financeiro.lancamentos_financeiros AS pe
        LEFT JOIN entidades.fornecedores AS f ON f.id = pe.entidade_id
        LEFT JOIN administrativo.categorias_financeiras cat ON cat.id = pe.categoria_id
        LEFT JOIN financeiro.contas_financeiras cf ON cf.id = pe.conta_financeira_id
        ${whereClause}
        ORDER BY pe.data_lancamento DESC
        LIMIT $${index}
      `.trim();

      const paramsWithLimit = [...params, limit];

      const totalsSql = `
        SELECT
          SUM(pe.valor) AS total_valor,
          COUNT(*) AS total_registros
        FROM financeiro.lancamentos_financeiros AS pe
        LEFT JOIN entidades.fornecedores AS f ON f.id = pe.entidade_id
        LEFT JOIN administrativo.categorias_financeiras cat ON cat.id = pe.categoria_id
        LEFT JOIN financeiro.contas_financeiras cf ON cf.id = pe.conta_financeira_id
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
        message: `Encontrados ${count} pagamentos efetuados (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${totalsSql}`,
        sql_params: formatSqlParams(paramsWithLimit),
      };
    } catch (error) {
      console.error('ERRO getPagamentosEfetuados:', error);
      return {
        success: false,
        rows: [],
        message: `Erro ao buscar pagamentos efetuados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
});

// ============================================================================
// FLUXO DE CAIXA
// ============================================================================

const normalizePeriodo = (dias: number) => {
  const allowed = [7, 30, 90];
  if (allowed.includes(dias)) return dias;
  if (dias < 7) return 7;
  if (dias > 90) return 90;
  // fallback para o mais próximo
  return allowed.reduce((prev, curr) =>
    Math.abs(curr - dias) < Math.abs(prev - dias) ? curr : prev,
  30);
};

export const calcularFluxoCaixa = tool({
  description: 'Calcula fluxo de caixa diário (saldo inicial por contas + movimentos) entre um período informado.',
  inputSchema: z.object({
    data_inicial: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().optional().describe('Data final exclusiva (YYYY-MM-DD)'),
    dias: z.number().optional().describe('Período em dias (fallback quando datas não são fornecidas)'),
    saldo_inicial: z.number().optional().describe('Ignorado; saldo inicial é calculado do banco'),
  }),
  execute: async ({ data_inicial, data_final, dias, saldo_inicial: _ignored }) => {
    try {
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const addDays = (d: Date, n: number) => {
        const c = new Date(d.getTime());
        c.setDate(c.getDate() + n);
        return c;
      };

      let startDate: string;
      let endDate: string;
      if (data_inicial && data_final) {
        startDate = data_inicial;
        endDate = data_final;
      } else {
        const baseDias = normalizePeriodo(typeof dias === 'number' ? dias : 30);
        const today = new Date();
        startDate = fmt(today);
        endDate = fmt(addDays(today, baseDias));
      }

      const fluxoSql = `
        WITH params AS (
          SELECT $1::date AS start_date, $2::date AS end_date
        ),
        latest_base AS (
          SELECT sb.conta_id, sb.data_base, sb.saldo_base
          FROM gestaofinanceira.saldos_base sb
          JOIN (
            SELECT conta_id, MAX(data_base) AS data_base
            FROM gestaofinanceira.saldos_base, params p
            WHERE data_base <= p.start_date
            GROUP BY conta_id
          ) mx USING (conta_id, data_base)
        ),
        saldo_inicial_por_conta AS (
          SELECT
            lb.conta_id,
            lb.saldo_base
            + COALESCE((
                SELECT SUM(m.valor)
                FROM gestaofinanceira.movimentos m, params p
                WHERE m.conta_id = lb.conta_id
                  AND m.data > lb.data_base
                  AND m.data < p.start_date
              ), 0) AS saldo_inicial
          FROM latest_base lb
        ),
        saldo_inicial_total AS (
          SELECT COALESCE(SUM(saldo_inicial), 0) AS saldo_inicial
          FROM saldo_inicial_por_conta
        ),
        movs_mes AS (
          SELECT
            m.data::date AS data,
            SUM(CASE WHEN m.valor > 0 THEN m.valor ELSE 0 END) AS entradas,
            SUM(CASE WHEN m.valor < 0 THEN m.valor ELSE 0 END) AS saidas
          FROM gestaofinanceira.movimentos m, params p
          WHERE m.data >= p.start_date
            AND m.data <  p.end_date
          GROUP BY m.data::date
        ),
        fluxo AS (
          SELECT
            data,
            entradas,
            saidas,
            (COALESCE(entradas,0) + COALESCE(saidas,0)) AS saldo_dia
          FROM movs_mes
        )
        SELECT
          p.start_date AS data,
          0::numeric    AS entradas,
          0::numeric    AS saidas,
          0::numeric    AS saldo_dia,
          sit.saldo_inicial AS saldo_acumulado
        FROM params p
        CROSS JOIN saldo_inicial_total sit
        UNION ALL
        SELECT
          f.data,
          f.entradas,
          f.saidas,
          f.saldo_dia,
          sit.saldo_inicial + SUM(f.saldo_dia) OVER (ORDER BY f.data) AS saldo_acumulado
        FROM fluxo f
        CROSS JOIN saldo_inicial_total sit
        ORDER BY data
      `.trim();

      type TimeseriesRow = {
        data: string;
        entradas: number | null;
        saidas: number | null;
        saldo_dia: number | null;
        saldo_acumulado: number | null;
      };

      const timeseries = await runQuery<TimeseriesRow>(fluxoSql, [startDate, endDate]);

      const saldoInicial = Number(timeseries[0]?.saldo_acumulado ?? 0);
      const totalEntradas = timeseries.reduce((s, r) => s + Number(r.entradas ?? 0), 0);
      const totalSaidasAbs = timeseries.reduce((s, r) => s + Math.abs(Number(r.saidas ?? 0)), 0);
      const saldoProjetado = Number(timeseries[timeseries.length - 1]?.saldo_acumulado ?? saldoInicial);

      const rows = [
        { categoria: 'Saldo inicial', origem: 'saldos_base+movimentos', valor: saldoInicial },
        { categoria: 'Entradas no período', origem: 'movimentos', valor: totalEntradas },
        { categoria: 'Saídas no período', origem: 'movimentos', valor: totalSaidasAbs },
        { categoria: 'Saldo projetado', origem: 'acumulado', valor: saldoProjetado },
      ];

      const diffDays = Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));

      return {
        success: true,
        periodo_dias: diffDays,
        saldo_inicial: saldoInicial,
        rows,
        timeseries,
        summary: {
          entradas_previstas: totalEntradas,
          saidas_previstas: totalSaidasAbs,
          saldo_projetado: saldoProjetado,
          entradas_vencidas: 0,
          saidas_vencidas: 0,
        },
        sql_query: fluxoSql,
        sql_params: formatSqlParams([startDate, endDate]),
      };
    } catch (error) {
      console.error('ERRO calcularFluxoCaixa:', error);
      return {
        success: false,
        message: `Erro ao calcular fluxo de caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

// ============================================================================
// MOVIMENTOS FINANCEIROS
// ============================================================================

export const analisarReceitasPorCentroCusto = tool({
  description: 'Analisa receitas agrupadas por centro de lucro com totais e período de receitas',
  inputSchema: z.object({
    limit: z.number().default(100).describe('Número máximo de centros de lucro'),
  }),
  execute: async ({
    limit,
  }) => {
    try {
      const params: unknown[] = [limit];

      const sql = `
        SELECT
          cl.nome AS centro_lucro,
          SUM(car.valor_total) AS total_receitas,
          COUNT(car.id) AS qtd_titulos,
          MIN(car.data_vencimento) AS primeira_receita,
          MAX(car.data_vencimento) AS ultima_receita
        FROM financeiro.contas_a_receber car
        LEFT JOIN financeiro.centros_lucro cl ON cl.id = car.centro_lucro_id
        WHERE car.status IN ('pago', 'parcial')
        GROUP BY cl.nome
        ORDER BY total_receitas DESC
        LIMIT $1
      `.trim();

      const rows = await runQuery<Record<string, unknown>>(sql, params);

      const totalSql = `
        SELECT
          SUM(valor_total) AS total_geral,
          COUNT(*) AS total_titulos
        FROM financeiro.contas_a_receber
        WHERE status IN ('pago', 'parcial')
      `.trim();

      const [totals] = await runQuery<{
        total_geral: number | null;
        total_titulos: number | null;
      }>(totalSql, []);

      const totalGeral = Number(totals?.total_geral ?? 0);

      return {
        success: true,
        rows,
        count: rows.length,
        totals: {
          total_geral: totalGeral,
          total_titulos: Number(totals?.total_titulos ?? 0),
        },
        message: `${rows.length} centros de lucro encontrados (Total: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${sql}\n\n-- Totais\n${totalSql}`,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO analisarReceitasPorCentroCusto:', error);
      return {
        success: false,
        message: `Erro ao analisar receitas por centro de lucro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
        count: 0,
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
    conta_a_pagar_id: z.string().optional().describe('Vínculo com conta a pagar'),
    conta_a_receber_id: z.string().optional().describe('Vínculo com conta a receber'),
  }),
  execute: async ({
    conta_id,
    tipo,
    valor,
    data,
    categoria_id,
    conta_a_pagar_id,
    conta_a_receber_id,
  }) => {
    try {
      if (conta_a_pagar_id && conta_a_receber_id) {
        throw new Error('O movimento não pode referenciar conta a pagar e a receber ao mesmo tempo');
      }

      // Convert tipo to signed valor: entrada = positive, saída = negative
      const valorSigned = tipo === 'entrada' ? valor : -valor;

      const insertSql = `
        INSERT INTO gestaofinanceira.movimentos
          (conta_id, categoria_id, valor, data, conta_a_pagar_id, conta_a_receber_id)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `.trim();

      const [movimento] = await runQuery<{
        id: string;
        conta_id: string;
        categoria_id: string | null;
        valor: number;
        data: string;
        conta_a_pagar_id: string | null;
        conta_a_receber_id: string | null;
        created_at: string | null;
      }>(insertSql, [
        conta_id,
        categoria_id ?? null,
        valorSigned,
        data,
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
          valorSigned,
          data,
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

// ============================================================================
// ANÁLISE DE INADIMPLÊNCIA
// ============================================================================

export const analisarInadimplencia = tool({
  description: 'Analisa inadimplência de contas a receber e a pagar por faixas de atraso (aging)',
  inputSchema: z.object({
    tipo: z.enum(['receber', 'pagar', 'ambos']).default('ambos')
      .describe('Tipo de análise: contas a receber, a pagar ou ambos'),
  }),
  execute: async ({ tipo }) => {
    try {
      const sql = `
        WITH base_receber AS (
          SELECT
            id,
            cliente_id,
            valor,
            data_vencimento::date AS venc,
            'A Receber' AS tipo_conta
          FROM gestaofinanceira.contas_a_receber
          WHERE status = 'Pendente'
        ),
        base_pagar AS (
          SELECT
            id,
            fornecedor_id,
            valor,
            data_vencimento::date AS venc,
            'A Pagar' AS tipo_conta
          FROM gestaofinanceira.contas_a_pagar
          WHERE status = 'Pendente'
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
          SUM(CASE WHEN status = 'Pendente' THEN valor ELSE 0 END) AS total_inadimplencia,
          COUNT(CASE WHEN status = 'Pendente' AND data_vencimento < CURRENT_DATE THEN 1 END) AS total_vencidas
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

// ============================================================================
// TRANSAÇÕES E EXTRATO
// ============================================================================

export const getTransacoesExtrato = tool({
  description: 'Consulta transações bancárias e extratos do sistema financeiro',
  inputSchema: z.object({
    limit: z.number().default(50).describe('Número máximo de resultados'),
    data_inicial: z.string().optional().describe('Data inicial do extrato (YYYY-MM-DD)'),
    data_final: z.string().optional().describe('Data final do extrato (YYYY-MM-DD)'),
    tipo: z.string().optional().describe('Filtrar por tipo de transação'),
    conciliado: z.boolean().optional().describe('Filtrar por status de conciliação'),
    conta_id: z.string().optional().describe('Filtrar por ID da conta bancária'),
    origem: z.string().optional().describe('Filtrar por origem da transação'),
  }),
  execute: async ({
    limit = 50,
    data_inicial,
    data_final,
    tipo,
    conciliado,
    conta_id,
    origem,
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

      // Filtros por data do extrato
      if (data_inicial) pushCondition('e.data_extrato >=', data_inicial);
      if (data_final) pushCondition('e.data_extrato <=', data_final);

      // Filtros da transação
      if (tipo) pushCondition('t.tipo =', tipo);
      if (conciliado !== undefined) pushCondition('t.conciliado =', conciliado);
      if (origem) pushCondition('t.origem =', origem);

      // Filtro por conta
      if (conta_id) pushCondition('e.conta_id =', conta_id);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const sql = `
        SELECT
          t.id AS transacao_id,
          e.id AS extrato_id,
          c.nome_conta AS conta,
          e.data_extrato,
          t.data_transacao,
          t.tipo,
          t.descricao,
          t.valor,
          t.origem,
          t.conciliado,
          e.saldo_inicial,
          e.total_creditos,
          e.total_debitos,
          e.saldo_final,
          e.status AS status_extrato,
          t.criado_em
        FROM financeiro.transacoes_bancarias t
        LEFT JOIN financeiro.extratos_bancarios e
          ON e.id = t.extrato_id
        LEFT JOIN financeiro.contas c
          ON c.id = e.conta_id
        ${whereClause}
        ORDER BY e.data_extrato NULLS LAST, t.data_transacao, t.id
        LIMIT $${paramIndex}
      `.trim();

      const paramsWithLimit = [...params, limit];

      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit);

      const totalValor = rows.reduce((sum, row) => sum + Number(row.valor || 0), 0);

      return {
        success: true,
        rows,
        count: rows.length,
        total_valor: totalValor,
        message: `Encontradas ${rows.length} transações (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: sql,
        sql_params: formatSqlParams(paramsWithLimit),
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

// ============================================================================
// SALDOS BANCÁRIOS
// ============================================================================

export const obterSaldoBancario = tool({
  description: 'Obtém saldos atuais (as-of) por conta a partir de saldos_base + movimentos, com linha TOTAL.',
  inputSchema: z.object({
    asof: z.string().optional().describe('Data de referência (YYYY-MM-DD). Default: hoje'),
    incluir_inativas: z.boolean().default(false).describe('Incluir contas inativas'),
    tipo_conta: z.string().optional().describe('Filtrar por tipo de conta (corrente, poupança, etc)'),
  }),
  execute: async ({
    asof,
    incluir_inativas,
    tipo_conta,
  }) => {
    try {
      const params: unknown[] = [];
      let paramIndex = 1;

      // As-of date (obrigatório no SQL, default hoje)
      const asOfDate = asof ?? new Date().toISOString().slice(0, 10);
      params.push(asOfDate);
      paramIndex += 1; // $1 consumido por asof

      // Condições para contas (aplicadas dentro de saldo_por_conta)
      const contaConds: string[] = [];
      if (!incluir_inativas) {
        contaConds.push('c.ativa = TRUE');
      }
      if (tipo_conta) {
        contaConds.push(`c.tipo = $${paramIndex}`);
        params.push(tipo_conta);
        paramIndex += 1;
      }
      const whereContas = contaConds.length ? `WHERE ${contaConds.join(' AND ')}` : '';

      const sql = `
        WITH params AS (
          SELECT $1::date AS asof
        ),
        latest_base AS (
          SELECT sb.conta_id, sb.data_base, sb.saldo_base
          FROM gestaofinanceira.saldos_base sb
          JOIN (
            SELECT conta_id, MAX(data_base) AS data_base
            FROM gestaofinanceira.saldos_base, params p
            WHERE data_base <= p.asof
            GROUP BY conta_id
          ) mx USING (conta_id, data_base)
        ),
        saldo_por_conta AS (
          SELECT
            c.nome AS nome,
            COALESCE(lb.saldo_base, 0)
            + COALESCE((
                SELECT SUM(m.valor)
                FROM gestaofinanceira.movimentos m, params p
                WHERE m.conta_id = c.id
                  AND (lb.data_base IS NULL OR m.data > lb.data_base)
                  AND m.data <= p.asof
              ), 0) AS saldo
          FROM gestaofinanceira.contas c
          LEFT JOIN latest_base lb ON lb.conta_id = c.id
          ${whereContas}
        )
        SELECT
          COALESCE(spc.nome, 'TOTAL') AS nome,
          SUM(spc.saldo)              AS saldo,
          p.asof                      AS data_referencia
        FROM saldo_por_conta spc
        CROSS JOIN params p
        GROUP BY ROLLUP (spc.nome), p.asof
        ORDER BY CASE WHEN COALESCE(spc.nome, 'TOTAL') = 'TOTAL' THEN 1 ELSE 0 END,
                 spc.nome
      `.trim();

      const rowsAll = await runQuery<{
        nome: string | null;
        saldo: number | null;
        data_referencia: string;
      }>(sql, params);

      // Separar linha TOTAL e linhas por conta
      const totalRow = rowsAll.find(r => (r.nome ?? 'TOTAL') === 'TOTAL');
      const rows = rowsAll.filter(r => (r.nome ?? 'TOTAL') !== 'TOTAL');

      const saldoTotal = Number(totalRow?.saldo ?? 0);
      const saldoPositivo = rows.reduce((s, r) => s + (Number(r.saldo ?? 0) > 0 ? Number(r.saldo ?? 0) : 0), 0);
      const saldoNegativo = rows.reduce((s, r) => s + (Number(r.saldo ?? 0) < 0 ? Number(r.saldo ?? 0) : 0), 0);

      return {
        success: true,
        rows,
        count: rows.length,
        totals: {
          saldo_total: saldoTotal,
          saldo_positivo: saldoPositivo,
          saldo_negativo: saldoNegativo,
          total_contas: rows.length,
        },
        message: `${rows.length} contas bancárias (Saldo total: ${saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: sql,
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

// ============================================================================
// DESPESAS POR CENTRO DE CUSTO
// ============================================================================

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

      const sql = `
        SELECT
          cc.id AS centro_custo_id,
          cc.nome AS centro_custo,
          cc.codigo,
          COUNT(cap.id) AS qtd_titulos,
          SUM(cap.valor_total) AS total_despesas,
          ROUND(
            (SUM(cap.valor_total) * 100.0 / NULLIF(
              (SELECT SUM(valor_total) FROM financeiro.contas_a_pagar
               WHERE data_vencimento >= $1 AND data_vencimento <= $2
               AND status IN ('pago', 'parcial')),
              0
            )),
            2
          ) AS percentual
        FROM financeiro.centros_custo cc
        LEFT JOIN financeiro.contas_a_pagar cap
          ON cap.centro_custo_id = cc.id
          AND cap.data_vencimento >= $1 AND cap.data_vencimento <= $2
          AND cap.status IN ('pago', 'parcial')
        GROUP BY cc.id, cc.nome, cc.codigo
        HAVING SUM(cap.valor_total) > 0
        ORDER BY total_despesas DESC
        LIMIT $3
      `.trim();

      const rows = await runQuery<Record<string, unknown>>(sql, params);

      const totalSql = `
        SELECT
          SUM(valor_total) AS total_geral,
          COUNT(*) AS total_despesas
        FROM financeiro.contas_a_pagar
        WHERE data_vencimento >= $1 AND data_vencimento <= $2
        AND status IN ('pago', 'parcial')
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

// ============================================================================
// ANÁLISE DE DESPESAS POR CATEGORIA
// ============================================================================

export const analisarDespesasPorCategoria = tool({
  description: 'Analisa receitas agrupadas por categoria com totais e detalhamento',
  inputSchema: z.object({
    limit: z.number().default(100).describe('Número máximo de resultados'),
  }),
  execute: async ({
    limit,
  }) => {
    try {
      const params: unknown[] = [limit];

      const sql = `
        SELECT
          cat.nome AS categoria_receita,
          SUM(car.valor_total) AS total_receitas,
          COUNT(car.id) AS qtd_titulos
        FROM financeiro.contas_a_receber car
        LEFT JOIN financeiro.categorias cat ON cat.id = car.categoria_receita_id
        WHERE car.status IN ('pago', 'parcial')
        GROUP BY cat.nome
        ORDER BY total_receitas DESC
        LIMIT $1
      `.trim();

      const rows = await runQuery<Record<string, unknown>>(sql, params);

      const totalSql = `
        SELECT
          SUM(valor_total) AS total_geral,
          COUNT(*) AS total_titulos
        FROM financeiro.contas_a_receber
        WHERE status IN ('pago', 'parcial')
      `.trim();

      const [totals] = await runQuery<{
        total_geral: number | null;
        total_titulos: number | null;
      }>(totalSql, []);

      const totalGeral = Number(totals?.total_geral ?? 0);

      return {
        success: true,
        rows,
        count: rows.length,
        totals: {
          total_geral: totalGeral,
          total_titulos: Number(totals?.total_titulos ?? 0),
        },
        message: `${rows.length} categorias encontradas (Total: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${sql}\n\n-- Totais\n${totalSql}`,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO analisarDespesasPorCategoria:', error);
      return {
        success: false,
        message: `Erro ao analisar receitas por categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
        count: 0,
      };
    }
  },
});

// ============================================================================
// MOVIMENTOS POR CENTRO DE CUSTO (por período)
// ============================================================================

export const analisarMovimentosPorCentroCusto = tool({
  description: 'Analisa movimentos efetivados agrupados por centro de custo e categoria no período informado',
  inputSchema: z.object({
    data_inicial: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().describe('Data final exclusiva (YYYY-MM-DD)'),
    limit: z.number().default(100).describe('Número máximo de linhas agregadas'),
  }),
  execute: async ({ data_inicial, data_final, limit }) => {
    try {
      const sql = `
        WITH base AS (
          SELECT
            COALESCE(cc.nome, '— sem CC —') AS centro_custo,
            COALESCE(cat.nome, 'Sem categoria') AS categoria,
            'Receita' AS tipo_categoria,
            SUM(m.valor) AS total
          FROM gestaofinanceira.movimentos m
          LEFT JOIN gestaofinanceira.centros_custo cc ON cc.id = m.centro_custo_id
          LEFT JOIN gestaofinanceira.categorias cat ON cat.id = m.categoria_id
          WHERE m.data >= $1::date AND m.data < $2::date
            AND m.valor > 0
          GROUP BY COALESCE(cc.nome, '— sem CC —'), COALESCE(cat.nome, 'Sem categoria')
          UNION ALL
          SELECT
            COALESCE(cc.nome, '— sem CC —') AS centro_custo,
            COALESCE(cat.nome, 'Sem categoria') AS categoria,
            'Despesa' AS tipo_categoria,
            SUM(ABS(m.valor)) AS total
          FROM gestaofinanceira.movimentos m
          LEFT JOIN gestaofinanceira.centros_custo cc ON cc.id = m.centro_custo_id
          LEFT JOIN gestaofinanceira.categorias cat ON cat.id = m.categoria_id
          WHERE m.data >= $1::date AND m.data < $2::date
            AND m.valor < 0
          GROUP BY COALESCE(cc.nome, '— sem CC —'), COALESCE(cat.nome, 'Sem categoria')
        )
        SELECT * FROM base
        ORDER BY total DESC
        LIMIT $3::int
      `.trim();

      const rows = await runQuery<{
        centro_custo: string;
        categoria: string;
        tipo_categoria: 'Receita' | 'Despesa';
        total: number;
      }>(sql, [data_inicial, data_final, limit]);

      // Totais consolidados
      const totalEntradas = rows
        .filter(r => r.tipo_categoria === 'Receita')
        .reduce((s, r) => s + Number(r.total || 0), 0);
      const totalSaidas = rows
        .filter(r => r.tipo_categoria === 'Despesa')
        .reduce((s, r) => s + Number(r.total || 0), 0);

      return {
        success: true,
        rows,
        count: rows.length,
        totals: {
          total_entradas: totalEntradas,
          total_saidas: totalSaidas,
          saldo_liquido: totalEntradas - totalSaidas,
          total_linhas: rows.length,
        },
        periodo: { data_inicial, data_final },
        message: `${rows.length} agrupamentos por CC e categoria (${data_inicial} a ${data_final})`,
        sql_query: sql,
        sql_params: formatSqlParams([data_inicial, data_final, limit]),
      };
    } catch (error) {
      console.error('ERRO analisarMovimentosPorCentroCusto:', error);
      return {
        success: false,
        rows: [],
        count: 0,
        message: `Erro ao analisar movimentos por centro de custo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

// ============================================================================
// LISTAR MOVIMENTOS (por período)
// ============================================================================

export const getMovimentos = tool({
  description: 'Busca movimentos financeiros efetivados (entradas/saídas) com filtros por período, conta, categoria e valor',
  inputSchema: z.object({
    limit: z.number().default(50).describe('Número máximo de resultados'),
    conta_id: z.string().optional().describe('Filtrar por conta'),
    tipo: z.enum(['entrada', 'saída']).optional().describe('Tipo de movimento'),
    data_inicial: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().optional().describe('Data final (YYYY-MM-DD)'),
    categoria_id: z.string().optional().describe('Filtrar por categoria'),
    valor_minimo: z.number().optional().describe('Valor mínimo'),
    valor_maximo: z.number().optional().describe('Valor máximo'),
  }),
  execute: async ({
    limit = 50,
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
      let idx = 1;

      const push = (clause: string, val: unknown) => {
        conditions.push(`${clause} $${idx}`);
        params.push(val);
        idx += 1;
      };

      if (conta_id) push('m.conta_id =', conta_id);
      if (categoria_id) push('m.categoria_id =', categoria_id);
      if (data_inicial) push('m.data >=', data_inicial);
      if (data_final) push('m.data <=', data_final);
      if (valor_minimo !== undefined) push('m.valor >=', valor_minimo);
      if (valor_maximo !== undefined) push('m.valor <=', valor_maximo);
      if (tipo) {
        if (tipo === 'entrada') conditions.push('m.valor > 0');
        if (tipo === 'saída') conditions.push('m.valor < 0');
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const sql = `
        SELECT
          m.id,
          m.data,
          CASE WHEN m.valor > 0 THEN 'entrada' ELSE 'saída' END AS tipo,
          m.valor,
          m.categoria_id,
          m.conta_id,
          m.centro_custo_id
        FROM gestaofinanceira.movimentos m
        ${whereClause}
        ORDER BY m.data DESC
        LIMIT $${idx}::int
      `.trim();

      const rows = await runQuery<{
        id: string;
        data: string;
        tipo: 'entrada' | 'saída';
        valor: number;
        categoria_id?: string | null;
        conta_id?: string | null;
        centro_custo_id?: string | null;
      }>(sql, [...params, limit]);

      // Totais simples
      const totalEntradas = rows.reduce((s, r) => s + (r.valor > 0 ? r.valor : 0), 0);
      const totalSaidas = rows.reduce((s, r) => s + (r.valor < 0 ? Math.abs(r.valor) : 0), 0);

      return {
        success: true,
        rows,
        totals: {
          total_entradas: totalEntradas,
          total_saidas: totalSaidas,
          saldo_liquido: totalEntradas - totalSaidas,
          total_movimentos: rows.length,
        },
        message: `${rows.length} movimentos encontrados`,
        sql_query: sql,
        sql_params: formatSqlParams([...params, limit]),
      };
    } catch (error) {
      console.error('ERRO getMovimentos:', error);
      return {
        success: false,
        rows: [],
        message: `Erro ao buscar movimentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
