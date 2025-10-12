import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const ECOMMERCE_METRICS_SQL = `
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

export type EcommerceMetricRow = {
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

async function fetchEcommerceMetrics(rangeDays: number): Promise<EcommerceMetricRow[]> {
  return runQuery<EcommerceMetricRow>(ECOMMERCE_METRICS_SQL, [rangeDays]);
}

function buildMessage(rows: EcommerceMetricRow[], context: string) {
  const prefix = context ? `${context}: ` : '';
  if (!rows.length) {
    return `${prefix}⚠️ Nenhum registro retornado pela consulta base.`;
  }
  return `${prefix}✅ ${rows.length} registros encontrados na consulta base.`;
}

async function buildGenericResponse(rangeDays: number, label: string) {
  const rows = await fetchEcommerceMetrics(rangeDays);
  return {
    success: true,
    message: buildMessage(rows, label),
    periodo_dias: rangeDays,
    data: rows,
    sql_query: ECOMMERCE_METRICS_SQL
  };
}

export const getEcommerceSalesData = tool({
  description: 'Busca dados brutos do e-commerce (consulta base simplificada).',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período em dias a ser analisado'),
    table: z.string().optional()
      .describe('Mantido por compatibilidade, atualmente ignorado'),
    limit: z.number().default(20).describe('Mantido por compatibilidade, atualmente ignorado')
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Dados de e-commerce');
    } catch (error) {
      console.error('ERRO getEcommerceSalesData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao buscar dados de e-commerce'
      };
    }
  }
});

export const getRevenueMetrics = tool({
  description: 'Calcula métricas de receita (modo simplificado).',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período em dias a ser analisado'),
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
    comparar_com_periodo_anterior: z.boolean().optional(),
    channel_id: z.string().optional()
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Métricas de receita');
    } catch (error) {
      console.error('ERRO getRevenueMetrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao calcular métricas de receita'
      };
    }
  }
});

export const getCustomerMetrics = tool({
  description: 'Calcula métricas de clientes (modo simplificado).',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período em dias a ser analisado'),
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
    top_clientes_limit: z.number().optional()
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Métricas de clientes');
    } catch (error) {
      console.error('ERRO getCustomerMetrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao calcular métricas de clientes'
      };
    }
  }
});

export const getProductPerformance = tool({
  description: 'Analisa performance de produtos (modo simplificado).',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período em dias a ser analisado'),
    category: z.string().optional(),
    top_products_limit: z.number().optional()
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Performance de produtos');
    } catch (error) {
      console.error('ERRO getProductPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar performance de produtos'
      };
    }
  }
});

export const getCouponEffectiveness = tool({
  description: 'Avalia cupons e promoções (modo simplificado).',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período em dias a ser analisado'),
    coupon_code: z.string().optional()
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Efetividade de cupons');
    } catch (error) {
      console.error('ERRO getCouponEffectiveness:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar cupons'
      };
    }
  }
});

export const getChannelAnalysis = tool({
  description: 'Compara canais de venda (modo simplificado).',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período em dias a ser analisado'),
    channel_id: z.string().optional()
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Análise de canais');
    } catch (error) {
      console.error('ERRO getChannelAnalysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar canais'
      };
    }
  }
});
