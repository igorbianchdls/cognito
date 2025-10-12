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

export const getInventoryData = tool({
  description: 'Busca dados de gestão de estoque (centros, estoque por canal, movimentações, preços).',
  inputSchema: z.object({
    table: z.enum(INVENTORY_TABLES).describe('Tabela a consultar'),
    limit: z.number().default(DEFAULT_LIMIT).describe('Número máximo de resultados'),
    ativo: z.boolean().optional(),
    product_id: z.string().optional(),
    channel_id: z.string().optional(),
    tipo: z.string().optional(),
    quantidade_minima: z.number().optional(),
    quantidade_maxima: z.number().optional(),
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
  }),
  execute: async (input) => {
    let sql: string | null = null;
    let params: unknown[] = [];
    try {
      const limit = normalizeLimit(input.limit);
      const query = buildGetInventoryDataQuery({ ...input, limit, table: input.table });
      sql = query.sql;
      params = query.params;
      const rows = await runQuery<Record<string, unknown>>(sql, params);

      return {
        success: true,
        count: rows.length,
        table: input.table,
        message: `✅ ${rows.length} registros encontrados em ${input.table}`,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO getInventoryData:', error);
      return {
        success: false,
        table: input.table,
        message: `❌ Erro ao buscar dados de ${input.table}`,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
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

export const analyzeStockMovementTrends = tool({
  description: 'Analisa tendências de movimentação de estoque por período e tipo',
  inputSchema: z.object({
    product_id: z.string().optional(),
    period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
    lookback_days: z.number().default(30),
  }),
  execute: async ({ product_id, period = 'weekly', lookback_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(lookback_days), 1), 365);
    const truncUnit = period === 'daily' ? 'day' : period === 'monthly' ? 'month' : 'week';

    const sql = `
      SELECT
        date_trunc($1, created_at) AS periodo,
        LOWER(type) AS tipo,
        SUM(quantity) AS quantidade
      FROM gestaoestoque.movimentacoes_estoque
      WHERE created_at::date >= CURRENT_DATE - ($2::int - 1)
        ${product_id ? 'AND product_id = $3' : ''}
      GROUP BY periodo, tipo
      ORDER BY periodo, tipo
    `;

    const params: unknown[] = [truncUnit, range];
    if (product_id) params.push(product_id);

    try {
      const rows = await runQuery<{ periodo: string; tipo: string | null; quantidade: string | number | null }>(sql, params);
      const formatted = rows.map(r => ({
        periodo: r.periodo,
        tipo: r.tipo ?? 'desconhecido',
        quantidade: Number(r.quantidade ?? 0),
      }));

      return {
        success: true,
        message: `Tendências de ${period} nos últimos ${range} dias` ,
        periodo_dias: range,
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO analyzeStockMovementTrends:', error);
      return {
        success: false,
        message: `❌ Erro ao analisar movimentações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const forecastRestockNeeds = tool({
  description: 'Prevê necessidades de reposição por produto com base no consumo médio diário',
  inputSchema: z.object({
    forecast_days: z.number().default(30).describe('Dias de cobertura desejada'),
    lookback_days: z.number().default(30).describe('Período para média de saídas'),
    confidence_level: z.enum(['low', 'medium', 'high']).default('medium').optional(),
  }),
  execute: async ({ forecast_days = 30, lookback_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(lookback_days), 1), 365);
    const sql = `
      WITH outflow AS (
        SELECT product_id,
               SUM(CASE WHEN LOWER(type) IN ('saida','out') THEN quantity ELSE 0 END) AS saidas_periodo
        FROM gestaoestoque.movimentacoes_estoque
        WHERE created_at::date >= CURRENT_DATE - ($1::int - 1)
        GROUP BY product_id
      ),
      stock AS (
        SELECT product_id,
               SUM(quantity_available - quantity_reserved) AS on_hand
        FROM gestaoestoque.estoque_canal
        GROUP BY product_id
      )
      SELECT s.product_id,
             COALESCE(s.on_hand, 0) AS on_hand,
             ROUND(COALESCE(o.saidas_periodo,0)::numeric / NULLIF($1::int, 0), 2) AS media_saida_dia,
             CASE
               WHEN COALESCE(o.saidas_periodo,0) = 0 THEN NULL
               ELSE ROUND(COALESCE(s.on_hand,0)::numeric / NULLIF((COALESCE(o.saidas_periodo,0)::numeric / NULLIF($1::int,1)),0), 1)
             END AS cobertura_dias,
             GREATEST(($2::int - COALESCE(ROUND(COALESCE(s.on_hand,0)::numeric / NULLIF((COALESCE(o.saidas_periodo,0)::numeric / NULLIF($1::int,1)),0), 0), 0)), 0) AS sugerido_repor
      FROM stock s
      LEFT JOIN outflow o USING (product_id)
      WHERE COALESCE(s.on_hand, 0) >= 0
      ORDER BY sugerido_repor DESC NULLS LAST
    `;

    try {
      const rows = await runQuery<{
        product_id: string;
        on_hand: string | number | null;
        media_saida_dia: string | number | null;
        cobertura_dias: string | number | null;
        sugerido_repor: string | number | null;
      }>(sql, [range, forecast_days]);

      const formatted = rows.map(r => ({
        product_id: r.product_id,
        on_hand: Number(r.on_hand ?? 0),
        media_saida_dia: Number(r.media_saida_dia ?? 0),
        cobertura_dias: r.cobertura_dias !== null ? Number(r.cobertura_dias) : null,
        sugerido_repor: r.sugerido_repor !== null ? Number(r.sugerido_repor) : null,
      }));

      return {
        success: true,
        message: `Necessidades de reposição considerando ${range} dias de histórico e meta de ${forecast_days} dias`,
        periodo_dias: range,
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams([range, forecast_days]),
      };
    } catch (error) {
      console.error('ERRO forecastRestockNeeds:', error);
      return {
        success: false,
        message: `❌ Erro ao prever reposição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const identifySlowMovingItems = tool({
  description: 'Identifica itens com estoque parado (sem movimentos recentes) e saldo em mãos',
  inputSchema: z.object({
    min_days_no_movement: z.number().default(90),
    min_on_hand: z.number().default(0),
  }),
  execute: async ({ min_days_no_movement = 90, min_on_hand = 0 }) => {
    const sql = `
      WITH last_mv AS (
        SELECT product_id, MAX(created_at)::date AS ultima_mov
        FROM gestaoestoque.movimentacoes_estoque
        GROUP BY product_id
      ),
      stock AS (
        SELECT product_id,
               SUM(quantity_available - quantity_reserved) AS on_hand
        FROM gestaoestoque.estoque_canal
        GROUP BY product_id
      )
      SELECT s.product_id, COALESCE(s.on_hand,0) AS on_hand, lm.ultima_mov,
             (CURRENT_DATE - lm.ultima_mov) AS dias_sem_mov
      FROM stock s
      LEFT JOIN last_mv lm USING (product_id)
      WHERE COALESCE(s.on_hand,0) > $1
        AND (lm.ultima_mov IS NULL OR (CURRENT_DATE - lm.ultima_mov) >= $2)
      ORDER BY dias_sem_mov DESC NULLS LAST, on_hand DESC
    `;

    try {
      const rows = await runQuery<{ product_id: string; on_hand: string | number | null; ultima_mov: string | null; dias_sem_mov: string | number | null }>(sql, [min_on_hand, min_days_no_movement]);
      const formatted = rows.map(r => ({
        product_id: r.product_id,
        on_hand: Number(r.on_hand ?? 0),
        ultima_mov: r.ultima_mov,
        dias_sem_mov: r.dias_sem_mov !== null ? Number(r.dias_sem_mov) : null,
      }));

      return {
        success: true,
        message: `Itens com mais de ${min_days_no_movement} dias sem movimento e saldo > ${min_on_hand}`,
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams([min_on_hand, min_days_no_movement]),
      };
    } catch (error) {
      console.error('ERRO identifySlowMovingItems:', error);
      return {
        success: false,
        message: `❌ Erro ao identificar itens de baixo giro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const compareChannelPerformance = tool({
  description: 'Compara performance por canal: saldo disponível, reservado, consumo médio e cobertura',
  inputSchema: z.object({
    date_range_days: z.number().default(30),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);
    const sql = `
      WITH stock AS (
        SELECT channel_id,
               SUM(quantity_available) AS disponivel,
               SUM(quantity_reserved) AS reservado
        FROM gestaoestoque.estoque_canal
        GROUP BY channel_id
      ),
      outflow AS (
        SELECT channel_id,
               SUM(CASE WHEN LOWER(type) IN ('saida','out') THEN quantity ELSE 0 END) AS saidas_periodo
        FROM gestaoestoque.movimentacoes_estoque
        WHERE created_at::date >= CURRENT_DATE - ($1::int - 1)
        GROUP BY channel_id
      )
      SELECT s.channel_id,
             COALESCE(s.disponivel,0) AS disponivel,
             COALESCE(s.reservado,0) AS reservado,
             COALESCE(o.saidas_periodo,0) AS saidas_periodo,
             ROUND(COALESCE(o.saidas_periodo,0)::numeric / NULLIF($1::int, 0), 2) AS media_saida_dia,
             CASE
               WHEN COALESCE(o.saidas_periodo,0) = 0 THEN NULL
               ELSE ROUND(COALESCE(s.disponivel,0)::numeric / NULLIF((COALESCE(o.saidas_periodo,0)::numeric / NULLIF($1::int,1)),0), 1)
             END AS cobertura_dias
      FROM stock s
      LEFT JOIN outflow o USING (channel_id)
      ORDER BY disponivel DESC
    `;

    try {
      const rows = await runQuery<{
        channel_id: string;
        disponivel: string | number | null;
        reservado: string | number | null;
        saidas_periodo: string | number | null;
        media_saida_dia: string | number | null;
        cobertura_dias: string | number | null;
      }>(sql, [range]);

      const formatted = rows.map(r => ({
        channel_id: r.channel_id,
        disponivel: Number(r.disponivel ?? 0),
        reservado: Number(r.reservado ?? 0),
        saidas_periodo: Number(r.saidas_periodo ?? 0),
        media_saida_dia: Number(r.media_saida_dia ?? 0),
        cobertura_dias: r.cobertura_dias !== null ? Number(r.cobertura_dias) : null,
      }));

      return {
        success: true,
        message: `Comparativo por canal nos últimos ${range} dias` ,
        periodo_dias: range,
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO compareChannelPerformance:', error);
      return {
        success: false,
        message: `❌ Erro ao comparar canais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const generateABCAnalysis = tool({
  description: 'Gera análise ABC por produto, com base em valor (ou quantidade) de saídas no período',
  inputSchema: z.object({
    criteria: z.enum(['value', 'quantity']).default('value'),
    period_days: z.number().default(90),
  }),
  execute: async ({ criteria = 'value', period_days = 90 }) => {
    const range = Math.min(Math.max(Math.trunc(period_days), 1), 365);
    const sql = `
      WITH outflow AS (
        SELECT product_id, SUM(CASE WHEN LOWER(type) IN ('saida','out') THEN quantity ELSE 0 END) AS qtd_saida
        FROM gestaoestoque.movimentacoes_estoque
        WHERE created_at::date >= CURRENT_DATE - ($1::int - 1)
        GROUP BY product_id
      ),
      last_price AS (
        SELECT DISTINCT ON (product_id) product_id, price
        FROM gestaoestoque.precos_canais
        WHERE start_date::date <= CURRENT_DATE
        ORDER BY product_id, COALESCE(end_date, NOW()) DESC, start_date DESC
      ),
      valor AS (
        SELECT o.product_id,
               o.qtd_saida,
               COALESCE(lp.price, 0) AS preco_ref,
               (o.qtd_saida * COALESCE(lp.price, 0)) AS valor_saida
        FROM outflow o
        LEFT JOIN last_price lp USING (product_id)
      ),
      base AS (
        SELECT product_id,
               qtd_saida,
               preco_ref,
               valor_saida,
               CASE WHEN $2 = 'quantity' THEN qtd_saida ELSE valor_saida END AS chave
        FROM valor
      ),
      ranked AS (
        SELECT b.*, 
               SUM(chave) OVER () AS total_valor,
               SUM(chave) OVER (ORDER BY chave DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS acumulado
        FROM base b
      )
      SELECT product_id, qtd_saida, preco_ref, valor_saida,
             ROUND((acumulado::numeric / NULLIF(total_valor,0)) * 100, 2) AS pct_acumulado,
             CASE
               WHEN acumulado / NULLIF(total_valor,0) <= 0.8 THEN 'A'
               WHEN acumulado / NULLIF(total_valor,0) <= 0.95 THEN 'B'
               ELSE 'C'
             END AS classe_abc
      FROM ranked
      ORDER BY valor_saida DESC NULLS LAST
    `;

    try {
      const rows = await runQuery<{
        product_id: string;
        qtd_saida: string | number | null;
        preco_ref: string | number | null;
        valor_saida: string | number | null;
        pct_acumulado: string | number | null;
        classe_abc: string;
      }>(sql, [range, criteria]);

      const formatted = rows.map(r => ({
        product_id: r.product_id,
        qtd_saida: Number(r.qtd_saida ?? 0),
        preco_ref: Number(r.preco_ref ?? 0),
        valor_saida: Number(r.valor_saida ?? 0),
        pct_acumulado: Number(r.pct_acumulado ?? 0),
        classe_abc: r.classe_abc,
      }));

      return {
        success: true,
        message: `Análise ABC por ${criteria} nos últimos ${range} dias` ,
        periodo_dias: range,
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams([range, criteria]),
      };
    } catch (error) {
      console.error('ERRO generateABCAnalysis:', error);
      return {
        success: false,
        message: `❌ Erro ao gerar análise ABC: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
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
        anomalias,
        red_flags,
        rows: anomalies,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
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
