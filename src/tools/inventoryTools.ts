import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;
const MIN_LIMIT = 1;

const INVENTORY_TABLES = [
  'centros_distribuicao',
  'estoque_canal',
  'integracoes_canais',
  'movimentacoes_estoque',
  'precos_canais',
] as const;

type InventoryTable = (typeof INVENTORY_TABLES)[number];

const TABLE_ORDER_COLUMNS: Record<InventoryTable, string> = {
  centros_distribuicao: 'created_at',
  estoque_canal: 'last_updated',
  integracoes_canais: 'last_sync',
  movimentacoes_estoque: 'created_at',
  precos_canais: 'start_date',
};

const TABLE_DATE_COLUMNS: Partial<Record<InventoryTable, { from: string; to?: string }>> = {
  centros_distribuicao: { from: 'created_at' },
  estoque_canal: { from: 'last_updated' },
  integracoes_canais: { from: 'last_sync' },
  movimentacoes_estoque: { from: 'created_at' },
  precos_canais: { from: 'start_date', to: 'end_date' },
};

const normalizeLimit = (limit?: number) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(limit), MIN_LIMIT), MAX_LIMIT);
};

const formatSqlParams = (params: unknown[]) => {
  if (!params.length) return '[]';
  return JSON.stringify(params);
};

const buildGetInventoryDataQuery = (args: {
  table: InventoryTable;
  limit: number;
  ativo?: boolean;
  product_id?: string;
  channel_id?: string;
  tipo?: string;
  quantidade_minima?: number;
  quantidade_maxima?: number;
  data_de?: string;
  data_ate?: string;
}) => {
  const {
    table,
    limit,
    ativo,
    product_id,
    channel_id,
    tipo,
    quantidade_minima,
    quantidade_maxima,
    data_de,
    data_ate,
  } = args;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const push = (clause: string, value: unknown) => {
    conditions.push(`${clause} $${paramIndex}`);
    params.push(value);
    paramIndex += 1;
  };

  if (typeof ativo === 'boolean' && table === 'centros_distribuicao') {
    push('ativo =', ativo);
  }

  if (product_id && (table === 'estoque_canal' || table === 'movimentacoes_estoque' || table === 'precos_canais')) {
    push('product_id =', product_id);
  }

  if (channel_id && (table === 'estoque_canal' || table === 'integracoes_canais' || table === 'precos_canais' || table === 'movimentacoes_estoque')) {
    push('channel_id =', channel_id);
  }

  if (tipo && table === 'movimentacoes_estoque') {
    // Filtra por tipo exato (normalizando em lower no DB)
    conditions.push(`LOWER(type) = LOWER($${paramIndex})`);
    params.push(tipo);
    paramIndex += 1;
  }

  if (typeof quantidade_minima === 'number' && table === 'estoque_canal') {
    push('quantity_available >=', quantidade_minima);
  }

  if (typeof quantidade_maxima === 'number' && table === 'estoque_canal') {
    push('quantity_available <=', quantidade_maxima);
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
  const orderColumn = TABLE_ORDER_COLUMNS[table] ?? 'created_at';

  const limitIndex = paramIndex;
  params.push(limit);

  const sql = `
    SELECT *
    FROM gestaoestoque.${table}
    ${whereClause}
    ORDER BY ${orderColumn} DESC
    LIMIT $${limitIndex}
  `.trim();

  return { sql, params };
};

export const avaliacaoCustoInventario = tool({
  description: 'Avaliação do Estoque: Custo Total por Depósito e Categoria.',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      SELECT
        d.nome AS deposito,
        COALESCE(cat.nome, 'Sem Categoria') AS categoria,
        SUM(s.quantidade_fisica * pv.preco_base) AS valor_total_em_estoque
      FROM estoque.saldos s
      JOIN armazem.depositos d ON s.deposito_id = d.id
      JOIN gestaocatalogo.produto_variacoes pv ON s.produto_variacao_id = pv.id
      JOIN gestaocatalogo.produtos p ON pv.produto_pai_id = p.id
      LEFT JOIN gestaocatalogo.categorias cat ON p.categoria_id = cat.id
      WHERE s.quantidade_fisica > 0
      GROUP BY d.nome, cat.nome
      ORDER BY d.nome, valor_total_em_estoque DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        deposito: string;
        categoria: string | null;
        valor_total_em_estoque: number;
      }>(sql);

      return {
        success: true,
        message: 'Avaliação do estoque por depósito e categoria',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO avaliacaoCustoInventario:', error);
      return {
        success: false,
        message: '❌ Erro na avaliação de custo do inventário',
      };
    }
  },
});

