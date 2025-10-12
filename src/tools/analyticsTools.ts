import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const ANALYTICS_TABLES = [
  'agregado_diario_por_fonte',
  'agregado_diario_por_pagina',
  'consentimentos_visitante',
  'eventos',
  'itens_transacao',
  'metas',
  'propriedades_analytics',
  'propriedades_visitante',
  'sessoes',
  'transacoes_analytics',
  'visitantes',
] as const;

type AnalyticsTable = (typeof ANALYTICS_TABLES)[number];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;
const MIN_LIMIT = 1;

const TABLE_ORDER_COLUMNS: Record<AnalyticsTable, string> = {
  agregado_diario_por_fonte: 'data',
  agregado_diario_por_pagina: 'data',
  consentimentos_visitante: 'consent_timestamp',
  eventos: 'event_timestamp',
  itens_transacao: 'id',
  metas: 'id',
  propriedades_analytics: 'created_at',
  propriedades_visitante: 'created_at',
  sessoes: 'session_start',
  transacoes_analytics: 'transaction_timestamp',
  visitantes: 'last_seen',
};

const TABLE_DATE_COLUMNS: Partial<Record<AnalyticsTable, { from: string; to?: string }>> = {
  agregado_diario_por_fonte: { from: 'data' },
  agregado_diario_por_pagina: { from: 'data' },
  consentimentos_visitante: { from: 'consent_timestamp' },
  eventos: { from: 'event_timestamp' },
  itens_transacao: { from: 'created_at' },
  metas: { from: 'created_at' },
  propriedades_analytics: { from: 'created_at', to: 'updated_at' },
  propriedades_visitante: { from: 'created_at', to: 'updated_at' },
  sessoes: { from: 'session_start', to: 'session_end' },
  transacoes_analytics: { from: 'transaction_timestamp' },
  visitantes: { from: 'first_seen', to: 'last_seen' },
};

const VISITOR_FILTER_TABLES = new Set<AnalyticsTable>([
  'sessoes',
  'eventos',
  'propriedades_visitante',
  'consentimentos_visitante',
]);

const SESSION_FILTER_TABLES = new Set<AnalyticsTable>([
  'eventos',
  'transacoes_analytics',
]);

const FONTE_COLUMN_BY_TABLE: Partial<Record<AnalyticsTable, string>> = {
  agregado_diario_por_fonte: 'fonte',
  sessoes: 'utm_source',
};

const PAGINA_COLUMN_BY_TABLE: Partial<Record<AnalyticsTable, string>> = {
  agregado_diario_por_pagina: 'pagina',
  eventos: 'page_url',
};

const EVENT_NAME_TABLES = new Set<AnalyticsTable>(['eventos']);

const normalizeLimit = (limit?: number) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(limit), MIN_LIMIT), MAX_LIMIT);
};

const formatSqlParams = (params: unknown[]) => {
  if (!params.length) {
    return '[]';
  }
  return JSON.stringify(params);
};

