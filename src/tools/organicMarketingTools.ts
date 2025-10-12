import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { runQuery } from '@/lib/postgres';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

type OrganicMetricRow = {
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

const ORGANIC_METRICS_SQL = `
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

async function fetchOrganicMetrics(rangeDays: number): Promise<OrganicMetricRow[]> {
  return runQuery<OrganicMetricRow>(ORGANIC_METRICS_SQL, [rangeDays]);
}

function genericSuccessMessage(rows: OrganicMetricRow[], label?: string) {
  const prefix = label ? `${label}: ` : '';
  if (!rows.length) {
    return `${prefix}⚠️ Nenhum registro encontrado na consulta base`;
  }
  return `${prefix}✅ ${rows.length} registros retornados pela consulta base`;
}

async function buildGenericResponse(rangeDays: number, label: string) {
  const rows = await fetchOrganicMetrics(rangeDays);
  return {
    success: true,
    message: genericSuccessMessage(rows, label),
    periodo_dias: rangeDays,
    data: rows,
    sql_query: ORGANIC_METRICS_SQL
  };
}

export const getOrganicMarketingData = tool({
  description: 'Busca dados de marketing orgânico (contas sociais, publicações, métricas)',
  inputSchema: z.object({
    table: z.enum(['contas_sociais', 'publicacoes', 'metricas_publicacoes', 'resumos_conta'])
      .describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    plataforma: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'YouTube', 'TikTok']).optional()
      .describe('Filtrar por plataforma (para contas_sociais)'),
    status: z.enum(['rascunho', 'agendado', 'publicado', 'cancelado']).optional()
      .describe('Filtrar por status (para publicacoes)'),
    tipo_post: z.enum(['carrossel', 'imagem', 'video', 'reels', 'story']).optional()
      .describe('Filtrar por tipo de post (para publicacoes)'),

    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),

    engajamento_minimo: z.number().optional()
      .describe('Taxa mínima de engajamento (0-1, ex: 0.05 = 5%)'),
    curtidas_minimo: z.number().optional()
      .describe('Número mínimo de curtidas'),
  }),

  execute: async ({
    table,
    limit,
    plataforma,
    status,
    tipo_post,
    data_de,
    data_ate,
    engajamento_minimo,
    curtidas_minimo
  }) => {
    try {
      let query = supabase
        .schema('marketing_organico')
        .from(table)
        .select('*');

      if (plataforma && table === 'contas_sociais') {
        query = query.eq('plataforma', plataforma);
      }

      if (status && table === 'publicacoes') {
        query = query.eq('status', status);
      }

      if (tipo_post && table === 'publicacoes') {
        query = query.eq('tipo_post', tipo_post);
      }

      if (data_de) {
        let dateColumn = 'criado_em';
        if (table === 'contas_sociais') dateColumn = 'conectado_em';
        else if (table === 'metricas_publicacoes' || table === 'resumos_conta') dateColumn = 'registrado_em';
        else if (table === 'publicacoes') dateColumn = 'publicado_em';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'criado_em';
        if (table === 'contas_sociais') dateColumn = 'conectado_em';
        else if (table === 'metricas_publicacoes' || table === 'resumos_conta') dateColumn = 'registrado_em';
        else if (table === 'publicacoes') dateColumn = 'publicado_em';

        query = query.lte(dateColumn, data_ate);
      }

      if (engajamento_minimo !== undefined && (table === 'metricas_publicacoes' || table === 'resumos_conta')) {
        query = query.gte('taxa_engajamento', engajamento_minimo);
      }

      if (curtidas_minimo !== undefined && table === 'metricas_publicacoes') {
        query = query.gte('curtidas', curtidas_minimo);
      }

      let orderColumn = 'criado_em';
      if (table === 'contas_sociais') orderColumn = 'conectado_em';
      else if (table === 'metricas_publicacoes' || table === 'resumos_conta') orderColumn = 'registrado_em';
      else if (table === 'publicacoes') orderColumn = 'criado_em';

      query = query
        .order(orderColumn, { ascending: false })
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
      console.error('ERRO getOrganicMarketingData:', error);
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

export const analyzeContentPerformance = tool({
  description: 'Analisa performance de conteúdo com tabela simplificada',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)'),
    plataforma: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'YouTube', 'TikTok']).optional()
      .describe('Parâmetro mantido por compatibilidade, atualmente ignorado')
  }),

  execute: async ({ date_range_days = 30, plataforma: _plataforma }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Performance de conteúdo');
    } catch (error) {
      console.error('ERRO analyzeContentPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar performance de conteúdo'
      };
    }
  }
});

export const comparePlatformPerformance = tool({
  description: 'Compara performance entre plataformas utilizando consulta base simplificada',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Benchmark de plataformas');
    } catch (error) {
      console.error('ERRO comparePlatformPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao comparar performance de plataformas'
      };
    }
  }
});

export const analyzeAudienceGrowth = tool({
  description: 'Analisa crescimento de audiência (layout simplificado)',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Crescimento de audiência');
    } catch (error) {
      console.error('ERRO analyzeAudienceGrowth:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar crescimento de audiência'
      };
    }
  }
});

export const identifyTopContent = tool({
  description: 'Identifica top conteúdos com base na consulta simplificada',
  inputSchema: z.object({
    limit: z.number().default(10)
      .describe('Número de registros a destacar (mantido por compatibilidade)'),
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ limit: _limit = 10, date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Top conteúdos');
    } catch (error) {
      console.error('ERRO identifyTopContent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao identificar top conteúdos'
      };
    }
  }
});

export const analyzeContentMix = tool({
  description: 'Analisa o mix de conteúdo com estrutura baseada em tabela',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ date_range_days = 30 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'Mix de conteúdo');
    } catch (error) {
      console.error('ERRO analyzeContentMix:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar mix de conteúdo'
      };
    }
  }
});

export const forecastEngagement = tool({
  description: 'Prevê engajamento futuro utilizando consulta simplificada',
  inputSchema: z.object({
    forecast_days: z.number().default(14)
      .describe('Número de dias de previsão (parâmetro ignorado no modo simplificado)'),
    lookback_days: z.number().default(30)
      .describe('Período histórico considerado (padrão: 30)')
  }),

  execute: async ({ forecast_days: _forecast = 14, lookback_days = 30 }) => {
    try {
      return await buildGenericResponse(lookback_days, 'Previsão de engajamento');
    } catch (error) {
      console.error('ERRO forecastEngagement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao prever engajamento'
      };
    }
  }
});

export const calculateContentROI = tool({
  description: 'Calcula ROI de conteúdo com dados agregados simplificados',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)'),
    custo_producao_por_post: z.number().default(50)
      .describe('Custo médio por publicação (parâmetro ignorado no modo simplificado)')
  }),

  execute: async ({ date_range_days = 30, custo_producao_por_post: _custo = 50 }) => {
    try {
      return await buildGenericResponse(date_range_days, 'ROI de conteúdo');
    } catch (error) {
      console.error('ERRO calculateContentROI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao calcular ROI de conteúdo'
      };
    }
  }
});