export const calculateInventoryMetrics = tool({
  description: 'Calcula KPIs de inventário: snapshot atual e fluxo recente (entradas/saídas/ajustes)',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período recente para fluxo (dias)'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const snapshotSql = `
      SELECT
        COALESCE(SUM(quantity_available), 0) AS total_disponivel,
        COALESCE(SUM(quantity_reserved), 0) AS total_reservado,
        COALESCE(SUM(quantity_available - quantity_reserved), 0) AS total_on_hand,
        COUNT(DISTINCT product_id) AS skus,
        COUNT(DISTINCT channel_id) AS canais
      FROM gestaoestoque.estoque_canal
    `;

    const fluxoSql = `
      SELECT
        created_at::date AS dia,
        SUM(CASE WHEN LOWER(type) IN ('entrada','in') THEN quantity ELSE 0 END) AS entradas,
        SUM(CASE WHEN LOWER(type) IN ('saida','out') THEN quantity ELSE 0 END) AS saidas,
        SUM(CASE WHEN LOWER(type) LIKE 'ajust%' OR LOWER(type) = 'adjust' THEN quantity ELSE 0 END) AS ajustes
      FROM gestaoestoque.movimentacoes_estoque
      WHERE created_at::date >= CURRENT_DATE - ($1::int - 1)
      GROUP BY dia
      ORDER BY dia
    `;

    try {
      const snap = (await runQuery<{
        total_disponivel: string | number | null;
        total_reservado: string | number | null;
        total_on_hand: string | number | null;
        skus: string | number | null;
        canais: string | number | null;
      }>(snapshotSql))[0] ?? {
        total_disponivel: 0,
        total_reservado: 0,
        total_on_hand: 0,
        skus: 0,
        canais: 0,
      };

      const rows = await runQuery<{
        dia: string;
        entradas: string | number | null;
        saidas: string | number | null;
        ajustes: string | number | null;
      }>(fluxoSql, [range]);

      const series = rows.map(r => ({
        dia: r.dia,
        entradas: Number(r.entradas ?? 0),
        saidas: Number(r.saidas ?? 0),
        ajustes: Number(r.ajustes ?? 0),
      }));

      const totalSaidas = series.reduce((a, r) => a + r.saidas, 0);
      const mediaSaidaDia = range > 0 ? totalSaidas / range : 0;
      const totalDisponivel = Number(snap.total_disponivel ?? 0);
      const totalReservado = Number(snap.total_reservado ?? 0);
      const totalOnHand = Number(snap.total_on_hand ?? 0);
      const estoqueBruto = totalDisponivel + totalReservado;
      const reservadoPercent = estoqueBruto > 0 ? (totalReservado / estoqueBruto) * 100 : 0;
      const coberturaDias = mediaSaidaDia > 0 ? totalOnHand / mediaSaidaDia : null;

      return {
        success: true,
        message: `Snapshot de estoque com fluxo dos últimos ${range} dias`,
        periodo_dias: range,
        metricas: {
          total_disponivel: totalDisponivel,
          total_reservado: totalReservado,
          total_on_hand: totalOnHand,
          skus: Number(snap.skus ?? 0),
          canais: Number(snap.canais ?? 0),
          media_saida_dia: Number(mediaSaidaDia.toFixed(2)),
          cobertura_dias: coberturaDias !== null ? Number(coberturaDias.toFixed(1)) : null,
          reservado_percent: `${reservadoPercent.toFixed(2)}%`,
        },
        rows: series,
        sql_query: fluxoSql,
        sql_params: formatSqlParams([range]),
        sql_queries: [
          { name: 'snapshot', sql: snapshotSql, params: [] },
          { name: 'fluxo', sql: fluxoSql, params: [range] },
        ],
      };
    } catch (error) {
      console.error('ERRO calculateInventoryMetrics:', error);
      return {
        success: false,
        message: `❌ Erro ao calcular métricas de inventário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const abcDetalhadaProduto = tool({
  description: 'Classificação ABC detalhada por produto (receita acumulada).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH receita_por_produto AS (
        SELECT
          ip.produto_id,
          SUM(ip.quantidade * ip.preco_unitario) AS receita_produto
        FROM gestaovendas.itens_pedido ip
        JOIN gestaovendas.pedidos p ON ip.pedido_id = p.id
        WHERE p.status != 'CANCELADO'
        GROUP BY ip.produto_id
        HAVING SUM(ip.quantidade * ip.preco_unitario) > 0
      ),
      contribuicao_acumulada AS (
        SELECT
          produto_id,
          receita_produto,
          SUM(receita_produto) OVER () AS receita_geral_total,
          SUM(receita_produto) OVER (ORDER BY receita_produto DESC) AS receita_acumulada
        FROM receita_por_produto
      )
      SELECT
        p.nome,
        pv.sku,
        ca.receita_produto,
        (ca.receita_produto / ca.receita_geral_total) * 100 AS percentual_da_receita_total,
        (ca.receita_acumulada / ca.receita_geral_total) * 100 AS percentual_acumulado,
        CASE
          WHEN (ca.receita_acumulada / ca.receita_geral_total) * 100 <= 80 THEN 'A'
          WHEN (ca.receita_acumulada / ca.receita_geral_total) * 100 <= 95 THEN 'B'
          ELSE 'C'
        END AS curva_abc
      FROM contribuicao_acumulada ca
      JOIN gestaocatalogo.produto_variacoes pv ON ca.produto_id = pv.id
      JOIN gestaocatalogo.produtos p ON pv.produto_pai_id = p.id
      ORDER BY ca.receita_produto DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        nome: string;
        sku: string | null;
        receita_produto: number;
        percentual_da_receita_total: number;
        percentual_acumulado: number;
        curva_abc: string;
      }>(sql);

      return {
        success: true,
        message: 'ABC detalhada por produto',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO abcDetalhadaProduto:', error);
      return {
        success: false,
        message: '❌ Erro na ABC detalhada por produto',
      };
    }
  },
});

