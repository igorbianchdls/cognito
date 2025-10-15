import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

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

  execute: async ({
    limit = 20,
    status,
    cliente_id,
    categoria_id,
    vence_em_dias,
    venceu_ha_dias,
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

      if (status) push('cr.status =', status);
      if (cliente_id) push('cr.cliente_id =', cliente_id);
      if (categoria_id) push('cr.categoria_id =', categoria_id);
      if (valor_minimo !== undefined) push('cr.valor >=', valor_minimo);
      if (valor_maximo !== undefined) push('cr.valor <=', valor_maximo);

      if (vence_em_dias !== undefined) {
        conditions.push(`cr.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${index}::int) * INTERVAL '1 day'`);
        params.push(vence_em_dias);
        index += 1;
      }

      if (venceu_ha_dias !== undefined) {
        conditions.push(`cr.data_vencimento BETWEEN CURRENT_DATE - ($${index}::int) * INTERVAL '1 day' AND CURRENT_DATE - INTERVAL '1 day'`);
        params.push(venceu_ha_dias);
        index += 1;
      }

      if (data_emissao_de) push('cr.data_emissao >=', data_emissao_de);
      if (data_emissao_ate) push('cr.data_emissao <=', data_emissao_ate);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const listSql = `
        SELECT
          cr.id,
          cr.descricao,
          cr.valor,
          cr.data_vencimento,
          cr.data_recebimento,
          cr.status,
          c.nome_razao_social AS nome_cliente
        FROM gestaofinanceira.contas_a_receber AS cr
        LEFT JOIN entidades.clientes AS c ON cr.cliente_id = c.id
        ${whereClause}
        ORDER BY cr.data_vencimento DESC
        LIMIT $${index}
      `.trim();

      const paramsWithLimit = [...params, limit];

      const totalsSql = `
        SELECT
          SUM(cr.valor) AS total_valor,
          COUNT(*) AS total_registros
        FROM gestaofinanceira.contas_a_receber AS cr
        LEFT JOIN entidades.clientes AS c ON cr.cliente_id = c.id
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

  execute: async ({
    limit = 20,
    status,
    fornecedor_id,
    categoria_id,
    vence_em_dias,
    venceu_ha_dias,
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

      if (status) push('cp.status =', status);
      if (fornecedor_id) push('cp.fornecedor_id =', fornecedor_id);
      if (categoria_id) push('cp.categoria_id =', categoria_id);
      if (valor_minimo !== undefined) push('cp.valor >=', valor_minimo);
      if (valor_maximo !== undefined) push('cp.valor <=', valor_maximo);

      if (vence_em_dias !== undefined) {
        conditions.push(`cp.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${index}::int) * INTERVAL '1 day'`);
        params.push(vence_em_dias);
        index += 1;
      }

      if (venceu_ha_dias !== undefined) {
        conditions.push(`cp.data_vencimento BETWEEN CURRENT_DATE - ($${index}::int) * INTERVAL '1 day' AND CURRENT_DATE - INTERVAL '1 day'`);
        params.push(venceu_ha_dias);
        index += 1;
      }

      if (data_emissao_de) push('cp.data_emissao >=', data_emissao_de);
      if (data_emissao_ate) push('cp.data_emissao <=', data_emissao_ate);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const listSql = `
        SELECT
          cp.id,
          cp.descricao,
          cp.valor,
          cp.data_vencimento,
          cp.data_pagamento,
          cp.status,
          f.nome_razao_social AS nome_fornecedor
        FROM gestaofinanceira.contas_a_pagar AS cp
        LEFT JOIN entidades.fornecedores AS f ON cp.fornecedor_id = f.id
        ${whereClause}
        ORDER BY cp.data_vencimento DESC
        LIMIT $${index}
      `.trim();

      const paramsWithLimit = [...params, limit];

      const totalsSql = `
        SELECT
          SUM(cp.valor) AS total_valor,
          COUNT(*) AS total_registros
        FROM gestaofinanceira.contas_a_pagar AS cp
        LEFT JOIN entidades.fornecedores AS f ON cp.fornecedor_id = f.id
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
  description: 'Calcula projeções de fluxo de caixa (entradas, saídas e saldo projetado) para 7, 30 ou 90 dias.',
  inputSchema: z.object({
    dias: z.number().describe('Período de projeção em dias (recomendado: 7, 30 ou 90)'),
    saldo_inicial: z.number().optional().describe('Saldo inicial em caixa'),
  }),
  execute: async ({ dias, saldo_inicial = 0 }) => {
    try {
      const periodo = normalizePeriodo(dias);

      const fluxoSql = `
        WITH periodo AS (
          SELECT
            CURRENT_DATE AS hoje,
            CURRENT_DATE + ($1::int) * INTERVAL '1 day' AS limite
        ),
        receber AS (
          SELECT
            SUM(CASE WHEN COALESCE(cr.data_vencimento, CURRENT_DATE) <= periodo.limite THEN COALESCE(cr.valor, 0) ELSE 0 END) AS previstas,
            SUM(CASE WHEN COALESCE(cr.data_vencimento, CURRENT_DATE) < periodo.hoje THEN COALESCE(cr.valor, 0) ELSE 0 END) AS vencidas,
            COUNT(*) FILTER (WHERE cr.status IN ('pendente', 'vencido')) AS total
          FROM gestaofinanceira.contas_a_receber cr, periodo
          WHERE cr.status IN ('pendente', 'vencido')
        ),
        pagar AS (
          SELECT
            SUM(CASE WHEN COALESCE(cp.data_vencimento, CURRENT_DATE) <= periodo.limite THEN COALESCE(cp.valor, 0) ELSE 0 END) AS previstas,
            SUM(CASE WHEN COALESCE(cp.data_vencimento, CURRENT_DATE) < periodo.hoje THEN COALESCE(cp.valor, 0) ELSE 0 END) AS vencidas,
            COUNT(*) FILTER (WHERE cp.status IN ('pendente', 'vencido')) AS total
          FROM gestaofinanceira.contas_a_pagar cp, periodo
          WHERE cp.status IN ('pendente', 'vencido')
        )
        SELECT
          COALESCE(receber.previstas, 0) AS entradas_previstas,
          COALESCE(receber.vencidas, 0) AS entradas_vencidas,
          COALESCE(receber.total, 0) AS total_receber,
          COALESCE(pagar.previstas, 0) AS saidas_previstas,
          COALESCE(pagar.vencidas, 0) AS saidas_vencidas,
          COALESCE(pagar.total, 0) AS total_pagar
        FROM receber, pagar;
      `.trim();

      const [fluxo] = await runQuery<{
        entradas_previstas: number | null;
        entradas_vencidas: number | null;
        total_receber: number | null;
        saidas_previstas: number | null;
        saidas_vencidas: number | null;
        total_pagar: number | null;
      }>(fluxoSql, [periodo]);

      const entradasPrevistas = Number(fluxo?.entradas_previstas ?? 0);
      const entradasVencidas = Number(fluxo?.entradas_vencidas ?? 0);
      const totalReceber = Number(fluxo?.total_receber ?? 0);

      const saidasPrevistas = Number(fluxo?.saidas_previstas ?? 0);
      const saidasVencidas = Number(fluxo?.saidas_vencidas ?? 0);
      const totalPagar = Number(fluxo?.total_pagar ?? 0);

      const saldoProjetado = saldo_inicial + entradasPrevistas - saidasPrevistas;

      const rows = [
        {
          categoria: 'Entradas previstas',
          origem: 'contas_a_receber',
          valor: entradasPrevistas,
          valor_vencido: entradasVencidas,
          quantidade: totalReceber,
        },
        {
          categoria: 'Saídas previstas',
          origem: 'contas_a_pagar',
          valor: saidasPrevistas,
          valor_vencido: saidasVencidas,
          quantidade: totalPagar,
        },
        {
          categoria: 'Saldo projetado',
          origem: 'projecao',
          valor: saldoProjetado,
          valor_vencido: null,
          quantidade: null,
        },
      ];

      return {
        success: true,
        periodo_dias: periodo,
        saldo_inicial,
        rows,
        summary: {
          entradas_previstas: entradasPrevistas,
          saidas_previstas: saidasPrevistas,
          saldo_projetado: saldoProjetado,
          entradas_vencidas: entradasVencidas,
          saidas_vencidas: saidasVencidas,
        },
        sql_query: fluxoSql,
        sql_params: formatSqlParams([periodo]),
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

// ============================================================================
// TRANSAÇÕES E EXTRATO
// ============================================================================

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

// ============================================================================
// SALDOS BANCÁRIOS
// ============================================================================

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
