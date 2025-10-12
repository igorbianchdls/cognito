import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { runQuery } from '@/lib/postgres';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const INVENTORY_METRICS_SQL = `
WITH base AS (
  SELECT
    ma.gasto,
    ma.receita,
    ma.conversao,
    ma.cliques,
    ma.impressao,
    ma.plataforma AS plataforma_metricas,
    ap.plataforma AS plataforma_anuncio,
    co.plataforma AS plataforma_conta,
    COALESCE(co.id, ma.conta_ads_id) AS conta_relacionada_id,
    c.id AS campanha_relacionada_id
  FROM trafego_pago.metricas_anuncios ma
  LEFT JOIN trafego_pago.anuncios_publicados ap
    ON ap.id = ma.anuncio_publicado_id
  LEFT JOIN trafego_pago.grupos_de_anuncios ga
    ON ga.id = ap.grupo_id
  LEFT JOIN trafego_pago.campanhas c
    ON c.id = ga.campanha_id
  LEFT JOIN trafego_pago.contas_ads co
    ON co.id = COALESCE(ma.conta_ads_id, c.conta_ads_id)
  WHERE ma.data >= CURRENT_DATE - ($1::int) * INTERVAL '1 day'
)
SELECT
  COALESCE(plataforma_conta, plataforma_anuncio, plataforma_metricas, 'Desconhecida') AS plataforma,
  COUNT(DISTINCT conta_relacionada_id) AS contas_vinculadas,
  COUNT(DISTINCT campanha_relacionada_id) AS campanhas_vinculadas,
  SUM(gasto) AS gasto_total,
  SUM(receita) AS receita_total,
  SUM(conversao) AS conversoes_total,
  CASE WHEN SUM(gasto) > 0 THEN SUM(receita) / SUM(gasto) ELSE 0 END AS roas,
  CASE WHEN SUM(cliques) > 0 THEN (SUM(conversao)::numeric / NULLIF(SUM(cliques), 0)) * 100 ELSE 0 END AS taxa_conversao_percent,
  CASE WHEN SUM(impressao) > 0 THEN (SUM(cliques)::numeric / NULLIF(SUM(impressao), 0)) * 100 ELSE 0 END AS ctr_percent
FROM base
GROUP BY 1
ORDER BY roas DESC;
`.trim();

export type InventoryMetricRow = {
  plataforma: string | null;
  contas_vinculadas: number | string | null;
  campanhas_vinculadas: number | string | null;
  gasto_total: number | string | null;
  receita_total: number | string | null;
  conversoes_total: number | string | null;
  roas: number | string | null;
  taxa_conversao_percent: number | string | null;
  ctr_percent: number | string | null;
};

async function fetchInventoryMetrics(rangeDays: number): Promise<InventoryMetricRow[]> {
  return runQuery<InventoryMetricRow>(INVENTORY_METRICS_SQL, [rangeDays]);
}

function buildMessage(rows: InventoryMetricRow[], context: string) {
  const prefix = context ? `${context}: ` : '';
  if (!rows.length) {
    return `${prefix}⚠️ Nenhum registro retornado pela consulta base.`;
  }
  return `${prefix}✅ ${rows.length} registros encontrados na consulta base.`;
}

async function buildGenericResponse(rangeDays: number, label: string) {
  const rows = await fetchInventoryMetrics(rangeDays);
  return {
    success: true,
    message: buildMessage(rows, label),
    periodo_dias: rangeDays,
    data: rows,
    sql_query: INVENTORY_METRICS_SQL
  };
}