export const analiseDOS = tool({
  description: 'Dias de Estoque (DOS): estoque disponível vs média de vendas diárias (60 dias).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH vendas_diarias AS (
        SELECT
          ip.produto_id,
          SUM(ip.quantidade) / 60.0 AS media_vendas_diaria
        FROM gestaovendas.itens_pedido ip
        JOIN gestaovendas.pedidos p ON ip.pedido_id = p.id
        WHERE p.data_pedido >= (CURRENT_DATE - INTERVAL '60 days')
          AND p.status != 'CANCELADO'
        GROUP BY ip.produto_id
      ),
      estoque_disponivel AS (
        SELECT
          produto_variacao_id,
          SUM(quantidade_fisica - quantidade_reservada) AS disponivel
        FROM estoque.saldos
        GROUP BY produto_variacao_id
      )
      SELECT
        p.nome,
        pv.sku,
        ed.disponivel AS estoque_atual,
        vd.media_vendas_diaria,
        CASE
          WHEN vd.media_vendas_diaria > 0 THEN ROUND(ed.disponivel / vd.media_vendas_diaria, 1)
          ELSE NULL
        END AS dias_de_estoque_restantes
      FROM vendas_diarias vd
      JOIN estoque_disponivel ed ON vd.produto_id = ed.produto_variacao_id
      JOIN gestaocatalogo.produto_variacoes pv ON vd.produto_id = pv.id
      JOIN gestaocatalogo.produtos p ON pv.produto_pai_id = p.id
      WHERE ed.disponivel > 0
      ORDER BY dias_de_estoque_restantes ASC
      LIMIT 15;
    `.trim();

    try {
      const rows = await runQuery<{
        nome: string;
        sku: string | null;
        estoque_atual: number;
        media_vendas_diaria: number;
        dias_de_estoque_restantes: number | null;
      }>(sql);

      return {
        success: true,
        message: 'Dias de Estoque (DOS) — produtos críticos',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO analiseDOS:', error);
      return {
        success: false,
        message: '❌ Erro ao calcular DOS',
      };
    }
  },
});

export const abcResumoGerencial = tool({
  description: 'Resumo gerencial da Curva ABC (distribuição de SKUs e receita por classe).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH receita_por_produto AS (
        SELECT
          ip.produto_id,
          SUM(ip.quantidade * ip.preco_unitario) AS receita_produto
        FROM gestaovendas.itens_pedido ip
        JOIN gestaovendas.pedidos p ON ip.pedido_id = p.id
        WHERE p.status != 'CANCELADO'
        GROUP BY ip.produto_id
        HAVING SUM(ip.quantidade * ip.preco_unitario) > 0
      ),
      contribuicao_acumulada AS (
        SELECT
          produto_id,
          receita_produto,
          SUM(receita_produto) OVER () AS receita_geral_total,
          SUM(receita_produto) OVER (ORDER BY receita_produto DESC) AS receita_acumulada
        FROM receita_por_produto
      ),
      produtos_classificados AS (
        SELECT
          produto_id,
          receita_produto,
          CASE
            WHEN (receita_acumulada / receita_geral_total) * 100 <= 80 THEN 'A'
            WHEN (receita_acumulada / receita_geral_total) * 100 <= 95 THEN 'B'
            ELSE 'C'
          END AS curva_abc
        FROM contribuicao_acumulada
      )
      SELECT
        curva_abc,
        COUNT(produto_id) AS numero_de_skus,
        (COUNT(produto_id)::numeric / (SELECT COUNT(*) FROM produtos_classificados)::numeric) * 100 AS percentual_de_skus,
        SUM(receita_produto) AS receita_total_da_curva,
        (SUM(receita_produto) / (SELECT SUM(receita_produto) FROM produtos_classificados)) * 100 AS percentual_da_receita_total
      FROM produtos_classificados
      GROUP BY curva_abc
      ORDER BY curva_abc;
    `.trim();

    try {
      const rows = await runQuery<{
        curva_abc: string;
        numero_de_skus: number;
        percentual_de_skus: number;
        receita_total_da_curva: number;
        percentual_da_receita_total: number;
      }>(sql);

      return {
        success: true,
        message: 'Resumo gerencial da Curva ABC',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO abcResumoGerencial:', error);
      return {
        success: false,
        message: '❌ Erro no resumo da Curva ABC',
      };
    }
  },
});

