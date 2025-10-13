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


// ===== Novas tools com nomes solicitados (mantendo consultas atuais) =====

export const desempenhoPorConta = tool({
  description: 'Desempenho por conta (filtrado por data_de/data_ate)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
SELECT
  cs.nome_conta,
  cs.plataforma,
  SUM(mp.impressoes) AS total_impressoes,
  SUM(mp.visualizacoes) AS total_visualizacoes,
  SUM(mp.curtidas) AS total_curtidas,
  SUM(mp.comentarios) AS total_comentarios,
  SUM(mp.compartilhamentos) AS total_compartilhamentos,

  ROUND(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS taxa_engajamento_total,
  ROUND(SUM(mp.visualizacoes)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS taxa_view,
  ROUND(SUM(mp.compartilhamentos)::numeric / NULLIF(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos), 0) * 100, 2) AS taxa_viralizacao,

  ROUND(AVG(mp.curtidas), 2) AS media_curtidas_post,
  ROUND(AVG(mp.comentarios), 2) AS media_comentarios_post,
  ROUND(AVG(mp.visualizacoes), 2) AS media_views_post

FROM marketing_organico.metricas_publicacoes mp
JOIN marketing_organico.publicacoes p ON mp.publicacao_id = p.id
JOIN marketing_organico.contas_sociais cs ON p.conta_social_id = cs.id
WHERE mp.registrado_em >= $1::date AND mp.registrado_em < ($2::date + INTERVAL '1 day')
GROUP BY cs.nome_conta, cs.plataforma
ORDER BY taxa_engajamento_total DESC`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ ${rows.length} registros analisados (Desempenho por conta)`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO desempenhoPorConta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao gerar Desempenho por conta',
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const desempenhoPorPlataforma = tool({
  description: 'Desempenho por plataforma (filtrado por data_de/data_ate)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
SELECT 
  cs.plataforma,
  COUNT(DISTINCT p.id) AS total_posts,
  SUM(mp.curtidas) AS total_curtidas,
  SUM(mp.comentarios) AS total_comentarios,
  SUM(mp.compartilhamentos) AS total_compartilhamentos,
  SUM(mp.visualizacoes) AS total_visualizacoes,
  SUM(mp.impressoes) AS total_impressoes,
  
  ROUND(SUM(mp.curtidas)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS taxa_like,
  ROUND(SUM(mp.comentarios)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS taxa_comentario,
  ROUND(SUM(mp.compartilhamentos)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS taxa_compartilhamento,
  ROUND(SUM(mp.visualizacoes)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS taxa_view,
  
  ROUND(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS taxa_engajamento_total,
  ROUND(AVG((mp.curtidas + mp.comentarios + mp.compartilhamentos)::numeric / NULLIF(mp.impressoes, 0)) * 100, 2) AS taxa_engajamento_media_post,
  
  ROUND(AVG(mp.curtidas), 2) AS media_curtidas,
  ROUND(AVG(mp.comentarios), 2) AS media_comentarios,
  ROUND(AVG(mp.compartilhamentos), 2) AS media_compartilhamentos,
  ROUND(AVG(mp.visualizacoes), 2) AS media_visualizacoes
FROM marketing_organico.metricas_publicacoes mp
JOIN marketing_organico.publicacoes p ON mp.publicacao_id = p.id
JOIN marketing_organico.contas_sociais cs ON p.conta_social_id = cs.id
WHERE mp.registrado_em >= $1::date AND mp.registrado_em < ($2::date + INTERVAL '1 day')
GROUP BY cs.plataforma
ORDER BY taxa_engajamento_total DESC`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ ${rows.length} registros analisados (Desempenho por plataforma)`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO desempenhoPorPlataforma:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao gerar Desempenho por plataforma',
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const desempenhoPorFormatoPost = tool({
  description: 'Desempenho por formato de post (filtrado por data_de/data_ate)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
SELECT 
  cs.plataforma,
  p.tipo_post,
  COUNT(DISTINCT p.id) AS total_posts,
  SUM(mp.visualizacoes) AS total_visualizacoes,
  SUM(mp.impressoes) AS total_impressoes,
  ROUND(SUM(mp.visualizacoes)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS taxa_view,
  ROUND(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS engajamento_pct,
  ROUND(SUM(mp.compartilhamentos)::numeric / NULLIF(SUM(mp.visualizacoes), 0) * 100, 2) AS taxa_compart_view,
  ROUND(SUM(mp.comentarios)::numeric / NULLIF(SUM(mp.curtidas), 0) * 100, 2) AS taxa_conversa_like
FROM marketing_organico.metricas_publicacoes mp
JOIN marketing_organico.publicacoes p ON mp.publicacao_id = p.id
JOIN marketing_organico.contas_sociais cs ON p.conta_social_id = cs.id
WHERE mp.registrado_em >= $1::date AND mp.registrado_em < ($2::date + INTERVAL '1 day')
GROUP BY cs.plataforma, p.tipo_post
ORDER BY engajamento_pct DESC`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ ${rows.length} registros analisados (Desempenho por formato de post)`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO desempenhoPorFormatoPost:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao gerar Desempenho por formato de post',
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const rankingPorPublicacao = tool({
  description: 'Ranking por publicação (filtrado por data_de/data_ate)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    limit: z.number().default(20).describe('Número de registros a destacar'),
  }),
  execute: async ({ data_de, data_ate, limit = 20 }) => {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const sql = `
SELECT
  cs.plataforma,
  p.titulo,
  p.tipo_post,
  ROUND(SUM(mp.impressoes), 0) AS impressoes,
  ROUND(SUM(mp.visualizacoes), 0) AS visualizacoes,
  SUM(mp.curtidas) AS curtidas,
  SUM(mp.comentarios) AS comentarios,
  SUM(mp.compartilhamentos) AS compartilhamentos,
  ROUND(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS engajamento_pct,
  ROUND(SUM(mp.compartilhamentos)::numeric / NULLIF(SUM(mp.visualizacoes), 0) * 100, 2) AS taxa_viralizacao,
  ROUND(SUM(mp.comentarios)::numeric / NULLIF(SUM(mp.curtidas), 0) * 100, 2) AS taxa_conversa
FROM marketing_organico.metricas_publicacoes mp
JOIN marketing_organico.publicacoes p ON mp.publicacao_id = p.id
JOIN marketing_organico.contas_sociais cs ON p.conta_social_id = cs.id
WHERE mp.registrado_em >= $1::date AND mp.registrado_em < ($2::date + INTERVAL '1 day')
GROUP BY cs.plataforma, p.titulo, p.tipo_post
ORDER BY engajamento_pct DESC
LIMIT $3`;
    const params = [data_de, data_ate, safeLimit] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ ${rows.length} registros analisados (Ranking por publicação)` ,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO rankingPorPublicacao:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao gerar Ranking por publicação',
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const engajamentoPorDiaHora = tool({
  description: 'Engajamento por dia da semana e horário (placeholder)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
SELECT 
  cs.plataforma,
  TO_CHAR(mp.registrado_em, 'Day') AS dia_semana,
  DATE_PART('hour', mp.registrado_em) AS hora,
  ROUND(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS engajamento_pct
FROM marketing_organico.metricas_publicacoes mp
JOIN marketing_organico.publicacoes p ON mp.publicacao_id = p.id
JOIN marketing_organico.contas_sociais cs ON p.conta_social_id = cs.id
WHERE mp.registrado_em >= $1::date AND mp.registrado_em < ($2::date + INTERVAL '1 day')
GROUP BY cs.plataforma, dia_semana, hora
ORDER BY cs.plataforma, dia_semana, hora`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ ${rows.length} linhas (Engajamento por dia/horário)`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO engajamentoPorDiaHora:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao gerar Engajamento por dia/horário',
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const detectarAnomaliasPerformance = tool({
  description: 'Detecção de anomalia (picos/quedas) (placeholder)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
WITH base AS (
  SELECT
    cs.plataforma,
    DATE(mp.registrado_em) AS dia,
    ROUND(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos)::numeric / NULLIF(SUM(mp.impressoes), 0) * 100, 2) AS engajamento_pct
  FROM marketing_organico.metricas_publicacoes mp
  JOIN marketing_organico.publicacoes p ON mp.publicacao_id = p.id
  JOIN marketing_organico.contas_sociais cs ON p.conta_social_id = cs.id
  WHERE mp.registrado_em >= $1::date AND mp.registrado_em < ($2::date + INTERVAL '1 day')
  GROUP BY cs.plataforma, dia
),
estatisticas AS (
  SELECT
    plataforma,
    AVG(engajamento_pct) AS media,
    STDDEV_POP(engajamento_pct) AS desvio
  FROM base
  GROUP BY plataforma
)
SELECT
  b.plataforma,
  b.dia,
  b.engajamento_pct,
  e.media,
  e.desvio,
  ROUND((b.engajamento_pct - e.media) / NULLIF(e.desvio, 0), 2) AS z_score,
  CASE 
    WHEN (b.engajamento_pct - e.media) / NULLIF(e.desvio, 0) > 2 THEN '📈 Pico de engajamento'
    WHEN (b.engajamento_pct - e.media) / NULLIF(e.desvio, 0) < -2 THEN '🚨 Queda de engajamento'
  END AS alerta
FROM base b
JOIN estatisticas e ON b.plataforma = e.plataforma
WHERE ABS((b.engajamento_pct - e.media) / NULLIF(e.desvio, 0)) > 2
ORDER BY b.dia DESC`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ ${rows.length} linhas (Detecção de anomalias de engajamento)`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO detectarAnomaliasPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao detectar anomalias de performance',
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const detectarQuedaSubitaAlcance = tool({
  description: 'Anomalia por queda súbita de alcance (placeholder)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
WITH diario AS (
  SELECT 
    cs.plataforma,
    DATE(mp.registrado_em) AS dia,
    SUM(mp.impressoes) AS impressoes
  FROM marketing_organico.metricas_publicacoes mp
  JOIN marketing_organico.publicacoes p ON mp.publicacao_id = p.id
  JOIN marketing_organico.contas_sociais cs ON p.conta_social_id = cs.id
  WHERE mp.registrado_em >= $1::date AND mp.registrado_em < ($2::date + INTERVAL '1 day')
  GROUP BY cs.plataforma, dia
),
estatisticas AS (
  SELECT 
    plataforma,
    AVG(impressoes) AS media,
    STDDEV_POP(impressoes) AS desvio
  FROM diario
  GROUP BY plataforma
)
SELECT 
  d.plataforma,
  d.dia,
  d.impressoes,
  ROUND((d.impressoes - e.media) / NULLIF(e.desvio, 0), 2) AS z_score,
  CASE 
    WHEN (d.impressoes - e.media) / NULLIF(e.desvio, 0) < -2 THEN '🚨 Queda de alcance detectada'
    WHEN (d.impressoes - e.media) / NULLIF(e.desvio, 0) > 2 THEN '📈 Pico de alcance'
  END AS alerta
FROM diario d
JOIN estatisticas e ON e.plataforma = d.plataforma
WHERE ABS((d.impressoes - e.media) / NULLIF(e.desvio, 0)) > 2
ORDER BY d.dia DESC`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ ${rows.length} linhas (Queda súbita de alcance)`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO detectarQuedaSubitaAlcance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao detectar queda súbita de alcance',
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});