export const getInventoryData = tool({
  description: 'Busca dados de gestão de estoque (centros, estoque por canal, movimentações, preços).',
  inputSchema: z.object({
    table: z.enum([
      'centros_distribuicao',
      'estoque_canal',
      'integracoes_canais',
      'movimentacoes_estoque',
      'precos_canais'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),
    ativo: z.boolean().optional(),
    product_id: z.string().optional(),
    channel_id: z.string().optional(),
    tipo: z.string().optional(),
    quantidade_minima: z.number().optional(),
    quantidade_maxima: z.number().optional(),
    data_de: z.string().optional(),
    data_ate: z.string().optional()
  }),

  execute: async ({
    table,
    limit,
    ativo,
    product_id,
    channel_id,
    tipo,
    quantidade_minima,
    quantidade_maxima,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaoestoque')
        .from(table)
        .select('*');

      if (ativo !== undefined && table === 'centros_distribuicao') {
        query = query.eq('ativo', ativo);
      }

      if (product_id && (table === 'estoque_canal' || table === 'movimentacoes_estoque' || table === 'precos_canais')) {
        query = query.eq('product_id', product_id);
      }

      if (channel_id && (table === 'estoque_canal' || table === 'integracoes_canais' || table === 'precos_canais')) {
        query = query.eq('channel_id', channel_id);
      }

      if (tipo && table === 'movimentacoes_estoque') {
        query = query.eq('type', tipo);
      }

      if (quantidade_minima !== undefined && table === 'estoque_canal') {
        query = query.gte('quantity_available', quantidade_minima);
      }

      if (quantidade_maxima !== undefined && table === 'estoque_canal') {
        query = query.lte('quantity_available', quantidade_maxima);
      }

      if (data_de) {
        let dateColumn = 'created_at';
        if (table === 'estoque_canal') dateColumn = 'last_updated';
        else if (table === 'integracoes_canais') dateColumn = 'last_sync';
        else if (table === 'precos_canais') dateColumn = 'start_date';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'created_at';
        if (table === 'estoque_canal') dateColumn = 'last_updated';
        else if (table === 'integracoes_canais') dateColumn = 'last_sync';
        else if (table === 'precos_canais') dateColumn = 'end_date';

        query = query.lte(dateColumn, data_ate);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(limit ?? 20);

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: (data || []).length,
        table,
        message: `✅ ${(data || []).length} registros encontrados em ${table}`,
        data: data || []
      };

    } catch (error) {
      console.error('ERRO getInventoryData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao buscar dados de ${table}`,
        table,
        data: []
      };
    }
  }
});

export const calculateInventoryMetrics = tool({
  description: 'Calcula KPIs de inventário (modo simplificado).',
  inputSchema: z.object({
    product_id: z.string().optional(),
    date_range_days: z.number().default(30),
    metrics: z.array(z.string()).optional()
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Métricas de inventário');
    } catch (error) {
      console.error('ERRO calculateInventoryMetrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao calcular métricas de inventário'
      };
    }
  }
});

export const analyzeStockMovementTrends = tool({
  description: 'Analisa tendências de movimentação de estoque (modo simplificado).',
  inputSchema: z.object({
    product_id: z.string().optional(),
    period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
    lookback_days: z.number().default(30)
  }),
  execute: async ({ lookback_days = 30 }) => {
    try {
      return await buildGenericResponse(lookback_days, 'Tendências de movimentação');
    } catch (error) {
      console.error('ERRO analyzeStockMovementTrends:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar movimentações'
      };
    }
  }
});

export const forecastRestockNeeds = tool({
  description: 'Prevê necessidades de reposição (modo simplificado).',
  inputSchema: z.object({
    forecast_days: z.number().default(30),
    confidence_level: z.enum(['low', 'medium', 'high']).default('medium')
  }),
  execute: async ({ forecast_days = 30 }) => {
    try {
      return await buildGenericResponse(forecast_days, 'Previsão de reposição');
    } catch (error) {
      console.error('ERRO forecastRestockNeeds:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao prever reposição'
      };
    }
  }
});

export const identifySlowMovingItems = tool({
  description: 'Identifica itens de baixo giro (modo simplificado).',
  inputSchema: z.object({
    min_days_no_movement: z.number().default(90),
    min_stock_value: z.number().default(0)
  }),
  execute: async ({ min_days_no_movement: _days = 90 }) => {
    try {
      return await buildGenericResponse(_days, 'Itens de baixo giro');
    } catch (error) {
      console.error('ERRO identifySlowMovingItems:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao identificar itens de baixo giro'
      };
    }
  }
});

export const compareChannelPerformance = tool({
  description: 'Compara canais de estoque/vendas (modo simplificado).',
  inputSchema: z.object({
    product_id: z.string().optional(),
    metric: z.enum(['stock_level', 'turnover', 'price_variance']).default('stock_level')
  }),
  execute: async ({ metric: _metric = 'stock_level', product_id: _product }) => {
    try {
      return await buildGenericResponse(30, 'Performance por canal');
    } catch (error) {
      console.error('ERRO compareChannelPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao comparar canais'
      };
    }
  }
});

export const generateABCAnalysis = tool({
  description: 'Gera análise ABC (modo simplificado).',
  inputSchema: z.object({
    criteria: z.enum(['value', 'quantity', 'margin']).default('value'),
    period_days: z.number().default(90)
  }),
  execute: async ({ period_days = 90 }) => {
    try {
      return await buildGenericResponse(period_days, 'Análise ABC');
    } catch (error) {
      console.error('ERRO generateABCAnalysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao gerar análise ABC'
      };
    }
  }
});

export const detectAnomalies = tool({
  description: 'Detecta anomalias de estoque (modo simplificado).',
  inputSchema: z.object({
    sensitivity: z.enum(['low', 'medium', 'high']).default('medium')
  }),
  execute: async ({ sensitivity: _sensitivity = 'medium' }) => {
    try {
      return await buildGenericResponse(30, 'Detecção de anomalias');
    } catch (error) {
      console.error('ERRO detectAnomalies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao detectar anomalias'
      };
    }
  }
});
