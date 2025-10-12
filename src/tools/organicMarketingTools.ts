import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

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

const formatSqlParams = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]');

const ORGANIC_PLATFORM_METRICS_BASE_SQL = `
WITH metricas AS (
  SELECT
    cs.plataforma,
    cs.id AS conta_social_id,
    p.id AS publicacao_id,
    COALESCE(m.curtidas, 0) AS curtidas,
    COALESCE(m.comentarios, 0) AS comentarios,
    COALESCE(m.compartilhamentos, 0) AS compartilhamentos,
    COALESCE(m.salvamentos, 0) AS salvamentos,
    COALESCE(m.visualizacoes, 0) AS visualizacoes,
    COALESCE(m.alcance, 0) AS alcance
  FROM marketing_organico.metricas_publicacoes m
  JOIN marketing_organico.publicacoes p ON p.id = m.publicacao_id
  JOIN marketing_organico.contas_sociais cs ON cs.id = p.conta_social_id
  WHERE m.registrado_em >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
)
SELECT
  plataforma,
  COUNT(DISTINCT conta_social_id) AS contas_vinculadas,
  COUNT(DISTINCT publicacao_id) AS campanhas_vinculadas,
  SUM(alcance) AS gasto_total,
  SUM(visualizacoes) AS receita_total,
  SUM(curtidas) AS conversoes_total,
  CASE WHEN SUM(alcance) > 0 THEN SUM(visualizacoes)::numeric / SUM(alcance) ELSE 0 END AS roas,
  CASE WHEN SUM(visualizacoes) > 0 THEN (SUM(curtidas)::numeric / SUM(visualizacoes)) * 100 ELSE 0 END AS taxa_conversao_percent,
  CASE WHEN SUM(alcance) > 0 THEN (SUM(comentarios + compartilhamentos + salvamentos)::numeric / SUM(alcance)) * 100 ELSE 0 END AS ctr_percent
FROM metricas
GROUP BY plataforma
`;

type PlatformMetricsOrder =
  | 'roas_desc'
  | 'engajamento_desc'
  | 'alcance_desc'
  | 'conversoes_desc'
  | 'campanhas_desc'
  | 'contas_desc';

const PLATFORM_METRICS_ORDER_MAP: Record<PlatformMetricsOrder, string> = {
  roas_desc: 'roas DESC NULLS LAST',
  engajamento_desc: 'taxa_conversao_percent DESC NULLS LAST',
  alcance_desc: 'gasto_total DESC NULLS LAST',
  conversoes_desc: 'conversoes_total DESC NULLS LAST',
  campanhas_desc: 'campanhas_vinculadas DESC NULLS LAST',
  contas_desc: 'contas_vinculadas DESC NULLS LAST',
};

const buildPlatformMetricsQuery = (
  rangeDays: number,
  limit: number,
  order: PlatformMetricsOrder,
) => {
  const orderClause = PLATFORM_METRICS_ORDER_MAP[order] ?? PLATFORM_METRICS_ORDER_MAP.roas_desc;
  const sql = `${ORGANIC_PLATFORM_METRICS_BASE_SQL}
ORDER BY ${orderClause}
LIMIT $2`;
  return { sql, params: [rangeDays, limit] as unknown[] };
};

async function buildPlatformMetricsResponse(
  rangeDays: number,
  label: string,
  options: { order?: PlatformMetricsOrder; limit?: number } = {},
) {
  const limit = options.limit ?? 10;
  const order = options.order ?? 'roas_desc';
  const { sql, params } = buildPlatformMetricsQuery(rangeDays, limit, order);
  const rows = await runQuery<OrganicMetricRow>(sql, params);

  if (!rows.length) {
    return {
      success: false,
      message: `⚠️ Nenhum registro encontrado para ${label.toLowerCase()}`,
      periodo_dias: rangeDays,
      data: [],
      sql_query: sql,
      sql_params: formatSqlParams(params),
    };
  }

  return {
    success: true,
    message: `✅ ${rows.length} registros analisados (${label})`,
    periodo_dias: rangeDays,
    data: rows,
    sql_query: sql,
    sql_params: formatSqlParams(params),
  };
}