export const desempenhoPorDepositoExpedicoes = tool({
  description: 'Desempenho por Depósito (origem das expedições).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      SELECT
        d.nome AS deposito_de_origem,
        COUNT(DISTINCT ex.id) AS total_pacotes_enviados,
        SUM(ei.quantidade) AS total_itens_enviados,
        AVG(p.valor_total) AS ticket_medio_dos_pedidos
      FROM logistica.expedicoes ex
      JOIN logistica.expedicoes_itens ei ON ex.id = ei.expedicao_id
      JOIN armazem.depositos d ON ex.deposito_id = d.id
      JOIN gestaovendas.pedidos p ON ex.pedido_id = p.id
      GROUP BY d.nome
      ORDER BY total_itens_enviados DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        deposito_de_origem: string;
        total_pacotes_enviados: number;
        total_itens_enviados: number;
        ticket_medio_dos_pedidos: number;
      }>(sql);

      return {
        success: true,
        message: 'Desempenho por Depósito (expedições)',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO desempenhoPorDepositoExpedicoes:', error);
      return {
        success: false,
        message: '❌ Erro ao analisar desempenho por depósito',
      };
    }
  },
});

export const analiseGiroEstoque = tool({
  description: 'Análise de Giro de Estoque (vendas vs estoque atual).',
  inputSchema: z.object({
    period_months: z.number().int().min(1).max(24).default(6)
      .describe('Número de meses para calcular vendas no período'),
  }).optional(),
  execute: async ({ period_months = 6 } = {}) => {
    const sql = `
      WITH vendas_no_periodo AS (
        SELECT
          ip.produto_id,
          SUM(ip.quantidade) AS unidades_vendidas
        FROM gestaovendas.itens_pedido ip
        JOIN gestaovendas.pedidos p ON ip.pedido_id = p.id
        WHERE p.data_pedido >= (CURRENT_DATE - ($1::int || ' months')::interval)
        GROUP BY ip.produto_id
      ),
      estoque_medio AS (
        SELECT
          produto_variacao_id,
          SUM(quantidade_fisica) AS estoque_atual
        FROM estoque.saldos
        GROUP BY produto_variacao_id
      )
      SELECT
        p.nome,
        pv.sku,
        v.unidades_vendidas,
        e.estoque_atual,
        ROUND(v.unidades_vendidas / NULLIF(e.estoque_atual, 0), 2) AS giro_de_estoque
      FROM vendas_no_periodo v
      JOIN estoque_medio e ON v.produto_id = e.produto_variacao_id
      JOIN gestaocatalogo.produto_variacoes pv ON v.produto_id = pv.id
      JOIN gestaocatalogo.produtos p ON pv.produto_pai_id = p.id
      WHERE e.estoque_atual > 0
      ORDER BY giro_de_estoque DESC
      LIMIT 15;
    `.trim();

    try {
      const rows = await runQuery<{
        nome: string;
        sku: string | null;
        unidades_vendidas: number;
        estoque_atual: number;
        giro_de_estoque: number;
      }>(sql, [period_months]);

      return {
        success: true,
        message: `Giro de estoque (vendas últimos ${period_months} meses)`,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([period_months]),
      };
    } catch (error) {
      console.error('ERRO analiseGiroEstoque:', error);
      return {
        success: false,
        message: '❌ Erro ao calcular giro de estoque',
      };
    }
  },
});