const buildGetAnalyticsDataQuery = (args: {
  table: AnalyticsTable;
  limit: number;
  visitor_id?: string;
  session_id?: string;
  fonte?: string;
  pagina?: string;
  eh_bot?: boolean;
  event_name?: string;
  data_de?: string;
  data_ate?: string;
}) => {
  const {
    table,
    limit,
    visitor_id,
    session_id,
    fonte,
    pagina,
    eh_bot,
    event_name,
    data_de,
    data_ate,
  } = args;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const pushCondition = (clause: string, value: unknown) => {
    conditions.push(`${clause} $${paramIndex}`);
    params.push(value);
    paramIndex += 1;
  };

  if (visitor_id && VISITOR_FILTER_TABLES.has(table)) {
    pushCondition('visitor_id =', visitor_id);
  }

  if (session_id && SESSION_FILTER_TABLES.has(table)) {
    pushCondition('session_id =', session_id);
  }

  if (fonte) {
    const column = FONTE_COLUMN_BY_TABLE[table];
    if (column) {
      pushCondition(`${column} =`, fonte);
    }
  }

  if (pagina) {
    const column = PAGINA_COLUMN_BY_TABLE[table];
    if (column) {
      pushCondition(`${column} =`, pagina);
    }
  }

  if (typeof eh_bot === 'boolean' && table === 'sessoes') {
    pushCondition('eh_bot =', eh_bot);
  }

  if (event_name && EVENT_NAME_TABLES.has(table)) {
    pushCondition('event_name =', event_name);
  }

  const dateColumns = TABLE_DATE_COLUMNS[table];
  if (data_de && dateColumns?.from) {
    pushCondition(`${dateColumns.from} >=`, data_de);
  }

  if (data_ate) {
    const column = dateColumns?.to ?? dateColumns?.from;
    if (column) {
      pushCondition(`${column} <=`, data_ate);
    }
  }

  const limitIndex = paramIndex;
  params.push(limit);

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderColumn = TABLE_ORDER_COLUMNS[table] ?? 'id';

  const sql = `
    SELECT *
    FROM gestaoanalytics.${table}
    ${whereClause}
    ORDER BY ${orderColumn} DESC
    LIMIT $${limitIndex}
  `.trim();

  return { sql, params };
};