type BaseFilters = {
  limit: number;
  plataforma?: string;
  status?: string;
  tipo_post?: string;
  data_de?: string;
  data_ate?: string;
  engajamento_minimo?: number;
  curtidas_minimo?: number;
};

type QueryBuilder = (filters: BaseFilters) => { sql: string; params: unknown[] };

const buildSelectQuery = (
  table: string,
  columns: string[],
  filters: BaseFilters,
  options: {
    dateColumn?: { from?: string; to?: string };
    additional?: (ctx: { clauses: string[]; addParam: (value: unknown) => string }) => void;
    joins?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    filterColumns?: Partial<Record<'plataforma' | 'status' | 'tipo_post', string>>;
  } = {},
) => {
  const clauses: string[] = [];
  const params: unknown[] = [];

  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  const plataformaColumn = options.filterColumns?.plataforma ?? (columns.includes('plataforma') ? 'plataforma' : undefined);
  if (filters.plataforma && plataformaColumn) {
    clauses.push(`${plataformaColumn} = ${addParam(filters.plataforma)}`);
  }

  const statusColumn = options.filterColumns?.status ?? (columns.includes('status') ? 'status' : undefined);
  if (filters.status && statusColumn) {
    clauses.push(`${statusColumn} = ${addParam(filters.status)}`);
  }

  const tipoPostColumn = options.filterColumns?.tipo_post ?? (columns.includes('tipo_post') ? 'tipo_post' : undefined);
  if (filters.tipo_post && tipoPostColumn) {
    clauses.push(`${tipoPostColumn} = ${addParam(filters.tipo_post)}`);
  }

  if (options.dateColumn?.from && filters.data_de) {
    clauses.push(`${options.dateColumn.from} >= ${addParam(filters.data_de)}`);
  }

  if (filters.data_ate) {
    const toColumn = options.dateColumn?.to ?? options.dateColumn?.from;
    if (toColumn) {
      clauses.push(`${toColumn} <= ${addParam(filters.data_ate)}`);
    }
  }

  options.additional?.({ clauses, addParam });

  const limitPlaceholder = addParam(filters.limit);
  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderBy = options.orderBy ?? columns[0];
  const direction = options.orderDirection ?? 'DESC';

  const joinsClause = options.joins ? `\n${options.joins}` : '';
  const whereLine = whereClause ? `\n${whereClause}` : '';
  const sql = `
    SELECT ${columns.join(', ')}
    FROM ${table}${joinsClause}${whereLine}
    ORDER BY ${orderBy} ${direction}
    LIMIT ${limitPlaceholder}
  `.trim();

  return { sql, params };
};

