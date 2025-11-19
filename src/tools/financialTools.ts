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
          e.nome_fantasia AS cliente,
          lf.descricao,
          lf.valor AS valor_total,
          lf.data_lancamento AS data_emissao,
          lf.data_vencimento,
          NULL::date AS data_recebimento,
          lf.status,
          lf.criado_em
        FROM financeiro.lancamentos_financeiros AS lf
        LEFT JOIN entidades.clientes AS e ON e.id = lf.entidade_id
        LEFT JOIN financeiro.categorias_financeiras cf ON cf.id = lf.categoria_id
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
        LEFT JOIN financeiro.categorias_financeiras cf ON cf.id = lf.categoria_id
        ${whereClause}
      `.trim();

      const rowsRaw = await runQuery<Record<string, unknown>>(listSql, paramsWithLimit);
      const [totals] = await runQuery<{
        total_valor: number | null;
        total_registros: number | null;
      }>(totalsSql, params);

      const totalValor = Number(totals?.total_valor ?? 0);
      const count = rowsRaw.length;

      // Geração de título dinâmico para UI
      const parts: string[] = ['Contas a Receber'];
      if (status) {
        const s = status.toLowerCase();
        const map: Record<string, string> = {
          pendente: 'Pendentes',
          pago: 'Pagas',
          cancelado: 'Canceladas',
          vencido: 'Vencidas',
        };
        parts.push(map[s] || s.charAt(0).toUpperCase() + s.slice(1));
      }
      if (cliente_id) parts.push(`Cliente: ${cliente_id}`);
      if (data_vencimento_de || data_vencimento_ate) parts.push(`Venc. ${data_vencimento_de || '...'} a ${data_vencimento_ate || '...'}`);
      if (data_emissao_de || data_emissao_ate) parts.push(`Emissão ${data_emissao_de || '...'} a ${data_emissao_ate || '...'}`);
      if (typeof vence_em_dias === 'number') parts.push(`Próximos ${vence_em_dias} dias`);
      if (typeof venceu_ha_dias === 'number') parts.push(`Vencidas últimos ${venceu_ha_dias} dias`);
      if (typeof valor_minimo === 'number') parts.push(`≥ ${Number(valor_minimo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
      if (typeof valor_maximo === 'number') parts.push(`≤ ${Number(valor_maximo).toLocaleString('pt-BR', { style: 'currency', 'currency': 'BRL' })}`);
      const title = parts.join(' · ');

      return {
        success: true,
        count,
        total_valor: totalValor,
        rows: rowsRaw,
        message: `Encontradas ${count} contas a receber (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        title,
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
          ent.nome_fantasia AS cliente,
          pr.descricao,
          pr.valor AS valor_total,
          pr.data_vencimento,
          pr.data_lancamento AS data_recebimento,
          pr.status
        FROM financeiro.lancamentos_financeiros AS pr
        LEFT JOIN entidades.clientes AS ent ON ent.id = pr.entidade_id
        LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = pr.categoria_id
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
        LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = pr.categoria_id
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

      // Título dinâmico
      const parts: string[] = ['Pagamentos Recebidos'];
      if (cliente_id) parts.push(`Cliente: ${cliente_id}`);
      if (data_emissao_de || data_emissao_ate) parts.push(`Período ${data_emissao_de || '...'} a ${data_emissao_ate || '...'}`);
      if (data_vencimento_de || data_vencimento_ate) parts.push(`Venc. ${data_vencimento_de || '...'} a ${data_vencimento_ate || '...'}`);
      if (typeof vence_em_dias === 'number') parts.push(`Próximos ${vence_em_dias} dias`);
      if (typeof venceu_ha_dias === 'number') parts.push(`Últimos ${venceu_ha_dias} dias`);
      if (typeof valor_minimo === 'number') parts.push(`≥ ${Number(valor_minimo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
      if (typeof valor_maximo === 'number') parts.push(`≤ ${Number(valor_maximo).toLocaleString('pt-BR', { style: 'currency', 'currency': 'BRL' })}`);
      const title = parts.join(' · ');

      return {
        success: true,
        count,
        total_valor: totalValor,
        rows: rowsRaw,
        message: `Encontrados ${count} pagamentos recebidos (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        title,
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
          f.nome_fantasia AS fornecedor,
          lf.descricao,
          lf.valor AS valor_total,
          lf.data_lancamento AS data_emissao,
          lf.data_vencimento,
          NULL::date AS data_pagamento,
          lf.status,
          lf.criado_em
        FROM financeiro.lancamentos_financeiros AS lf
        LEFT JOIN entidades.fornecedores AS f ON f.id = lf.entidade_id
        LEFT JOIN financeiro.categorias_financeiras cf ON cf.id = lf.categoria_id
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
        LEFT JOIN financeiro.categorias_financeiras cf ON cf.id = lf.categoria_id
        ${whereClause}
      `.trim();

      const rowsRaw = await runQuery<Record<string, unknown>>(listSql, paramsWithLimit);
      const [totals] = await runQuery<{
        total_valor: number | null;
        total_registros: number | null;
      }>(totalsSql, params);

      const totalValor = Number(totals?.total_valor ?? 0);
      const count = rowsRaw.length;

      // Título dinâmico
      const parts: string[] = ['Contas a Pagar'];
      if (status) {
        const s = status.toLowerCase();
        const map: Record<string, string> = {
          pendente: 'Pendentes',
          pago: 'Pagas',
          cancelado: 'Canceladas',
          vencido: 'Vencidas',
        };
        parts.push(map[s] || s.charAt(0).toUpperCase() + s.slice(1));
      }
      if (fornecedor_id) parts.push(`Fornecedor: ${fornecedor_id}`);
      if (data_vencimento_de || data_vencimento_ate) parts.push(`Venc. ${data_vencimento_de || '...'} a ${data_vencimento_ate || '...'}`);
      if (data_emissao_de || data_emissao_ate) parts.push(`Emissão ${data_emissao_de || '...'} a ${data_emissao_ate || '...'}`);
      if (typeof vence_em_dias === 'number') parts.push(`Próximos ${vence_em_dias} dias`);
      if (typeof venceu_ha_dias === 'number') parts.push(`Vencidas últimos ${venceu_ha_dias} dias`);
      if (typeof valor_minimo === 'number') parts.push(`≥ ${Number(valor_minimo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
      if (typeof valor_maximo === 'number') parts.push(`≤ ${Number(valor_maximo).toLocaleString('pt-BR', { style: 'currency', 'currency': 'BRL' })}`);
      const title = parts.join(' · ');

      return {
        success: true,
        count,
        total_valor: totalValor,
        rows: rowsRaw,
        message: `Encontradas ${count} contas a pagar (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        title,
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
          f.nome_fantasia AS fornecedor,
          pe.descricao,
          pe.valor AS valor_total,
          pe.data_lancamento AS data_pagamento,
          pe.data_vencimento,
          pe.status
        FROM financeiro.lancamentos_financeiros AS pe
        LEFT JOIN entidades.fornecedores AS f ON f.id = pe.entidade_id
        LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = pe.categoria_id
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
        LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = pe.categoria_id
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

      // Título dinâmico
      const parts: string[] = ['Pagamentos Efetuados'];
      if (fornecedor_id) parts.push(`Fornecedor: ${fornecedor_id}`);
      if (data_emissao_de || data_emissao_ate) parts.push(`Período ${data_emissao_de || '...'} a ${data_emissao_ate || '...'}`);
      if (data_vencimento_de || data_vencimento_ate) parts.push(`Venc. ${data_vencimento_de || '...'} a ${data_vencimento_ate || '...'}`);
      if (typeof vence_em_dias === 'number') parts.push(`Próximos ${vence_em_dias} dias`);
      if (typeof venceu_ha_dias === 'number') parts.push(`Últimos ${venceu_ha_dias} dias`);
      if (typeof valor_minimo === 'number') parts.push(`≥ ${Number(valor_minimo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
      if (typeof valor_maximo === 'number') parts.push(`≤ ${Number(valor_maximo).toLocaleString('pt-BR', { style: 'currency', 'currency': 'BRL' })}`);
      const title = parts.join(' · ');

      return {
        success: true,
        count,
        total_valor: totalValor,
        rows: rowsRaw,
        message: `Encontrados ${count} pagamentos efetuados (Total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        title,
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
// MOVIMENTOS FINANCEIROS
// ============================================================================

// Removido: criar movimento manual (tool consolidada)

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
        title: `Inadimplência · ${tipo === 'ambos' ? 'A Receber e A Pagar' : tipo === 'receber' ? 'A Receber' : 'A Pagar'}`,
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
        title: [
          'Transações e Extrato',
          conta_id ? `Conta: ${conta_id}` : undefined,
          tipo ? `Tipo: ${tipo}` : undefined,
          origem ? `Origem: ${origem}` : undefined,
          conciliado !== undefined ? (conciliado ? 'Conciliadas' : 'Não conciliadas') : undefined,
          data_inicial || data_final ? `${data_inicial || '...'} a ${data_final || '...'}` : undefined,
        ].filter(Boolean).join(' · '),
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
        title: ['Saldos Bancários', `Data: ${asOfDate}`, tipo_conta ? `Tipo: ${tipo_conta}` : undefined, incluir_inativas ? 'Inclui inativas' : undefined].filter(Boolean).join(' · '),
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
  description: 'Ranking por Centro de Custo, somando valores por tipo (pagamento_efetuado ou conta_a_pagar)',
  inputSchema: z.object({
    data_inicial: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().describe('Data final (YYYY-MM-DD)'),
    limit: z.number().default(20).describe('Número máximo de centros de custo'),
    tipo: z.enum(['pagamento_efetuado', 'conta_a_pagar', 'contas_a_pagar']).default('pagamento_efetuado')
      .describe("Tipo de base: 'pagamento_efetuado' (realizado) ou 'conta_a_pagar' (planejado)"),
  }),
  execute: async ({
    data_inicial,
    data_final,
    limit,
    tipo,
  }) => {
    try {
      // Normalização do tipo (aceita 'contas_a_pagar' e converte)
      const tipoNorm = tipo === 'contas_a_pagar' ? 'conta_a_pagar' : tipo;

      const params: unknown[] = [data_inicial, data_final, limit];
      let sql: string;
      let totalSql: string;
      let titleKind: string;

      if (tipoNorm === 'pagamento_efetuado') {
        // Ranking por Centro de Custo baseado em pagamentos efetuados (realizado)
        sql = `
          SELECT
            COALESCE(cc.nome, '— sem CC —') AS centro_custo,
            SUM(lf.valor) AS total_gasto
          FROM financeiro.lancamentos_financeiros lf
          JOIN financeiro.lancamentos_financeiros ap
            ON ap.id = lf.lancamento_origem_id
          LEFT JOIN empresa.centros_custo cc
            ON cc.id = ap.centro_custo_id
          WHERE lf.tipo = 'pagamento_efetuado'
            AND lf.data_lancamento >= $1 AND lf.data_lancamento <= $2
          GROUP BY COALESCE(cc.nome, '— sem CC —')
          ORDER BY total_gasto DESC
          LIMIT $3
        `.trim();

        totalSql = `
          SELECT
            SUM(lf.valor) AS total_geral,
            COUNT(*) AS total_registros
          FROM financeiro.lancamentos_financeiros lf
          WHERE lf.tipo = 'pagamento_efetuado'
            AND lf.data_lancamento >= $1 AND lf.data_lancamento <= $2
        `.trim();

        titleKind = 'Pagamentos';
      } else {
        // Ranking por Centro de Custo baseado em títulos a pagar (planejado)
        sql = `
          SELECT
            COALESCE(cc.nome, '— sem CC —') AS centro_custo,
            SUM(ap.valor) AS total_gasto
          FROM financeiro.lancamentos_financeiros ap
          LEFT JOIN empresa.centros_custo cc
            ON cc.id = ap.centro_custo_id
          WHERE ap.tipo = 'conta_a_pagar'
            AND ap.data_vencimento >= $1 AND ap.data_vencimento <= $2
          GROUP BY COALESCE(cc.nome, '— sem CC —')
          ORDER BY total_gasto DESC
          LIMIT $3
        `.trim();

        totalSql = `
          SELECT
            SUM(ap.valor) AS total_geral,
            COUNT(*) AS total_registros
          FROM financeiro.lancamentos_financeiros ap
          WHERE ap.tipo = 'conta_a_pagar'
            AND ap.data_vencimento >= $1 AND ap.data_vencimento <= $2
        `.trim();

        titleKind = 'Títulos (A Pagar)';
      }

      const rows = await runQuery<Record<string, unknown>>(sql, params);
      const [totals] = await runQuery<{
        total_geral: number | null;
        total_registros: number | null;
      }>(totalSql, [data_inicial, data_final]);

      const totalGeral = Number(totals?.total_geral ?? 0);

      return {
        success: true,
        rows,
        count: rows.length,
        totals: {
          total_geral: totalGeral,
          total_registros: Number(totals?.total_registros ?? 0),
        },
        periodo: {
          data_inicial,
          data_final,
        },
        title: `Ranking Centros de Custo (${titleKind}) · ${data_inicial} a ${data_final} · Top ${limit}`,
        message: `${rows.length} centros de custo (Total: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${sql}\n\n-- Totais\n${totalSql}`,
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

export const rankingPorCategoriaFinanceira = tool({
  description: 'Ranking por categoria financeira; base em pagamento_efetuado/conta_a_pagar (despesas) ou pagamento_recebido/conta_a_receber (receitas)',
  inputSchema: z.object({
    data_inicial: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().optional().describe('Data final (YYYY-MM-DD)'),
    limit: z.number().default(100).describe('Número máximo de categorias'),
    tipo: z.enum(['pagamento_efetuado', 'conta_a_pagar', 'contas_a_pagar', 'pagamento_recebido', 'conta_a_receber', 'contas_a_receber']).default('pagamento_efetuado')
      .describe("Base: 'pagamento_efetuado' | 'conta_a_pagar' | 'pagamento_recebido' | 'conta_a_receber' (aceita plural)"),
  }),
  execute: async ({ data_inicial, data_final, limit, tipo = 'pagamento_efetuado' }) => {
    try {
      const norm = (t: string) => t === 'contas_a_pagar' ? 'conta_a_pagar' : (t === 'contas_a_receber' ? 'conta_a_receber' : t);
      const tipoNorm = norm(tipo);

      let params: unknown[] = [];
      let sql: string = '';
      let totalSql: string = '';
      let titleKind: string = '';

      if (tipoNorm === 'pagamento_efetuado') {
        // Realizado: soma lf.valor por categoria do cabeçalho AP
        sql = `
          SELECT
            COALESCE(cat.nome, '— sem categoria —') AS categoria,
            SUM(lf.valor) AS total_gasto
          FROM financeiro.lancamentos_financeiros lf
          JOIN financeiro.lancamentos_financeiros ap
            ON ap.id = lf.lancamento_origem_id
          LEFT JOIN financeiro.categorias_financeiras cat
            ON cat.id = ap.categoria_id
          WHERE lf.tipo = 'pagamento_efetuado'
          ${data_inicial ? `AND lf.data_lancamento >= $1` : ''}
          ${data_final ? `AND lf.data_lancamento <= $${data_inicial ? 2 : 1}` : ''}
          GROUP BY COALESCE(cat.nome, '— sem categoria —')
          ORDER BY total_gasto DESC
          LIMIT $${(data_inicial ? 1 : 0) + (data_final ? 1 : 0) + 1}
        `.trim();

        totalSql = `
          SELECT SUM(lf.valor) AS total_geral
          FROM financeiro.lancamentos_financeiros lf
          WHERE lf.tipo = 'pagamento_efetuado'
          ${data_inicial ? `AND lf.data_lancamento >= $1` : ''}
          ${data_final ? `AND lf.data_lancamento <= $${data_inicial ? 2 : 1}` : ''}
        `.trim();

        titleKind = 'Pagamentos Efetuados';
        params = [
          ...([] as unknown[]).concat(data_inicial ? [data_inicial] as unknown[] : [])
                               .concat(data_final ? [data_final] as unknown[] : []),
          limit,
        ];
      } else if (tipoNorm === 'conta_a_pagar') {
        // Planejado: soma ap.valor por categoria do próprio cabeçalho
        sql = `
          SELECT
            COALESCE(cat.nome, '— sem categoria —') AS categoria,
            SUM(ap.valor) AS total_gasto
          FROM financeiro.lancamentos_financeiros ap
          LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = ap.categoria_id
          WHERE ap.tipo = 'conta_a_pagar'
          ${data_inicial ? `AND ap.data_vencimento >= $1` : ''}
          ${data_final ? `AND ap.data_vencimento <= $${data_inicial ? 2 : 1}` : ''}
          GROUP BY COALESCE(cat.nome, '— sem categoria —')
          ORDER BY total_gasto DESC
          LIMIT $${(data_inicial ? 1 : 0) + (data_final ? 1 : 0) + 1}
        `.trim();

        totalSql = `
          SELECT SUM(ap.valor) AS total_geral
          FROM financeiro.lancamentos_financeiros ap
          WHERE ap.tipo = 'conta_a_pagar'
          ${data_inicial ? `AND ap.data_vencimento >= $1` : ''}
          ${data_final ? `AND ap.data_vencimento <= $${data_inicial ? 2 : 1}` : ''}
        `.trim();

        titleKind = 'Títulos (A Pagar)';
        params = [
          ...([] as unknown[]).concat(data_inicial ? [data_inicial] as unknown[] : [])
                               .concat(data_final ? [data_final] as unknown[] : []),
          limit,
        ];
      } else if (tipoNorm === 'pagamento_recebido') {
        // Realizado (Recebido): soma lf.valor por categoria do cabeçalho AR
        sql = `
          SELECT
            COALESCE(cat.nome, '— sem categoria —') AS categoria,
            SUM(lf.valor) AS total_gasto
          FROM financeiro.lancamentos_financeiros lf
          JOIN financeiro.lancamentos_financeiros ar
            ON ar.id = lf.lancamento_origem_id
          LEFT JOIN financeiro.categorias_financeiras cat
            ON cat.id = ar.categoria_id
          WHERE lf.tipo = 'pagamento_recebido'
          ${data_inicial ? `AND lf.data_lancamento >= $1` : ''}
          ${data_final ? `AND lf.data_lancamento <= $${data_inicial ? 2 : 1}` : ''}
          GROUP BY COALESCE(cat.nome, '— sem categoria —')
          ORDER BY total_gasto DESC
          LIMIT $${(data_inicial ? 1 : 0) + (data_final ? 1 : 0) + 1}
        `.trim();

        totalSql = `
          SELECT SUM(lf.valor) AS total_geral
          FROM financeiro.lancamentos_financeiros lf
          WHERE lf.tipo = 'pagamento_recebido'
          ${data_inicial ? `AND lf.data_lancamento >= $1` : ''}
          ${data_final ? `AND lf.data_lancamento <= $${data_inicial ? 2 : 1}` : ''}
        `.trim();

        titleKind = 'Pagamentos Recebidos';
        params = [
          ...([] as unknown[]).concat(data_inicial ? [data_inicial] as unknown[] : [])
                               .concat(data_final ? [data_final] as unknown[] : []),
          limit,
        ];
      } else if (tipoNorm === 'conta_a_receber') {
        // Planejado (Receber): soma ar.valor por categoria do próprio cabeçalho AR
        sql = `
          SELECT
            COALESCE(cat.nome, '— sem categoria —') AS categoria,
            SUM(ar.valor) AS total_gasto
          FROM financeiro.lancamentos_financeiros ar
          LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = ar.categoria_id
          WHERE ar.tipo = 'conta_a_receber'
          ${data_inicial ? `AND ar.data_vencimento >= $1` : ''}
          ${data_final ? `AND ar.data_vencimento <= $${data_inicial ? 2 : 1}` : ''}
          GROUP BY COALESCE(cat.nome, '— sem categoria —')
          ORDER BY total_gasto DESC
          LIMIT $${(data_inicial ? 1 : 0) + (data_final ? 1 : 0) + 1}
        `.trim();

        totalSql = `
          SELECT SUM(ar.valor) AS total_geral
          FROM financeiro.lancamentos_financeiros ar
          WHERE ar.tipo = 'conta_a_receber'
          ${data_inicial ? `AND ar.data_vencimento >= $1` : ''}
          ${data_final ? `AND ar.data_vencimento <= $${data_inicial ? 2 : 1}` : ''}
        `.trim();

        titleKind = 'Títulos (A Receber)';
        params = [
          ...([] as unknown[]).concat(data_inicial ? [data_inicial] as unknown[] : [])
                               .concat(data_final ? [data_final] as unknown[] : []),
          limit,
        ];
      }

      if (!sql || !totalSql) {
        throw new Error(`tipo inválido para rankingPorCategoriaFinanceira: ${tipoNorm}`);
      }
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      const [tot] = await runQuery<{ total_geral: number | null }>(
        totalSql,
        ([] as unknown[]).concat(data_inicial ? [data_inicial] as unknown[] : [])
                         .concat(data_final ? [data_final] as unknown[] : [])
      );

      const totalGeral = Number(tot?.total_geral ?? 0);

      return {
        success: true,
        rows,
        count: rows.length,
        totals: { total_geral: totalGeral },
        title: `Ranking por Categoria (${titleKind})` + (data_inicial || data_final ? ` · ${data_inicial || '...'} a ${data_final || '...'}` : ''),
        message: `${rows.length} categorias (Total: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${sql}\n\n-- Totais\n${totalSql}`,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO analisarDespesasPorCategoria:', error);
      return {
        success: false,
        rows: [],
        count: 0,
        message: `Erro ao analisar despesas por categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

// ============================================================================
// RANKING FINANCEIRO POR DIMENSÃO (genérico)
// ============================================================================

export const rankingFinanceiroPorDimensao = tool({
  description:
    'Ranking financeiro por dimensão (departamento, filial, projeto, centro de lucro, natureza_financeira) com base em realizado ou planejado',
  inputSchema: z.object({
    tipo: z
      .enum([
        'pagamento_efetuado',
        'conta_a_pagar',
        'contas_a_pagar',
        'pagamento_recebido',
        'conta_a_receber',
        'contas_a_receber',
      ])
      .default('pagamento_efetuado')
      .describe(
        "Base de cálculo: 'pagamento_efetuado' | 'conta_a_pagar' | 'pagamento_recebido' | 'conta_a_receber' (aceita plural)"
      ),
    dimensao: z
      .enum([
        'departamento',
        'filial',
        'projeto',
        'centro_lucro',
        'natureza_financeira',
        'categorias_financeiras',
        'centros_custo',
        // aliases
        'categoria',
        'categoria_financeira',
        'centro_custo',
        'cc',
      ])
      .describe('Dimensão de agrupamento'),
    data_inicial: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().optional().describe('Data final (YYYY-MM-DD)'),
    limit: z.number().default(100).describe('Número máximo de linhas no ranking'),
  }),
  execute: async ({ tipo = 'pagamento_efetuado', dimensao, data_inicial, data_final, limit }) => {
    try {
      const norm = (t: string) =>
        t === 'contas_a_pagar' ? 'conta_a_pagar' : t === 'contas_a_receber' ? 'conta_a_receber' : t;
      const tipoNorm = norm(tipo);

      // Configuração de FROM/WHERE/colunas por tipo (realizado x planejado)
      type Build = {
        headAlias: 'ap' | 'ar';
        baseFrom: string; // inclui joins necessários ao cabeçalho h
        whereParts: string[];
        valorExpr: string; // SUM() target
        dataCol: string; // coluna para filtros de período
      };

      const buildForTipo = (): Build => {
        if (tipoNorm === 'pagamento_efetuado') {
          return {
            headAlias: 'ap',
            baseFrom:
              `FROM financeiro.lancamentos_financeiros lf ` +
              `JOIN financeiro.lancamentos_financeiros ap ON ap.id = lf.lancamento_origem_id`,
            whereParts: [`lf.tipo = 'pagamento_efetuado'`],
            valorExpr: 'lf.valor',
            dataCol: 'lf.data_lancamento',
          };
        }
        if (tipoNorm === 'conta_a_pagar') {
          return {
            headAlias: 'ap',
            baseFrom: `FROM financeiro.lancamentos_financeiros ap`,
            whereParts: [`ap.tipo = 'conta_a_pagar'`],
            valorExpr: 'ap.valor',
            dataCol: 'ap.data_vencimento',
          };
        }
        if (tipoNorm === 'pagamento_recebido') {
          return {
            headAlias: 'ar',
            baseFrom:
              `FROM financeiro.lancamentos_financeiros lf ` +
              `JOIN financeiro.lancamentos_financeiros ar ON ar.id = lf.lancamento_origem_id`,
            whereParts: [`lf.tipo = 'pagamento_recebido'`],
            valorExpr: 'lf.valor',
            dataCol: 'lf.data_lancamento',
          };
        }
        // conta_a_receber (planejado)
        return {
          headAlias: 'ar',
          baseFrom: `FROM financeiro.lancamentos_financeiros ar`,
          whereParts: [`ar.tipo = 'conta_a_receber'`],
          valorExpr: 'ar.valor',
          dataCol: 'ar.data_vencimento',
        };
      };

      const cfg = buildForTipo();

      // Mapear joins e expressão de dimensão com base no cabeçalho
      const joinForDim = (h: 'ap' | 'ar', dimKey: 'departamento' | 'filial' | 'projeto' | 'centro_lucro' | 'natureza_financeira' | 'categorias_financeiras' | 'centros_custo') => {
        switch (dimKey) {
          case 'departamento':
            return {
              joins: `LEFT JOIN empresa.departamentos dep ON dep.id = ${h}.departamento_id`,
              expr: `COALESCE(dep.nome, '— sem departamento —')`,
              label: 'Departamento',
            } as const;
          case 'filial':
            return {
              joins: `LEFT JOIN empresa.filiais fil ON fil.id = ${h}.filial_id`,
              expr: `COALESCE(fil.nome, '— sem filial —')`,
              label: 'Filial',
            } as const;
          case 'projeto':
            return {
              joins: `LEFT JOIN financeiro.projetos prj ON prj.id = ${h}.projeto_id`,
              expr: `COALESCE(prj.nome, '— sem projeto —')`,
              label: 'Projeto',
            } as const;
          case 'centro_lucro':
            return {
              joins: `LEFT JOIN empresa.centros_lucro cl ON cl.id = ${h}.centro_lucro_id`,
              expr: `COALESCE(cl.nome, '— sem centro de lucro —')`,
              label: 'Centro de Lucro',
            } as const;
          case 'centros_custo':
            return {
              joins: `LEFT JOIN empresa.centros_custo cc ON cc.id = ${h}.centro_custo_id`,
              expr: `COALESCE(cc.nome, '— sem centro de custo —')`,
              label: 'Centro de Custo',
            } as const;
          case 'categorias_financeiras':
            return {
              joins: `LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = ${h}.categoria_id`,
              expr: `COALESCE(cat.nome, '— sem categoria —')`,
              label: 'Categoria Financeira',
            } as const;
          case 'natureza_financeira':
            return {
              joins:
                `LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = ${h}.categoria_id ` +
                `LEFT JOIN financeiro.naturezas_financeiras nf ON nf.id = cat.natureza_id`,
              expr: `COALESCE(nf.nome, '— sem natureza —')`,
              label: 'Natureza Financeira',
            } as const;
          default:
            return { joins: '', expr: `''`, label: 'Dimensão' } as const;
        }
      };

      type DimKey = 'departamento' | 'filial' | 'projeto' | 'centro_lucro' | 'natureza_financeira' | 'categorias_financeiras' | 'centros_custo'
      type DimInput = DimKey | 'categoria' | 'categoria_financeira' | 'centro_custo' | 'cc'
      const toCanonicalDim = (d: DimInput): DimKey => {
        if (d === 'categoria' || d === 'categoria_financeira') return 'categorias_financeiras'
        if (d === 'centro_custo' || d === 'cc') return 'centros_custo'
        return d
      }
      const dimKeyCanonical: DimKey = toCanonicalDim(dimensao as DimInput)

      const dm = joinForDim(cfg.headAlias, dimKeyCanonical);

      // Montar filtros de período
      const where: string[] = [...cfg.whereParts];
      const params: unknown[] = [];
      let idx = 1;
      if (data_inicial) {
        where.push(`${cfg.dataCol} >= $${idx}`);
        params.push(data_inicial);
        idx += 1;
      }
      if (data_final) {
        where.push(`${cfg.dataCol} <= $${idx}`);
        params.push(data_final);
        idx += 1;
      }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      // Consulta principal (ranking)
      const listSql = `
        SELECT
          ${dm.expr} AS dimensao,
          SUM(${cfg.valorExpr}) AS total
        ${cfg.baseFrom}
        ${dm.joins ? dm.joins : ''}
        ${whereClause}
        GROUP BY ${dm.expr}
        ORDER BY total DESC
        LIMIT $${idx}
      `.trim();
      const paramsWithLimit = [...params, limit];

      // Totais
      const totalSql = `
        SELECT SUM(${cfg.valorExpr}) AS total_geral
        ${cfg.baseFrom}
        ${dm.joins ? dm.joins : ''}
        ${whereClause}
      `.trim();

      const rows = await runQuery<{ dimensao: string; total: number }>(listSql, paramsWithLimit);
      const [tot] = await runQuery<{ total_geral: number | null }>(totalSql, params);
      const totalGeral = Number(tot?.total_geral ?? 0);

      const titleKindMap: Record<string, string> = {
        pagamento_efetuado: 'Pagamentos Efetuados',
        conta_a_pagar: 'Títulos (A Pagar)',
        pagamento_recebido: 'Pagamentos Recebidos',
        conta_a_receber: 'Títulos (A Receber)',
      };
      const kind = titleKindMap[tipoNorm] || tipoNorm;

      const title = `Ranking por ${dm.label} (${kind})` +
        (data_inicial || data_final ? ` · ${data_inicial || '...'} a ${data_final || '...'}` : '');

      return {
        success: true,
        rows,
        count: rows.length,
        totals: { total_geral: totalGeral },
        title,
        message: `${rows.length} grupos por ${dm.label} (Total: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
        sql_query: `${listSql}\n\n-- Totais\n${totalSql}`,
        sql_params: formatSqlParams(paramsWithLimit),
      };
    } catch (error) {
      console.error('ERRO rankingFinanceiroPorDimensao:', error);
      return {
        success: false,
        rows: [],
        count: 0,
        message: `Erro ao gerar ranking por dimensão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

// ============================================================================
// FLUXO DE CAIXA (somente Entradas, Saídas e Fluxo por período)
// ============================================================================

export const fluxoCaixa = tool({
  description:
    'Fluxo de caixa por período (entradas, saídas e fluxo líquido), em base realizada, planejada ou ambas. Não calcula saldo.',
  inputSchema: z.object({
    tipo_base: z.enum(['realizado', 'planejado', 'ambos']).default('realizado'),
    data_inicial: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_final: z.string().describe('Data final (YYYY-MM-DD)'),
    group_by: z.enum(['dia', 'semana', 'mes']).default('dia'),
    conta_financeira_id: z.string().optional(),
    categoria_id: z.string().optional(),
    centro_custo_id: z.string().optional(),
    projeto_id: z.string().optional(),
    departamento_id: z.string().optional(),
    filial_id: z.string().optional(),
    tenant_id: z.string().optional(),
  }),
  execute: async ({
    tipo_base = 'realizado',
    data_inicial,
    data_final,
    group_by = 'dia',
    conta_financeira_id,
    categoria_id,
    centro_custo_id,
    projeto_id,
    departamento_id,
    filial_id,
    tenant_id,
  }) => {
    try {
      // Granularidade
      const step = group_by === 'dia' ? "1 day" : group_by === 'semana' ? "1 week" : "1 month";
      const trunc = group_by === 'dia' ? 'day' : group_by === 'semana' ? 'week' : 'month';

      // Filtro auxiliar
      const buildFilter = (alias: string) => {
        const conds: string[] = [];
        const params: unknown[] = [];
        let idx = 1; // marcador apenas para leitura; a substituição real é embutida via template
        if (conta_financeira_id) { conds.push(`${alias}.conta_financeira_id = '${conta_financeira_id}'`); idx++; }
        if (categoria_id) { conds.push(`${alias}.categoria_id = '${categoria_id}'`); idx++; }
        if (centro_custo_id) { conds.push(`${alias}.centro_custo_id = '${centro_custo_id}'`); idx++; }
        if (projeto_id) { conds.push(`${alias}.projeto_id = '${projeto_id}'`); idx++; }
        if (departamento_id) { conds.push(`${alias}.departamento_id = '${departamento_id}'`); idx++; }
        if (filial_id) { conds.push(`${alias}.filial_id = '${filial_id}'`); idx++; }
        if (tenant_id) { conds.push(`${alias}.tenant_id = '${tenant_id}'`); idx++; }
        return conds.length ? `AND ${conds.join(' AND ')}` : '';
      };

      const calSql = `SELECT gs::date AS periodo FROM generate_series($1::date, $2::date, '${step}') AS gs`;

      // Subconsultas de realizado (pagamentos): data_lancamento
      const realizedInSql = `
        SELECT date_trunc('${trunc}', lf.data_lancamento)::date AS periodo, SUM(lf.valor) AS entradas
        FROM financeiro.lancamentos_financeiros lf
        WHERE lf.tipo = 'pagamento_recebido'
          AND lf.data_lancamento >= $1::date AND lf.data_lancamento <= $2::date
          ${buildFilter('lf')}
        GROUP BY 1`;
      const realizedOutSql = `
        SELECT date_trunc('${trunc}', lf.data_lancamento)::date AS periodo, SUM(ABS(lf.valor)) AS saidas
        FROM financeiro.lancamentos_financeiros lf
        WHERE lf.tipo = 'pagamento_efetuado'
          AND lf.data_lancamento >= $1::date AND lf.data_lancamento <= $2::date
          ${buildFilter('lf')}
        GROUP BY 1`;

      // Subconsultas de planejado (títulos): data_vencimento
      const plannedInSql = `
        SELECT date_trunc('${trunc}', lf.data_vencimento)::date AS periodo, SUM(lf.valor) AS entradas
        FROM financeiro.lancamentos_financeiros lf
        WHERE lf.tipo = 'conta_a_receber'
          AND lf.data_vencimento >= $1::date AND lf.data_vencimento <= $2::date
          ${buildFilter('lf')}
        GROUP BY 1`;
      const plannedOutSql = `
        SELECT date_trunc('${trunc}', lf.data_vencimento)::date AS periodo, SUM(lf.valor) AS saidas
        FROM financeiro.lancamentos_financeiros lf
        WHERE lf.tipo = 'conta_a_pagar'
          AND lf.data_vencimento >= $1::date AND lf.data_vencimento <= $2::date
          ${buildFilter('lf')}
        GROUP BY 1`;

      // Montagem por base
      let listSql = '';
      if (tipo_base === 'realizado') {
        listSql = `
          WITH cal AS (${calSql}),
               ent AS (${realizedInSql}),
               sai AS (${realizedOutSql})
          SELECT c.periodo,
                 COALESCE(ent.entradas, 0) AS entradas,
                 COALESCE(sai.saidas, 0)    AS saidas,
                 COALESCE(ent.entradas, 0) - COALESCE(sai.saidas, 0) AS fluxo
          FROM cal c
          LEFT JOIN ent ON ent.periodo = c.periodo
          LEFT JOIN sai ON sai.periodo = c.periodo
          ORDER BY c.periodo`;
      } else if (tipo_base === 'planejado') {
        listSql = `
          WITH cal AS (${calSql}),
               ent AS (${plannedInSql}),
               sai AS (${plannedOutSql})
          SELECT c.periodo,
                 COALESCE(ent.entradas, 0) AS entradas,
                 COALESCE(sai.saidas, 0)    AS saidas,
                 COALESCE(ent.entradas, 0) - COALESCE(sai.saidas, 0) AS fluxo
          FROM cal c
          LEFT JOIN ent ON ent.periodo = c.periodo
          LEFT JOIN sai ON sai.periodo = c.periodo
          ORDER BY c.periodo`;
      } else {
        // ambos: juntar as duas bases
        listSql = `
          WITH cal AS (${calSql}),
               ent_r AS (${realizedInSql}),
               sai_r AS (${realizedOutSql}),
               ent_p AS (${plannedInSql}),
               sai_p AS (${plannedOutSql})
          SELECT c.periodo,
                 COALESCE(ent_r.entradas, 0) AS entradas_real,
                 COALESCE(sai_r.saidas, 0)    AS saidas_real,
                 COALESCE(ent_r.entradas, 0) - COALESCE(sai_r.saidas, 0) AS fluxo_real,
                 COALESCE(ent_p.entradas, 0) AS entradas_plan,
                 COALESCE(sai_p.saidas, 0)    AS saidas_plan,
                 COALESCE(ent_p.entradas, 0) - COALESCE(sai_p.saidas, 0) AS fluxo_plan
          FROM cal c
          LEFT JOIN ent_r ON ent_r.periodo = c.periodo
          LEFT JOIN sai_r ON sai_r.periodo = c.periodo
          LEFT JOIN ent_p ON ent_p.periodo = c.periodo
          LEFT JOIN sai_p ON sai_p.periodo = c.periodo
          ORDER BY c.periodo`;
      }

      const rows = await runQuery<Record<string, unknown>>(listSql, [data_inicial, data_final]);

      // Totais
      type TotalsRow = { entradas?: number | null; saidas?: number | null; fluxo?: number | null;
                         entradas_real?: number | null; saidas_real?: number | null; fluxo_real?: number | null;
                         entradas_plan?: number | null; saidas_plan?: number | null; fluxo_plan?: number | null };
      type SumTotals = { entradas: number; saidas: number; fluxo: number; entradas_plan: number; saidas_plan: number; fluxo_plan: number }
      const totals = (rows as TotalsRow[]).reduce<SumTotals>((acc, r) => {
        if (tipo_base === 'ambos') {
          acc.entradas += Number(r.entradas_real ?? 0);
          acc.saidas   += Number(r.saidas_real ?? 0);
          acc.fluxo    += Number(r.fluxo_real ?? 0);
          acc.entradas_plan += Number(r.entradas_plan ?? 0);
          acc.saidas_plan   += Number(r.saidas_plan ?? 0);
          acc.fluxo_plan    += Number(r.fluxo_plan ?? 0);
        } else {
          acc.entradas += Number(r.entradas ?? 0);
          acc.saidas   += Number(r.saidas ?? 0);
          acc.fluxo    += Number(r.fluxo ?? 0);
        }
        return acc;
      }, { entradas: 0, saidas: 0, fluxo: 0, entradas_plan: 0, saidas_plan: 0, fluxo_plan: 0 } as SumTotals);

      const title = `Fluxo de Caixa (${tipo_base}) · ${data_inicial} a ${data_final}`;
      const message = tipo_base === 'ambos'
        ? `Realizado: ${totals.entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de entradas, ${totals.saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de saídas. Planejado: ${totals.entradas_plan.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de entradas, ${totals.saidas_plan.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de saídas.`
        : `Entradas: ${totals.entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, Saídas: ${totals.saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

      return {
        success: true,
        rows,
        count: rows.length,
        summary: tipo_base === 'ambos'
          ? {
              realizado: {
                entradas_total: totals.entradas,
                saidas_total: totals.saidas,
                fluxo_liquido_total: totals.fluxo,
              },
              planejado: {
                entradas_total: totals.entradas_plan,
                saidas_total: totals.saidas_plan,
                fluxo_liquido_total: totals.fluxo_plan,
              },
            }
          : {
              entradas_total: totals.entradas,
              saidas_total: totals.saidas,
              fluxo_liquido_total: totals.fluxo,
            },
        title,
        message,
        sql_query: listSql,
        sql_params: JSON.stringify([data_inicial, data_final]),
      };
    } catch (error) {
      console.error('ERRO fluxoCaixa:', error);
      return {
        success: false,
        rows: [],
        count: 0,
        message: `Erro ao calcular fluxo de caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

// ============================================================================
// AGING FINANCEIRO (AP/AR)
// ============================================================================

export const agingFinanceiro = tool({
  description: 'Aging de títulos financeiros (contas a pagar/receber) por faixas de dias, com base na data de vencimento e data-base informada.',
  inputSchema: z.object({
    tipo: z.enum(['conta_a_pagar', 'conta_a_receber']).default('conta_a_pagar')
      .describe("Tipo de título: 'conta_a_pagar' (AP) ou 'conta_a_receber' (AR)"),
    data_base: z.string().optional().describe('Data-base (YYYY-MM-DD). Default: hoje'),
    buckets: z.array(z.number().int().positive()).default([30, 60, 90])
      .describe('Limiares dos buckets em dias: ex. [30,60,90] → 0-30, 31-60, 61-90, >90'),
    somente_pendentes: z.boolean().default(true)
      .describe('Considerar apenas títulos pendentes'),
    entidade_id: z.string().optional().describe('Fornecedor (AP) ou Cliente (AR)'),
    categoria_id: z.string().optional(),
    centro_custo_id: z.string().optional(),
    projeto_id: z.string().optional(),
    departamento_id: z.string().optional(),
    filial_id: z.string().optional(),
    limit: z.number().default(1000).describe('Limite de leitura (segurança)'),
  }),
  execute: async ({
    tipo,
    data_base,
    buckets,
    somente_pendentes,
    entidade_id,
    categoria_id,
    centro_custo_id,
    projeto_id,
    departamento_id,
    filial_id,
  }) => {
    try {
      // Data-base padrão: hoje
      const todayISO = new Date().toISOString().slice(0, 10);
      const baseDate = (data_base && /\d{4}-\d{2}-\d{2}/.test(data_base)) ? data_base : todayISO;

      // Buckets: ordenar e normalizar
      const edges = Array.from(new Set((buckets || []).filter(n => Number.isFinite(n) && n > 0).map(n => Math.trunc(Number(n))))).sort((a, b) => a - b);
      const thresholds = edges.length ? edges : [30, 60, 90];

      // Expressão de dias em atraso
      const diasExpr = `($1::date - lf.data_vencimento)::int`;

      // CASE para bucket label
      const labelParts: string[] = [`WHEN ${diasExpr} <= 0 THEN 'Não vencido'`];
      const orderParts: string[] = [`WHEN ${diasExpr} <= 0 THEN 0`];
      let start = 1;
      let ord = 1;
      thresholds.forEach((t, i) => {
        const end = t;
        const low = start;
        const high = end;
        labelParts.push(`WHEN ${diasExpr} BETWEEN ${low} AND ${high} THEN '${low}-${high}'`);
        orderParts.push(`WHEN ${diasExpr} BETWEEN ${low} AND ${high} THEN ${ord}`);
        start = t + 1;
        ord += 1;
      });
      // Maior que último bucket
      labelParts.push(`WHEN ${diasExpr} > ${thresholds[thresholds.length - 1]} THEN '> ${thresholds[thresholds.length - 1]}'`);
      orderParts.push(`WHEN ${diasExpr} > ${thresholds[thresholds.length - 1]} THEN ${ord}`);

      const bucketLabelCase = `CASE ${labelParts.join(' ')} ELSE 'Não classificado' END`;
      const bucketOrderCase = `CASE ${orderParts.join(' ')} ELSE ${ord + 1} END`;

      // Condições
      const conditions: string[] = [];
      const params: unknown[] = [baseDate]; // $1 reservado para data_base
      let idx = 2;

      conditions.push(`lf.tipo = $${idx}`);
      params.push(tipo);
      idx += 1;

      if (somente_pendentes) {
        conditions.push(`LOWER(lf.status) = 'pendente'`);
      }
      if (entidade_id) { conditions.push(`lf.entidade_id = $${idx}`); params.push(entidade_id); idx += 1; }
      if (categoria_id) { conditions.push(`lf.categoria_id = $${idx}`); params.push(categoria_id); idx += 1; }
      if (centro_custo_id) { conditions.push(`lf.centro_custo_id = $${idx}`); params.push(centro_custo_id); idx += 1; }
      if (projeto_id) { conditions.push(`lf.projeto_id = $${idx}`); params.push(projeto_id); idx += 1; }
      if (departamento_id) { conditions.push(`lf.departamento_id = $${idx}`); params.push(departamento_id); idx += 1; }
      if (filial_id) { conditions.push(`lf.filial_id = $${idx}`); params.push(filial_id); idx += 1; }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // Consulta principal: buckets
      const listSql = `
        SELECT
          ${bucketLabelCase} AS bucket,
          ${bucketOrderCase} AS bucket_order,
          COUNT(*)::int AS qtd,
          SUM(lf.valor) AS total
        FROM financeiro.lancamentos_financeiros lf
        ${whereClause}
        GROUP BY bucket, bucket_order
        ORDER BY bucket_order ASC
      `.trim();

      const rows = await runQuery<{ bucket: string; bucket_order: number; qtd: number; total: number | null }>(listSql, params);

      // Totais
      const totalSql = `
        SELECT SUM(lf.valor) AS total_geral
        FROM financeiro.lancamentos_financeiros lf
        ${whereClause}
      `.trim();
      const [tot] = await runQuery<{ total_geral: number | null }>(totalSql, params);
      const totalGeral = Number(tot?.total_geral ?? 0);

      const tipoLabel = tipo === 'conta_a_receber' ? 'Contas a Receber' : 'Contas a Pagar';
      const title = `Aging ${tipoLabel} · ${baseDate}` + (somente_pendentes ? ' · Pendentes' : '');
      const message = `Distribuição por faixas: ${rows.length} buckets (Total: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;

      // Mapear para formato simples
      const outRows = rows.map(r => ({ bucket: r.bucket, qtd: r.qtd, total: Number(r.total ?? 0) }));

      return {
        success: true,
        rows: outRows,
        count: outRows.length,
        totals: { total_geral: totalGeral },
        title,
        message,
        sql_query: `${listSql}\n\n-- Totais\n${totalSql}`,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO agingFinanceiro:', error);
      return {
        success: false,
        rows: [],
        count: 0,
        message: `Erro ao gerar aging: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

// ============================================================================
// MOVIMENTOS POR CENTRO DE CUSTO (por período)
// ============================================================================

// Removido: analisarMovimentosPorCentroCusto (substituído por ranking por centro de custo)

// ============================================================================
// LISTAR MOVIMENTOS (por período)
// ============================================================================

const getMovimentos = tool({
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
        title: [
          'Movimentos Financeiros',
          conta_id ? `Conta: ${conta_id}` : undefined,
          tipo ? `Tipo: ${tipo}` : undefined,
          categoria_id ? `Categoria: ${categoria_id}` : undefined,
          (data_inicial || data_final) ? `${data_inicial || '...'} a ${data_final || '...'}` : undefined,
          valor_minimo !== undefined ? `≥ ${Number(valor_minimo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : undefined,
          valor_maximo !== undefined ? `≤ ${Number(valor_maximo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : undefined,
        ].filter(Boolean).join(' · '),
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