export const getAnalyticsData = tool({
  description: 'Busca dados de analytics web (sessões, eventos, visitantes, transações, métricas agregadas)',
  inputSchema: z.object({
    table: z.enum(ANALYTICS_TABLES).describe('Tabela a consultar'),
    limit: z.number().default(DEFAULT_LIMIT).describe('Número máximo de resultados'),
    visitor_id: z.string().optional()
      .describe('Filtrar por ID do visitante (para sessoes, eventos, propriedades_visitante, consentimentos_visitante)'),
    session_id: z.string().optional()
      .describe('Filtrar por ID da sessão (para eventos, transacoes_analytics)'),
    fonte: z.string().optional()
      .describe('Filtrar por fonte de tráfego (para agregado_diario_por_fonte, sessoes)'),
    pagina: z.string().optional()
      .describe('Filtrar por página (para agregado_diario_por_pagina, eventos)'),
    eh_bot: z.boolean().optional()
      .describe('Filtrar por bot (para sessoes)'),
    event_name: z.string().optional()
      .describe('Filtrar por nome do evento (para eventos)'),
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),
  execute: async (input) => {
    let sql: string | null = null;
    let params: unknown[] = [];
    try {
      const limit = normalizeLimit(input.limit);
      const query = buildGetAnalyticsDataQuery({ ...input, limit });
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
      console.error('ERRO getAnalyticsData:', error);
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

export const analyzeTrafficOverview = tool({
  description: 'Analisa visão geral de tráfego: sessões, usuários, pageviews, bounce rate, duração média, tendências',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const filteredSessionsCte = `
      WITH filtered_sessions AS (
        SELECT
          session_id,
          visitor_id,
          session_start,
          COALESCE(duration_seconds, 0) AS duration_seconds,
          COALESCE(pages_viewed, 0) AS pages_viewed,
          CASE WHEN COALESCE(pages_viewed, 0) <= 1 THEN 1 ELSE 0 END AS bounced
        FROM gestaoanalytics.sessoes
        WHERE session_start >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
          AND (eh_bot IS DISTINCT FROM TRUE)
      )
    `;

    const overviewSql = `
      ${filteredSessionsCte}
      SELECT
        DATE(session_start) AS dia,
        COUNT(*) AS sessoes,
        COUNT(DISTINCT visitor_id) AS usuarios,
        SUM(pages_viewed) AS pageviews,
        SUM(duration_seconds) AS total_duration_seconds,
        ROUND(AVG(duration_seconds)::numeric, 2) AS avg_duration_seconds,
        SUM(bounced) AS bounced_sessions,
        ROUND((SUM(bounced)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS bounce_rate_percent
      FROM filtered_sessions
      GROUP BY dia
      ORDER BY dia DESC
    `;

    const totalsSql = `
      ${filteredSessionsCte}
      SELECT
        COUNT(*) AS total_sessoes,
        COUNT(DISTINCT visitor_id) AS total_usuarios,
        SUM(pages_viewed) AS total_pageviews,
        SUM(duration_seconds) AS total_duration_seconds,
        SUM(bounced) AS total_bounced
      FROM filtered_sessions
    `;

    const visitorsSql = `
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(total_sessions, 0) > 1) AS visitantes_recorrentes,
        COUNT(*) AS total_visitantes
      FROM gestaoanalytics.visitantes
      WHERE first_seen >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
    `;

    try {
      const rows = await runQuery<{
        dia: string;
        sessoes: string | number;
        usuarios: string | number;
        pageviews: string | number;
        total_duration_seconds: string | number;
        avg_duration_seconds: string | number;
        bounced_sessions: string | number;
        bounce_rate_percent: string | number;
      }>(overviewSql, [range]);

      const totals = (await runQuery<{
        total_sessoes: string | number | null;
        total_usuarios: string | number | null;
        total_pageviews: string | number | null;
        total_duration_seconds: string | number | null;
        total_bounced: string | number | null;
      }>(totalsSql, [range]))[0] ?? {
        total_sessoes: 0,
        total_usuarios: 0,
        total_pageviews: 0,
        total_duration_seconds: 0,
        total_bounced: 0,
      };

      const visitorStats = (await runQuery<{
        visitantes_recorrentes: string | number | null;
        total_visitantes: string | number | null;
      }>(visitorsSql, [range]))[0] ?? {
        visitantes_recorrentes: 0,
        total_visitantes: 0,
      };

      const totalSessions = Number(totals.total_sessoes ?? 0);
      const totalUsers = Number(totals.total_usuarios ?? 0);
      const totalPageviews = Number(totals.total_pageviews ?? 0);
      const totalDurationSeconds = Number(totals.total_duration_seconds ?? 0);
      const totalBounced = Number(totals.total_bounced ?? 0);

      const avgDurationSeconds = totalSessions > 0 ? totalDurationSeconds / totalSessions : 0;
      const pagesPerSession = totalSessions > 0 ? totalPageviews / totalSessions : 0;
      const bounceRate = totalSessions > 0 ? (totalBounced / totalSessions) * 100 : 0;

      const totalVisitors = Number(visitorStats.total_visitantes ?? 0);
      const returningVisitors = Number(visitorStats.visitantes_recorrentes ?? 0);
      const returnRate = totalVisitors > 0 ? (returningVisitors / totalVisitors) * 100 : 0;

      let classificacao = 'Ruim';
      if (bounceRate < 60 && avgDurationSeconds > 120 && pagesPerSession > 3) {
        classificacao = 'Excelente';
      } else if (bounceRate < 70 && avgDurationSeconds > 90 && pagesPerSession > 2.5) {
        classificacao = 'Bom';
      } else if (bounceRate < 80 && avgDurationSeconds > 60) {
        classificacao = 'Regular';
      }

      const tableRows = rows.map(row => ({
        data: row.dia,
        sessoes: Number(row.sessoes ?? 0),
        usuarios: Number(row.usuarios ?? 0),
        pageviews: Number(row.pageviews ?? 0),
        avg_duration_seconds: Number(row.avg_duration_seconds ?? 0),
        bounce_rate_percent: Number(row.bounce_rate_percent ?? 0),
      }));

      return {
        success: true,
        message: `Visão geral de tráfego dos últimos ${range} dias`,
        periodo_dias: range,
        metricas: {
          total_sessoes: totalSessions,
          total_usuarios: totalUsers,
          total_pageviews: totalPageviews,
          bounce_rate: `${bounceRate.toFixed(2)}%`,
          avg_duration_seconds: Math.round(avgDurationSeconds),
          avg_duration_minutos: (avgDurationSeconds / 60).toFixed(2),
          pages_per_session: pagesPerSession.toFixed(2),
          return_visitor_rate: `${returnRate.toFixed(2)}%`,
          classificacao,
        },
        rows: tableRows,
        sql_query: overviewSql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO analyzeTrafficOverview:', error);
      return {
        success: false,
        message: `Erro ao analisar tráfego: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const compareTrafficSources = tool({
  description: 'Compara fontes de tráfego: distribuição, quality score, conversão por canal',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const sql = `
      WITH sessoes AS (
        SELECT
          COALESCE(NULLIF(utm_source, ''), 'direct') AS fonte,
          COUNT(*) AS sessoes,
          SUM(COALESCE(pages_viewed, 0)) AS pageviews,
          SUM(COALESCE(duration_seconds, 0)) AS total_duration,
          SUM(CASE WHEN COALESCE(pages_viewed, 0) <= 1 THEN 1 ELSE 0 END) AS bounced
        FROM gestaoanalytics.sessoes
        WHERE session_start >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
          AND (eh_bot IS DISTINCT FROM TRUE)
        GROUP BY 1
      ),
      transacoes AS (
        SELECT
          COALESCE(NULLIF(s.utm_source, ''), 'direct') AS fonte,
          COUNT(*) AS conversoes
        FROM gestaoanalytics.transacoes_analytics t
        JOIN gestaoanalytics.sessoes s ON s.id = t.session_id
        WHERE t.transaction_timestamp >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        GROUP BY 1
      )
      SELECT
        s.fonte,
        s.sessoes,
        s.pageviews,
        s.total_duration,
        s.bounced,
        COALESCE(t.conversoes, 0) AS conversoes,
        ROUND((COALESCE(t.conversoes, 0)::numeric / NULLIF(s.sessoes, 0)) * 100, 2) AS conversion_rate_percent,
        ROUND((s.pageviews::numeric / NULLIF(s.sessoes, 0)), 2) AS pages_per_session,
        ROUND((s.total_duration::numeric / NULLIF(s.sessoes, 0)), 2) AS avg_duration_seconds
      FROM sessoes s
      LEFT JOIN transacoes t ON t.fonte = s.fonte
      ORDER BY s.sessoes DESC
    `;

    try {
      const rows = await runQuery<{
        fonte: string | null;
        sessoes: string | number | null;
        pageviews: string | number | null;
        total_duration: string | number | null;
        bounced: string | number | null;
        conversoes: string | number | null;
        conversion_rate_percent: string | number | null;
        pages_per_session: string | number | null;
        avg_duration_seconds: string | number | null;
      }>(sql, [range]);

      if (!rows.length) {
        return {
          success: false,
          message: 'Nenhuma sessão encontrada no período',
          sql_query: sql,
          sql_params: formatSqlParams([range]),
        };
      }

      const totalSessions = rows.reduce((acc, row) => acc + Number(row.sessoes ?? 0), 0);

      const fontes = rows.map(row => {
        const sessoes = Number(row.sessoes ?? 0);
        const pageviews = Number(row.pageviews ?? 0);
        const conversoes = Number(row.conversoes ?? 0);
        const avgDuration = Number(row.avg_duration_seconds ?? 0);
        const pagesPerSession = Number(row.pages_per_session ?? 0);
        const conversionRate = Number(row.conversion_rate_percent ?? 0);

        const qualityScore = sessoes > 0
          ? ((conversionRate * 100) + (pagesPerSession * 10) + (avgDuration * 0.01)) / sessoes
          : 0;

        let classificacao = 'Baixa';
        if (qualityScore > 15) classificacao = 'Excelente';
        else if (qualityScore > 10) classificacao = 'Boa';
        else if (qualityScore > 5) classificacao = 'Regular';

        return {
          fonte: row.fonte ?? 'desconhecida',
          sessoes,
          percentual_trafego: totalSessions > 0 ? `${((sessoes / totalSessions) * 100).toFixed(2)}%` : '0%',
          pages_per_session: pagesPerSession.toFixed(2),
          avg_duration_seconds: Math.round(avgDuration),
          conversoes,
          conversion_rate: `${conversionRate.toFixed(2)}%`,
          quality_score: qualityScore.toFixed(2),
          classificacao,
        };
      });

      const sorted = [...fontes].sort((a, b) => Number(b.quality_score) - Number(a.quality_score));

      return {
        success: true,
        message: `Análise de ${sorted.length} fontes de tráfego`,
        periodo_dias: range,
        total_fontes: sorted.length,
        melhor_fonte: sorted[0]?.fonte,
        pior_fonte: sorted[sorted.length - 1]?.fonte,
        fontes: sorted,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO compareTrafficSources:', error);
      return {
        success: false,
        message: `Erro ao comparar fontes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analyzeConversionFunnel = tool({
  description: 'Analisa funil de conversão: steps, drop-off, tempo médio, gargalos',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    funnel_events: z.array(z.string()).describe('Lista de eventos que compõem o funil, em ordem'),
  }),
  execute: async ({ date_range_days = 30, funnel_events }) => {
    if (!funnel_events.length) {
      return {
        success: false,
        message: 'Informe ao menos um evento para o funil',
      };
    }

    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const sql = `
      SELECT
        event_name,
        COUNT(DISTINCT session_id) AS sessoes
      FROM gestaoanalytics.eventos
      WHERE event_timestamp >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        AND event_name = ANY($2::text[])
      GROUP BY event_name
      ORDER BY array_position($2::text[], event_name)
    `;

    try {
      const rows = await runQuery<{ event_name: string; sessoes: string | number }>(sql, [range, funnel_events]);
      const counts = new Map<string, number>();
      rows.forEach(row => counts.set(row.event_name, Number(row.sessoes ?? 0)));

      const steps = funnel_events.map((eventName, index) => {
        const sessions = counts.get(eventName) ?? 0;
        const previousSessions = index === 0 ? sessions : (counts.get(funnel_events[index - 1]) ?? 0);
        const dropOff = index === 0 || previousSessions === 0
          ? 0
          : ((previousSessions - sessions) / previousSessions) * 100;
        const conversionRate = funnel_events.length > 0 && (counts.get(funnel_events[0]) ?? 0) > 0
          ? (sessions / (counts.get(funnel_events[0]) ?? 0)) * 100
          : 0;

        return {
          step: index + 1,
          event_name: eventName,
          sessoes: sessions,
          drop_off_percent: `${dropOff.toFixed(2)}%`,
          conversion_rate_percent: `${conversionRate.toFixed(2)}%`,
        };
      });

      const firstStepSessions = counts.get(funnel_events[0]) ?? 0;
      const lastStepSessions = counts.get(funnel_events[funnel_events.length - 1]) ?? 0;
      const conversionRate = firstStepSessions > 0 ? (lastStepSessions / firstStepSessions) * 100 : 0;

      const gargalos = steps
        .filter(step => Number.parseFloat(step.drop_off_percent) > 50)
        .map(step => `Step ${step.step}: ${step.event_name} (drop ${step.drop_off_percent})`);

      return {
        success: true,
        message: `Funil de ${funnel_events.length} steps analisado`,
        periodo_dias: range,
        total_steps: funnel_events.length,
        conversion_rate: `${conversionRate.toFixed(2)}%`,
        steps,
        gargalos,
        rows: steps,
        sql_query: sql,
        sql_params: formatSqlParams([range, funnel_events]),
      };
    } catch (error) {
      console.error('ERRO analyzeConversionFunnel:', error);
      return {
        success: false,
        message: `Erro ao analisar funil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const identifyTopLandingPages = tool({
  description: 'Identifica melhores e piores landing pages: pageviews, bounce rate, conversão',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    limit: z.number().default(10).describe('Número de páginas a retornar'),
  }),
  execute: async ({ date_range_days = 30, limit = 10 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);
    const topLimit = normalizeLimit(limit);
    const bottomLimit = Math.min(topLimit, 5);

    const sql = `
      WITH aggregated AS (
        SELECT
          pagina,
          SUM(pageviews) AS pageviews
        FROM gestaoanalytics.agregado_diario_por_pagina
        WHERE data >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        GROUP BY pagina
      ),
      top AS (
        SELECT 'Top' AS categoria, pagina, pageviews, ROW_NUMBER() OVER (ORDER BY pageviews DESC) AS rank
        FROM aggregated
        ORDER BY pageviews DESC
        LIMIT $2
      ),
      bottom AS (
        SELECT 'Bottom' AS categoria, pagina, pageviews, ROW_NUMBER() OVER (ORDER BY pageviews ASC) AS rank
        FROM aggregated
        ORDER BY pageviews ASC
        LIMIT $3
      )
      SELECT categoria, pagina, pageviews, rank
      FROM top
      UNION ALL
      SELECT categoria, pagina, pageviews, rank
      FROM bottom
      ORDER BY categoria, rank
    `;

    try {
      const rows = await runQuery<{
        categoria: string;
        pagina: string;
        pageviews: string | number | null;
        rank: number | string;
      }>(sql, [range, topLimit, bottomLimit]);

      const totalPages = topLimit + bottomLimit;

      const formatted = rows.map(row => ({
        categoria: row.categoria,
        pagina: row.pagina ?? 'desconhecida',
        pageviews: Number(row.pageviews ?? 0),
        rank: Number(row.rank ?? 0),
      }));

      return {
        success: true,
        message: `Ranking de landing pages (Top ${topLimit} e Bottom ${bottomLimit})`,
        periodo_dias: range,
        total_paginas: totalPages,
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams([range, topLimit, bottomLimit]),
      };
    } catch (error) {
      console.error('ERRO identifyTopLandingPages:', error);
      return {
        success: false,
        message: `Erro ao identificar landing pages: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analyzeDevicePerformance = tool({
  description: 'Analisa performance por dispositivo: desktop/mobile/tablet, browser, conversão',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const sql = `
      WITH session_props AS (
        SELECT
          COALESCE(NULLIF(p.device_type, ''), 'Desconhecido') AS device_type,
          COALESCE(NULLIF(p.browser, ''), 'Desconhecido') AS browser,
          COALESCE(s.duration_seconds, 0) AS duration_seconds,
          COALESCE(s.pages_viewed, 0) AS pages_viewed
        FROM gestaoanalytics.sessoes s
        LEFT JOIN gestaoanalytics.propriedades_visitante p
          ON p.visitor_id = s.visitor_id
        WHERE s.session_start >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
          AND (s.eh_bot IS DISTINCT FROM TRUE)
      ),
      device_stats AS (
        SELECT
          'Device' AS tipo,
          device_type AS segmento,
          COUNT(*) AS sessoes,
          ROUND((COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0)) * 100, 2) AS percentual,
          ROUND((SUM(duration_seconds)::numeric / NULLIF(COUNT(*), 0)), 2) AS avg_duration_seconds,
          ROUND((SUM(pages_viewed)::numeric / NULLIF(COUNT(*), 0)), 2) AS avg_pageviews,
          0 AS rank
        FROM session_props
        GROUP BY device_type
      ),
      browser_stats AS (
        SELECT
          'Browser' AS tipo,
          browser AS segmento,
          COUNT(*) AS sessoes,
          ROUND((COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0)) * 100, 2) AS percentual,
          ROUND((SUM(duration_seconds)::numeric / NULLIF(COUNT(*), 0)), 2) AS avg_duration_seconds,
          ROUND((SUM(pages_viewed)::numeric / NULLIF(COUNT(*), 0)), 2) AS avg_pageviews,
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank
        FROM session_props
        GROUP BY browser
      )
      SELECT * FROM device_stats
      UNION ALL
      SELECT * FROM browser_stats WHERE rank <= 5
      ORDER BY tipo, rank, segmento
    `;

    try {
      const rows = await runQuery<{
        tipo: string;
        segmento: string;
        sessoes: string | number | null;
        percentual: string | number | null;
        avg_duration_seconds: string | number | null;
        avg_pageviews: string | number | null;
        rank: string | number | null;
      }>(sql, [range]);

      const formatted = rows.map(row => ({
        tipo: row.tipo,
        segmento: row.segmento,
        sessoes: Number(row.sessoes ?? 0),
        percentual: Number(row.percentual ?? 0),
        avg_duration_seconds: Number(row.avg_duration_seconds ?? 0),
        avg_pageviews: Number(row.avg_pageviews ?? 0),
      }));

      return {
        success: true,
        message: `Análise de dispositivos e browsers nos últimos ${range} dias`,
        periodo_dias: range,
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO analyzeDevicePerformance:', error);
      return {
        success: false,
        message: `Erro ao analisar dispositivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const detectTrafficAnomalies = tool({
  description: 'Detecta anomalias no tráfego: picos, quedas, bounce rate anormal, tráfego bot',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    sensitivity: z.number().default(2).describe('Sensibilidade (z-score threshold, padrão 2)'),
  }),
  execute: async ({ date_range_days = 30, sensitivity = 2 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 7), 365);

    const trafficSql = `
      SELECT
        data,
        SUM(sessoes) AS sessoes
      FROM gestaoanalytics.agregado_diario_por_fonte
      WHERE data >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      GROUP BY data
      ORDER BY data
    `;

    const botSql = `
      SELECT
        COUNT(*) FILTER (WHERE eh_bot IS TRUE) AS bot_sessions,
        COUNT(*) AS total_sessions
      FROM gestaoanalytics.sessoes
      WHERE session_start >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
    `;

    try {
      const trafficRows = await runQuery<{ data: string; sessoes: string | number | null }>(trafficSql, [range]);

      if (!trafficRows.length) {
        return {
          success: false,
          message: 'Dados insuficientes para análise de anomalias',
          sql_query: trafficSql,
          sql_params: formatSqlParams([range]),
        };
      }

      const values = trafficRows.map(row => Number(row.sessoes ?? 0));
      const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
      const variance = values.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / values.length;
      const deviation = Math.sqrt(variance);

      const anomalies = trafficRows
        .map(row => {
          const sessions = Number(row.sessoes ?? 0);
          const zScore = deviation > 0 ? (sessions - mean) / deviation : 0;

          if (Math.abs(zScore) <= sensitivity) {
            return null;
          }

          return {
            data: row.data,
            sessoes: sessions,
            media: Math.round(mean),
            z_score: zScore.toFixed(2),
            tipo: zScore > 0 ? 'Pico' : 'Queda',
            severidade: Math.abs(zScore) > sensitivity * 1.5 ? 'CRÍTICA' : 'ALTA',
          };
        })
        .filter(Boolean);

      const botStats = (await runQuery<{ bot_sessions: string | number | null; total_sessions: string | number | null }>(botSql, [range]))[0] ?? {
        bot_sessions: 0,
        total_sessions: 0,
      };

      const botSessions = Number(botStats.bot_sessions ?? 0);
      const totalSessions = Number(botStats.total_sessions ?? 0);
      const botRate = totalSessions > 0 ? (botSessions / totalSessions) * 100 : 0;

      const redFlags: string[] = [];
      if (botRate > 30) redFlags.push(`Tráfego bot alto: ${botRate.toFixed(2)}%`);
      const criticalAnomalies = anomalies.filter(item => item?.severidade === 'CRÍTICA').length;
      if (criticalAnomalies > 0) {
        redFlags.push(`${criticalAnomalies} anomalias críticas detectadas`);
      }

      return {
        success: true,
        message: `${anomalies.length} anomalias detectadas`,
        periodo_dias: range,
        sensitivity,
        estatisticas: {
          media_sessoes_dia: Math.round(mean),
          desvio_padrao: Math.round(deviation),
        },
        total_anomalias: anomalies.length,
        bot_rate: `${botRate.toFixed(2)}%`,
        anomalias: anomalies,
        red_flags: redFlags,
        rows: anomalies,
        sql_query: trafficSql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO detectTrafficAnomalies:', error);
      return {
        success: false,
        message: `Erro ao detectar anomalias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analyzeUserBehavior = tool({
  description: 'Analisa comportamento de usuários: novos vs recorrentes, frequência, engagement',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const sql = `
      WITH visitantes_filtrados AS (
        SELECT
          visitor_id,
          COALESCE(total_sessions, 0) AS total_sessions
        FROM gestaoanalytics.visitantes
        WHERE first_seen >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      ),
      sessoes_filtradas AS (
        SELECT
          visitor_id,
          session_id
        FROM gestaoanalytics.sessoes
        WHERE session_start >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
          AND (eh_bot IS DISTINCT FROM TRUE)
      ),
      eventos_filtrados AS (
        SELECT DISTINCT session_id
        FROM gestaoanalytics.eventos
        WHERE event_timestamp >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      )
      SELECT
        (SELECT COUNT(*) FROM visitantes_filtrados) AS total_visitantes,
        (SELECT COUNT(*) FROM visitantes_filtrados WHERE total_sessions <= 1) AS novos_visitantes,
        (SELECT COUNT(*) FROM visitantes_filtrados WHERE total_sessions > 1) AS visitantes_recorrentes,
        (SELECT AVG(total_sessions)::numeric FROM visitantes_filtrados) AS frequencia_media,
        (SELECT COUNT(*) FROM sessoes_filtradas) AS total_sessoes,
        (SELECT COUNT(*) FROM eventos_filtrados) AS sessoes_com_evento
    `;

    try {
      const row = (await runQuery<{
        total_visitantes: string | number | null;
        novos_visitantes: string | number | null;
        visitantes_recorrentes: string | number | null;
        frequencia_media: string | number | null;
        total_sessoes: string | number | null;
        sessoes_com_evento: string | number | null;
      }>(sql, [range]))[0];

      if (!row || Number(row.total_visitantes ?? 0) === 0) {
        return {
          success: false,
          message: 'Nenhum visitante encontrado',
          sql_query: sql,
          sql_params: formatSqlParams([range]),
        };
      }

      const totalVisitantes = Number(row.total_visitantes ?? 0);
      const novosVisitantes = Number(row.novos_visitantes ?? 0);
      const visitantesRecorrentes = Number(row.visitantes_recorrentes ?? 0);
      const frequenciaMedia = Number(row.frequencia_media ?? 0);
      const totalSessoes = Number(row.total_sessoes ?? 0);
      const sessoesComEvento = Number(row.sessoes_com_evento ?? 0);
      const engagementRate = totalSessoes > 0 ? (sessoesComEvento / totalSessoes) * 100 : 0;

      let classificacao = 'Baixo';
      if (engagementRate > 70 && visitantesRecorrentes / totalVisitantes > 0.4) {
        classificacao = 'Excelente';
      } else if (engagementRate > 50 && visitantesRecorrentes / totalVisitantes > 0.3) {
        classificacao = 'Bom';
      } else if (engagementRate > 30) {
        classificacao = 'Regular';
      }

      const rows = [
        {
          metrica: 'Novos visitantes',
          valor: novosVisitantes,
          percentual: `${((novosVisitantes / totalVisitantes) * 100).toFixed(2)}%`,
        },
        {
          metrica: 'Visitantes recorrentes',
          valor: visitantesRecorrentes,
          percentual: `${((visitantesRecorrentes / totalVisitantes) * 100).toFixed(2)}%`,
        },
        {
          metrica: 'Frequência média de visitas',
          valor: Number.isFinite(frequenciaMedia) ? Number(frequenciaMedia.toFixed(2)) : 0,
          percentual: '-',
        },
        {
          metrica: 'Engagement rate (sessões com eventos)',
          valor: `${engagementRate.toFixed(2)}%`,
          percentual: '-',
        },
      ];

      return {
        success: true,
        message: `Análise de ${totalVisitantes} visitantes`,
        periodo_dias: range,
        comportamento: {
          total_visitantes: totalVisitantes,
          novos_visitantes: novosVisitantes,
          visitantes_recorrentes: visitantesRecorrentes,
          percentual_novos: `${((novosVisitantes / totalVisitantes) * 100).toFixed(2)}%`,
          percentual_recorrentes: `${((visitantesRecorrentes / totalVisitantes) * 100).toFixed(2)}%`,
          frequencia_media_visitas: frequenciaMedia.toFixed(2),
          engagement_rate: `${engagementRate.toFixed(2)}%`,
          classificacao,
        },
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO analyzeUserBehavior:', error);
      return {
        success: false,
        message: `Erro ao analisar comportamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