const organicQueryBuilders: Record<'contas_sociais' | 'publicacoes' | 'metricas_publicacoes' | 'resumos_conta', QueryBuilder> = {
  contas_sociais: (filters) =>
    buildSelectQuery(
      'marketing_organico.contas_sociais cs',
      ['cs.id', 'cs.plataforma', 'cs.nome_conta', 'cs.conectado_em'],
      filters,
      {
        orderBy: 'cs.conectado_em',
        orderDirection: 'DESC',
        dateColumn: { from: 'cs.conectado_em' },
        filterColumns: {
          plataforma: 'cs.plataforma',
        },
      },
    ),
  publicacoes: (filters) =>
    buildSelectQuery(
      'marketing_organico.publicacoes p',
      [
        'p.id',
        'p.conta_social_id',
        'cs.nome_conta AS nome_conta',
        'cs.plataforma AS plataforma',
        'p.titulo',
        'p.hook',
        'p.tipo_post',
        'p.status',
        'p.publicado_em',
        'p.criado_em',
      ],
      filters,
      {
        joins: 'JOIN marketing_organico.contas_sociais cs ON cs.id = p.conta_social_id',
        orderBy: 'p.publicado_em',
        dateColumn: { from: 'p.publicado_em' },
        filterColumns: {
          plataforma: 'cs.plataforma',
          status: 'p.status',
          tipo_post: 'p.tipo_post',
        },
      },
    ),
  metricas_publicacoes: (filters) =>
    buildSelectQuery(
      'marketing_organico.metricas_publicacoes m',
      [
        'm.id',
        'm.publicacao_id',
        'p.titulo',
        'cs.nome_conta AS nome_conta',
        'cs.plataforma AS plataforma',
        'm.curtidas',
        'm.comentarios',
        'm.compartilhamentos',
        'm.visualizacoes',
        'm.alcance',
        'm.salvamentos',
        'm.taxa_engajamento',
        'm.registrado_em',
      ],
      filters,
      {
        joins:
          'JOIN marketing_organico.publicacoes p ON p.id = m.publicacao_id\n' +
          'JOIN marketing_organico.contas_sociais cs ON cs.id = p.conta_social_id',
        orderBy: 'm.registrado_em',
        dateColumn: { from: 'm.registrado_em' },
        additional: ({ clauses, addParam }) => {
          if (filters.engajamento_minimo !== undefined) {
            clauses.push(`m.taxa_engajamento >= ${addParam(filters.engajamento_minimo)}`);
          }
          if (filters.curtidas_minimo !== undefined) {
            clauses.push(`m.curtidas >= ${addParam(filters.curtidas_minimo)}`);
          }
        },
        filterColumns: {
          plataforma: 'cs.plataforma',
          status: 'p.status',
          tipo_post: 'p.tipo_post',
        },
      },
    ),
  resumos_conta: (filters) =>
    buildSelectQuery(
      'marketing_organico.resumos_conta rc',
      [
        'rc.id',
        'rc.conta_social_id',
        'cs.nome_conta AS nome_conta',
        'cs.plataforma AS plataforma',
        'rc.seguidores',
        'rc.seguindo',
        'rc.total_publicacoes',
        'rc.alcance_total',
        'rc.taxa_engajamento',
        'rc.registrado_em',
      ],
      filters,
      {
        joins: 'JOIN marketing_organico.contas_sociais cs ON cs.id = rc.conta_social_id',
        orderBy: 'rc.registrado_em',
        dateColumn: { from: 'rc.registrado_em' },
        additional: ({ clauses, addParam }) => {
          if (filters.engajamento_minimo !== undefined) {
            clauses.push(`rc.taxa_engajamento >= ${addParam(filters.engajamento_minimo)}`);
          }
        },
        filterColumns: {
          plataforma: 'cs.plataforma',
        },
      },
    ),
};

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
    curtidas_minimo,
  }) => {
    const normalizedLimit = typeof limit === 'number' ? limit : 20;
    const filters: BaseFilters = {
      limit: normalizedLimit,
      plataforma,
      status,
      tipo_post,
      data_de,
      data_ate,
      engajamento_minimo,
      curtidas_minimo,
    };

    const builder = organicQueryBuilders[table];
    const { sql, params } = builder(filters);

    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        count: rows.length,
        table,
        rows,
        message: `✅ ${rows.length} registros encontrados em ${table}`,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO getOrganicMarketingData:', error);
      return {
        success: false,
        table,
        rows: [],
        message: `❌ Erro ao buscar dados de ${table}`,
        error: error instanceof Error ? error.message : String(error),
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
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
      return await buildPlatformMetricsResponse(date_range_days, 'Performance de conteúdo', {
        order: 'roas_desc',
        limit: 10,
      });
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
      return await buildPlatformMetricsResponse(date_range_days, 'Benchmark de plataformas', {
        order: 'alcance_desc',
        limit: 20,
      });
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
      return await buildPlatformMetricsResponse(date_range_days, 'Crescimento de audiência', {
        order: 'contas_desc',
        limit: 20,
      });
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

  execute: async ({ limit = 10, date_range_days = 30 }) => {
    try {
      const safeLimit = Math.max(1, Math.min(limit, 50));
      return await buildPlatformMetricsResponse(date_range_days, 'Top conteúdos', {
        order: 'conversoes_desc',
        limit: safeLimit,
      });
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
      return await buildPlatformMetricsResponse(date_range_days, 'Mix de conteúdo', {
        order: 'campanhas_desc',
        limit: 25,
      });
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
      return await buildPlatformMetricsResponse(lookback_days, 'Previsão de engajamento', {
        order: 'engajamento_desc',
        limit: 15,
      });
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
      return await buildPlatformMetricsResponse(date_range_days, 'ROI de conteúdo', {
        order: 'roas_desc',
        limit: 20,
      });
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