export const detectAnomalies = tool({
  description: 'Detecta anomalias nas saídas diárias (z-score) e aponta riscos',
  inputSchema: z.object({
    date_range_days: z.number().default(30),
    sensitivity: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  execute: async ({ date_range_days = 30, sensitivity = 'medium' }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 7), 365);
    const threshold = sensitivity === 'high' ? 1.5 : sensitivity === 'low' ? 3 : 2;
    const sql = `
      SELECT created_at::date AS dia,
             SUM(quantity) AS saidas
      FROM gestaoestoque.movimentacoes_estoque
      WHERE created_at::date >= CURRENT_DATE - ($1::int - 1)
        AND LOWER(type) IN ('saida','out')
      GROUP BY dia
      ORDER BY dia
    `;

    try {
      const rows = await runQuery<{ dia: string; saidas: string | number | null }>(sql, [range]);
      if (!rows.length) {
        return {
          success: false,
          message: 'Dados insuficientes para análise de anomalias',
          sql_query: sql,
          sql_params: formatSqlParams([range]),
        };
      }

      const values = rows.map(r => Number(r.saidas ?? 0));
      const mean = values.reduce((a, v) => a + v, 0) / values.length;
      const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length;
      const deviation = Math.sqrt(variance);

      const anomalies = rows
        .map(r => {
          const val = Number(r.saidas ?? 0);
          const z = deviation > 0 ? (val - mean) / deviation : 0;
          if (Math.abs(z) <= threshold) return null;
          return {
            data: r.dia,
            saidas: val,
            media: Math.round(mean),
            z_score: z.toFixed(2),
            tipo: z > 0 ? 'Pico de saída' : 'Queda de saída',
            severidade: Math.abs(z) > threshold * 1.5 ? 'CRÍTICA' : 'ALTA',
          };
        })
        .filter(Boolean) as Array<{ data: string; saidas: number; media: number; z_score: string; tipo: string; severidade: string }>;

      const stockNegativoSql = `
        SELECT product_id, SUM(quantity_available - quantity_reserved) AS on_hand
        FROM gestaoestoque.estoque_canal
        GROUP BY product_id
        HAVING SUM(quantity_available - quantity_reserved) < 0
      `;
      const reservadoMaiorSql = `
        SELECT id, product_id, channel_id
        FROM gestaoestoque.estoque_canal
        WHERE quantity_reserved > quantity_available
      `;

      const negativos = await runQuery<{ product_id: string; on_hand: string | number | null }>(stockNegativoSql);
      const reservados = await runQuery<{ id: string; product_id: string; channel_id: string }>(reservadoMaiorSql);

      const red_flags: string[] = [];
      if (negativos.length > 0) red_flags.push(`${negativos.length} produto(s) com estoque negativo`);
      if (reservados.length > 0) red_flags.push(`${reservados.length} registro(s) com reservado > disponível`);

      return {
        success: true,
        message: `${anomalies.length} anomalias em saídas detectadas`,
        periodo_dias: range,
        sensitivity: threshold,
        anomalias: anomalies,
        red_flags,
        rows: anomalies,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
        sql_queries: [
          { name: 'series_saidas', sql, params: [range] },
          { name: 'estoque_negativo', sql: stockNegativoSql, params: [] },
          { name: 'reservado_maior_que_disponivel', sql: reservadoMaiorSql, params: [] },
        ],
      };
    } catch (error) {
      console.error('ERRO detectAnomalies (inventory):', error);
      return {
        success: false,
        message: `❌ Erro ao detectar anomalias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
