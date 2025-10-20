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
  'propriedades',
  'propriedades_visitante',
  'sessoes',
  'transacoes',
  'visitantes',
] as const;

type AnalyticsTable = (typeof ANALYTICS_TABLES)[number];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;
const MIN_LIMIT = 1;

const TABLE_ORDER_COLUMNS: Record<AnalyticsTable, string> = {
  agregado_diario_por_fonte: 'data',
  agregado_diario_por_pagina: 'data',
  consentimentos_visitante: 'timestamp_consentimento',
  eventos: 'timestamp_evento',
  itens_transacao: 'id',
  metas: 'id',
  propriedades: 'created_at',
  propriedades_visitante: 'updated_at',
  sessoes: 'timestamp_inicio_sessao',
  transacoes: 'timestamp_transacao',
  visitantes: 'ultima_visita_timestamp',
};

const TABLE_DATE_COLUMNS: Partial<Record<AnalyticsTable, { from: string; to?: string }>> = {
  agregado_diario_por_fonte: { from: 'data' },
  agregado_diario_por_pagina: { from: 'data' },
  consentimentos_visitante: { from: 'timestamp_consentimento' },
  eventos: { from: 'timestamp_evento' },
  itens_transacao: { from: 'created_at' },
  metas: { from: 'created_at' },
  propriedades: { from: 'created_at' },
  propriedades_visitante: { from: 'updated_at' },
  sessoes: { from: 'timestamp_inicio_sessao', to: 'timestamp_fim_sessao' },
  transacoes: { from: 'timestamp_transacao' },
  visitantes: { from: 'primeira_visita_timestamp', to: 'ultima_visita_timestamp' },
};

const VISITOR_FILTER_TABLES = new Set<AnalyticsTable>([
  'sessoes',
  'propriedades_visitante',
  'consentimentos_visitante',
  'transacoes',
]);

const SESSION_FILTER_TABLES = new Set<AnalyticsTable>([
  'eventos',
  'transacoes',
]);

const FONTE_COLUMN_BY_TABLE: Partial<Record<AnalyticsTable, string>> = {
  agregado_diario_por_fonte: 'utm_source',
  sessoes: 'utm_source',
};

const PAGINA_COLUMN_BY_TABLE: Partial<Record<AnalyticsTable, string>> = {
  agregado_diario_por_pagina: 'url_pagina',
  eventos: 'url_pagina',
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
    // All supported tables use 'id_visitante' for visitor reference
    pushCondition('id_visitante =', visitor_id);
  }

  if (session_id && SESSION_FILTER_TABLES.has(table)) {
    // eventos/transacoes use 'id_sessao'
    pushCondition('id_sessao =', session_id);
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
    pushCondition('nome_evento =', event_name);
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
      .describe('Filtrar por ID do visitante (para sessoes, propriedades_visitante, consentimentos_visitante, transacoes)'),
    session_id: z.string().optional()
      .describe('Filtrar por ID da sessão (para eventos, transacoes)'),
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
// Visão geral de tráfego: sessões, usuários, pageviews, bounce e duração por dia
export const analyzeTrafficOverview = tool({
  description: 'Consolida sessões/usuários/pageviews por dia, calcula bounce rate e duração média',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const overviewSql = `
      WITH sessoes_filtradas AS (
        SELECT
          id,
          id_visitante,
          (timestamp_inicio_sessao)::date AS dia,
          timestamp_inicio_sessao,
          timestamp_fim_sessao
        FROM gestaoanalytics.sessoes
        WHERE (timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
          AND (eh_bot IS DISTINCT FROM TRUE)
      ),
      pageviews_por_sessao AS (
        SELECT e.id_sessao,
               COUNT(*) FILTER (
                 WHERE LOWER(COALESCE(e.nome_evento, '')) = 'page_view'
                    OR LOWER(COALESCE(e.tipo_evento, '')) = 'page_view'
               ) AS pageviews
        FROM gestaoanalytics.eventos e
        WHERE (e.timestamp_evento)::date >= CURRENT_DATE - ($1::int - 1)
        GROUP BY e.id_sessao
      ),
      duracoes AS (
        SELECT s.id,
               EXTRACT(EPOCH FROM (s.timestamp_fim_sessao - s.timestamp_inicio_sessao)) AS duracao_seg
        FROM gestaoanalytics.sessoes s
        WHERE (s.timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
      )
      SELECT sf.dia,
             COUNT(*) AS sessoes,
             COUNT(DISTINCT sf.id_visitante) AS usuarios,
             COALESCE(SUM(COALESCE(pv.pageviews, 0)), 0) AS pageviews,
             ROUND(AVG(NULLIF(d.duracao_seg, 0))::numeric, 2) AS avg_duration_seconds,
             ROUND(
               CASE WHEN COUNT(*) = 0 THEN 0
                    ELSE (SUM(CASE WHEN COALESCE(pv.pageviews, 0) <= 1 THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100
               END, 2
             ) AS bounce_rate_percent
      FROM sessoes_filtradas sf
      LEFT JOIN pageviews_por_sessao pv ON pv.id_sessao = sf.id
      LEFT JOIN duracoes d ON d.id = sf.id
      GROUP BY sf.dia
      ORDER BY sf.dia
    `;

    const returnSql = `
      WITH base AS (
        SELECT DISTINCT s.id_visitante
        FROM gestaoanalytics.sessoes s
        WHERE (s.timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
          AND (s.eh_bot IS DISTINCT FROM TRUE)
      )
      SELECT
        (SELECT COUNT(*) FROM base) AS total_visitantes,
        (SELECT COUNT(*) FROM gestaoanalytics.visitantes v
          WHERE v.id IN (SELECT id_visitante FROM base)
            AND (v.primeira_visita_timestamp)::date < CURRENT_DATE - ($1::int - 1)
        ) AS visitantes_retornando
    `;

    try {
      const rows = await runQuery<{
        dia: string;
        sessoes: string | number | null;
        usuarios: string | number | null;
        pageviews: string | number | null;
        avg_duration_seconds: string | number | null;
        bounce_rate_percent: string | number | null;
      }>(overviewSql, [range]);

      const ret = (await runQuery<{ total_visitantes: string | number | null; visitantes_retornando: string | number | null }>(returnSql, [range]))[0] ?? { total_visitantes: 0, visitantes_retornando: 0 };

      const tableRows = rows.map((row) => ({
        data: row.dia,
        sessoes: Number(row.sessoes ?? 0),
        usuarios: Number(row.usuarios ?? 0),
        pageviews: Number(row.pageviews ?? 0),
        avg_duration_seconds: Number(row.avg_duration_seconds ?? 0),
        bounce_rate_percent: Number(row.bounce_rate_percent ?? 0),
      }));

      const totalSessions = tableRows.reduce((a, r) => a + r.sessoes, 0);
      const totalUsers = tableRows.reduce((a, r) => a + r.usuarios, 0);
      const totalPageviews = tableRows.reduce((a, r) => a + r.pageviews, 0);
      const avgDurationSeconds = tableRows.length
        ? tableRows.reduce((a, r) => a + r.avg_duration_seconds, 0) / tableRows.length
        : 0;
      const bounceRate = tableRows.length
        ? tableRows.reduce((a, r) => a + r.bounce_rate_percent, 0) / tableRows.length
        : 0;
      const pagesPerSession = totalSessions > 0 ? totalPageviews / totalSessions : 0;
      const returnRate = Number(ret.total_visitantes ?? 0) > 0
        ? (Number(ret.visitantes_retornando ?? 0) / Number(ret.total_visitantes ?? 0)) * 100
        : 0;

      let classificacao = 'Baixo';
      if (pagesPerSession >= 3 && avgDurationSeconds >= 120 && bounceRate <= 50) {
        classificacao = 'Excelente';
      } else if (pagesPerSession >= 2 && avgDurationSeconds >= 60 && bounceRate <= 65) {
        classificacao = 'Bom';
      } else if (pagesPerSession >= 1.5 && avgDurationSeconds >= 45 && bounceRate <= 75) {
        classificacao = 'Regular';
      }

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
      WITH sessoes_filtradas AS (
        SELECT
          id,
          id_visitante,
          COALESCE(NULLIF(utm_source, ''), 'Direto') AS fonte,
          timestamp_inicio_sessao
        FROM gestaoanalytics.sessoes
        WHERE (timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
          AND (eh_bot IS DISTINCT FROM TRUE)
      ),
      pv AS (
        SELECT e.id_sessao,
               COUNT(*) FILTER (
                 WHERE LOWER(COALESCE(e.nome_evento, '')) = 'page_view'
                    OR LOWER(COALESCE(e.tipo_evento, '')) = 'page_view'
               ) AS pageviews
        FROM gestaoanalytics.eventos e
        WHERE (e.timestamp_evento)::date >= CURRENT_DATE - ($1::int - 1)
        GROUP BY e.id_sessao
      ),
      dur AS (
        SELECT s.id,
               EXTRACT(EPOCH FROM (s.timestamp_fim_sessao - s.timestamp_inicio_sessao)) AS duracao_seg
        FROM gestaoanalytics.sessoes s
        WHERE (s.timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
      ),
      tx AS (
        SELECT t.id, t.id_sessao
        FROM gestaoanalytics.transacoes t
        WHERE (t.timestamp_transacao)::date >= CURRENT_DATE - ($1::int - 1)
      )
      SELECT
        s.fonte,
        COUNT(*) AS sessoes,
        SUM(COALESCE(pv.pageviews, 0)) AS pageviews,
        ROUND(AVG(NULLIF(dur.duracao_seg, 0))::numeric, 2) AS avg_duration_seconds,
        COUNT(DISTINCT tx.id) AS conversoes
      FROM sessoes_filtradas s
      LEFT JOIN pv ON pv.id_sessao = s.id
      LEFT JOIN dur ON dur.id = s.id
      LEFT JOIN tx ON tx.id_sessao = s.id
      GROUP BY s.fonte
      ORDER BY COUNT(*) DESC
    `;

    try {
      const rows = await runQuery<{
        fonte: string | null;
        sessoes: string | number | null;
        pageviews: string | number | null;
        avg_duration_seconds: string | number | null;
        conversoes: string | number | null;
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
        const pagesPerSession = sessoes > 0 ? pageviews / sessoes : 0;
        const conversionRate = sessoes > 0 ? (conversoes / sessoes) * 100 : 0;

        const qualityScore = (conversionRate * 1) + (pagesPerSession * 10) + (avgDuration * 0.01);

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
        message: `Análise de ${sorted.length} fontes de tráfego` ,
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
        nome_evento,
        COUNT(DISTINCT id_sessao) AS sessoes
      FROM gestaoanalytics.eventos
      WHERE timestamp_evento >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        AND nome_evento = ANY($2::text[])
      GROUP BY nome_evento
      ORDER BY array_position($2::text[], nome_evento)
    `;

    try {
      const rows = await runQuery<{ nome_evento: string; sessoes: string | number }>(sql, [range, funnel_events]);
      const counts = new Map<string, number>();
      rows.forEach(row => counts.set(row.nome_evento, Number(row.sessoes ?? 0)));

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
          url_pagina AS pagina,
          SUM(total_visualizacoes) AS pageviews
        FROM gestaoanalytics.agregado_diario_por_pagina
        WHERE data >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        GROUP BY url_pagina
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
      WITH sessoes_filtradas AS (
        SELECT
          id,
          COALESCE(NULLIF(tipo_dispositivo, ''), 'Desconhecido') AS device_type,
          COALESCE(NULLIF(navegador, ''), 'Desconhecido') AS browser,
          EXTRACT(EPOCH FROM (timestamp_fim_sessao - timestamp_inicio_sessao)) AS duracao_seg
        FROM gestaoanalytics.sessoes
        WHERE (timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
          AND (eh_bot IS DISTINCT FROM TRUE)
      ),
      pv AS (
        SELECT e.id_sessao,
               COUNT(*) FILTER (
                 WHERE LOWER(COALESCE(e.nome_evento, '')) = 'page_view'
                    OR LOWER(COALESCE(e.tipo_evento, '')) = 'page_view'
               ) AS pageviews
        FROM gestaoanalytics.eventos e
        WHERE (e.timestamp_evento)::date >= CURRENT_DATE - ($1::int - 1)
        GROUP BY e.id_sessao
      ),
      device_stats AS (
        SELECT
          'Device' AS tipo,
          device_type AS segmento,
          COUNT(*) AS sessoes,
          ROUND((COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0)) * 100, 2) AS percentual,
          ROUND(AVG(NULLIF(sf.duracao_seg, 0))::numeric, 2) AS avg_duration_seconds,
          ROUND(AVG(COALESCE(pv.pageviews, 0))::numeric, 2) AS avg_pageviews,
          0 AS rank
        FROM sessoes_filtradas sf
        LEFT JOIN pv ON pv.id_sessao = sf.id
        GROUP BY device_type
      ),
      browser_stats AS (
        SELECT
          'Browser' AS tipo,
          browser AS segmento,
          COUNT(*) AS sessoes,
          ROUND((COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0)) * 100, 2) AS percentual,
          ROUND(AVG(NULLIF(sf.duracao_seg, 0))::numeric, 2) AS avg_duration_seconds,
          ROUND(AVG(COALESCE(pv.pageviews, 0))::numeric, 2) AS avg_pageviews,
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank
        FROM sessoes_filtradas sf
        LEFT JOIN pv ON pv.id_sessao = sf.id
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

export const analyzeUserBehavior = tool({
  description: 'Analisa comportamento de usuários: novos vs recorrentes, frequência, engagement',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const sql = `
      WITH visitantes_periodo AS (
        SELECT DISTINCT s.id_visitante
        FROM gestaoanalytics.sessoes s
        WHERE (s.timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
          AND (s.eh_bot IS DISTINCT FROM TRUE)
      ),
      novos AS (
        SELECT COUNT(*) AS novos
        FROM gestaoanalytics.visitantes v
        WHERE v.id IN (SELECT id_visitante FROM visitantes_periodo)
          AND (v.primeira_visita_timestamp)::date >= CURRENT_DATE - ($1::int - 1)
      ),
      recorrentes AS (
        SELECT COUNT(*) AS recorrentes
        FROM gestaoanalytics.visitantes v
        WHERE v.id IN (SELECT id_visitante FROM visitantes_periodo)
          AND (v.primeira_visita_timestamp)::date < CURRENT_DATE - ($1::int - 1)
      ),
      sessoes_total AS (
        SELECT COUNT(*) AS total
        FROM gestaoanalytics.sessoes s
        WHERE (s.timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
          AND (s.eh_bot IS DISTINCT FROM TRUE)
      ),
      sessoes_eventos AS (
        SELECT COUNT(DISTINCT s.id) AS total
        FROM gestaoanalytics.sessoes s
        JOIN gestaoanalytics.eventos e ON e.id_sessao = s.id
        WHERE (s.timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
          AND (s.eh_bot IS DISTINCT FROM TRUE)
      ),
      freq AS (
        SELECT AVG(cnt)::numeric AS media
        FROM (
          SELECT s.id_visitante, COUNT(*) AS cnt
          FROM gestaoanalytics.sessoes s
          WHERE (s.timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
            AND (s.eh_bot IS DISTINCT FROM TRUE)
          GROUP BY s.id_visitante
        ) t
      )
      SELECT
        (SELECT COUNT(*) FROM visitantes_periodo) AS total_visitantes,
        (SELECT novos FROM novos) AS novos_visitantes,
        (SELECT recorrentes FROM recorrentes) AS visitantes_recorrentes,
        (SELECT media FROM freq) AS frequencia_media,
        (SELECT total FROM sessoes_total) AS total_sessoes,
        (SELECT total FROM sessoes_eventos) AS sessoes_com_evento
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

// ===== Novos nomes (PT-BR) mapeando ferramentas existentes =====
// Mantemos a lógica atual e apenas expomos nomes em português para o agente e a UI

export const desempenhoGeralDoSite = tool({
  description: 'KPIs gerais do site (sessões, usuários, engajamento, conversão, receita) no período',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
WITH base AS (
  SELECT
    s.id AS sessao_id,
    s.id_visitante,
    COUNT(e.id) AS total_eventos,
    COUNT(DISTINCT e.url_pagina) AS paginas_vistas,
    EXTRACT(EPOCH FROM (s.timestamp_fim_sessao - s.timestamp_inicio_sessao)) / 60 AS duracao_min,
    CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END AS houve_conversao,
    COALESCE(t.valor_total, 0) AS receita
  FROM gestaoanalytics.sessoes s
  LEFT JOIN gestaoanalytics.eventos e ON e.id_sessao = s.id
  LEFT JOIN gestaoanalytics.transacoes t ON t.id_sessao = s.id
  WHERE s.timestamp_inicio_sessao >= $1::date AND s.timestamp_inicio_sessao < ($2::date + INTERVAL '1 day')
  GROUP BY s.id, s.id_visitante, s.timestamp_inicio_sessao, s.timestamp_fim_sessao, t.id, t.valor_total
)
SELECT
  COUNT(DISTINCT sessao_id) AS total_sessoes,
  COUNT(DISTINCT id_visitante) AS visitantes_unicos,
  ROUND(AVG(paginas_vistas), 2) AS paginas_por_sessao,
  ROUND(AVG(duracao_min), 2) AS duracao_media_min,
  ROUND(SUM(CASE WHEN total_eventos = 1 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS taxa_rejeicao_pct,
  ROUND(SUM(houve_conversao)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS taxa_conversao_pct,
  ROUND(SUM(receita), 2) AS receita_total,
  ROUND(SUM(receita) / NULLIF(COUNT(DISTINCT id_visitante), 0), 2) AS receita_por_visitante,
  ROUND(SUM(receita) / NULLIF(COUNT(*), 0), 2) AS receita_por_sessao
FROM base`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ Desempenho geral do site (${data_de} a ${data_ate})`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Erro ao obter desempenho geral do site',
        error: error instanceof Error ? error.message : String(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});

export const desempenhoPorCanal = tool({
  description: 'Desempenho por canal/utm_source/dispositivo no período',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
WITH analitico AS (
  SELECT
    s.canal_trafego,
    s.utm_source,
    s.tipo_dispositivo,
    COUNT(DISTINCT s.id) AS sessoes,
    COUNT(DISTINCT s.id_visitante) AS visitantes,
    SUM(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END) AS conversoes,
    SUM(COALESCE(t.valor_total, 0)) AS receita,
    ROUND(SUM(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(DISTINCT s.id), 0) * 100, 2) AS taxa_conversao_pct
  FROM gestaoanalytics.sessoes s
  LEFT JOIN gestaoanalytics.transacoes t ON t.id_sessao = s.id
  WHERE s.timestamp_inicio_sessao >= $1::date AND s.timestamp_inicio_sessao < ($2::date + INTERVAL '1 day')
  GROUP BY s.canal_trafego, s.utm_source, s.tipo_dispositivo
)
SELECT 
  canal_trafego,
  utm_source,
  tipo_dispositivo,
  sessoes,
  visitantes,
  conversoes,
  ROUND(conversoes::numeric / NULLIF(sessoes, 0) * 100, 2) AS taxa_conversao_pct,
  ROUND(receita, 2) AS receita_total,
  ROUND(receita / NULLIF(sessoes, 0), 2) AS receita_por_sessao,
  ROUND(receita / NULLIF(visitantes, 0), 2) AS receita_por_usuario
FROM analitico
ORDER BY receita_total DESC`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ Desempenho por canal (${data_de} a ${data_ate})`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Erro ao obter desempenho por canal',
        error: error instanceof Error ? error.message : String(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});

export const etapasDoFunilGeral = tool({
  description: 'Etapas do funil geral com taxa de fim de funil no período',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
WITH funil AS (
  SELECT 
    CASE
      WHEN e.nome_evento ILIKE '%view%' THEN 'view_product'
      WHEN e.nome_evento ILIKE '%cart%' THEN 'add_to_cart'
      WHEN e.nome_evento ILIKE '%checkout%' THEN 'begin_checkout'
      WHEN e.nome_evento ILIKE '%purchase%' OR e.nome_evento ILIKE '%buy%' THEN 'purchase'
    END AS etapa,
    COUNT(DISTINCT e.id_sessao) AS sessoes
  FROM gestaoanalytics.eventos e
  WHERE e.timestamp_evento >= $1::date AND e.timestamp_evento < ($2::date + INTERVAL '1 day')
  GROUP BY 1
)
SELECT
  COALESCE(MAX(CASE WHEN f.etapa = 'view_product' THEN f.sessoes END), 0) AS visualizacoes,
  COALESCE(MAX(CASE WHEN f.etapa = 'add_to_cart' THEN f.sessoes END), 0) AS adicionados,
  COALESCE(MAX(CASE WHEN f.etapa = 'begin_checkout' THEN f.sessoes END), 0) AS checkouts,
  COALESCE(MAX(CASE WHEN f.etapa = 'purchase' THEN f.sessoes END), 0) AS compras,
  ROUND(
    MAX(CASE WHEN f.etapa = 'purchase' THEN f.sessoes END)::numeric 
    / NULLIF(MAX(CASE WHEN f.etapa = 'view_product' THEN f.sessoes END), 0) * 100, 
    2
  ) AS taxa_fim_funil_pct
FROM funil f`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ Etapas do funil (geral) (${data_de} a ${data_ate})`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Erro ao obter etapas do funil',
        error: error instanceof Error ? error.message : String(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});

// Novas tools (placeholders) – queries serão aplicadas na próxima etapa
export const desempenhoPorDiaHora = tool({
  description: 'Desempenho por dia e hora (sessões, receita, taxa de conversão) no período',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
SELECT 
  TO_CHAR(s.timestamp_inicio_sessao, 'Day') AS dia_semana,
  DATE_PART('hour', s.timestamp_inicio_sessao) AS hora,
  COUNT(DISTINCT s.id) AS sessoes,
  ROUND(SUM(t.valor_total), 2) AS receita,
  ROUND(COUNT(DISTINCT t.id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0) * 100, 2) AS taxa_conversao
FROM gestaoanalytics.sessoes s
LEFT JOIN gestaoanalytics.transacoes t ON t.id_sessao = s.id
WHERE s.timestamp_inicio_sessao >= $1::date AND s.timestamp_inicio_sessao < ($2::date + INTERVAL '1 day')
GROUP BY dia_semana, hora
ORDER BY hora`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ Desempenho por dia e hora (${data_de} a ${data_ate})`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Erro ao obter desempenho por dia e hora',
        error: error instanceof Error ? error.message : String(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});

// Alias temporários para manter compatibilidade até migrarmos todas as queries
export const desempenhoMobileVsDesktop = tool({
  description: 'Comparativo por dispositivo, SO e navegador no período',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
SELECT 
  s.tipo_dispositivo,
  s.sistema_operacional,
  s.navegador,
  COUNT(DISTINCT s.id) AS sessoes,
  ROUND(AVG(EXTRACT(EPOCH FROM (s.timestamp_fim_sessao - s.timestamp_inicio_sessao)) / 60), 2) AS duracao_media,
  ROUND(COUNT(DISTINCT t.id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0) * 100, 2) AS taxa_conversao,
  ROUND(SUM(t.valor_total), 2) AS receita_total
FROM gestaoanalytics.sessoes s
LEFT JOIN gestaoanalytics.transacoes t ON t.id_sessao = s.id
WHERE s.timestamp_inicio_sessao >= $1::date AND s.timestamp_inicio_sessao < ($2::date + INTERVAL '1 day')
GROUP BY s.tipo_dispositivo, s.sistema_operacional, s.navegador
ORDER BY receita_total DESC`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ Desempenho Mobile vs desktop (${data_de} a ${data_ate})`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Erro ao obter desempenho Mobile vs desktop',
        error: error instanceof Error ? error.message : String(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});

export const contribuicaoPorPagina = tool({
  description: 'Contribuição por página (sessões, transações, receita e receita por visita)',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    limit: z.number().default(20).describe('Número de páginas a retornar'),
  }),
  execute: async ({ data_de, data_ate, limit = 20 }) => {
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    const sql = `
SELECT 
  e.url_pagina,
  COUNT(DISTINCT e.id_sessao) AS sessoes,
  COUNT(DISTINCT t.id) AS transacoes,
  ROUND(SUM(t.valor_total), 2) AS receita,
  ROUND(SUM(t.valor_total) / NULLIF(COUNT(DISTINCT e.id_sessao), 0), 2) AS receita_por_visita
FROM gestaoanalytics.eventos e
LEFT JOIN gestaoanalytics.transacoes t ON e.id_sessao = t.id_sessao
WHERE e.timestamp_evento >= $1::date AND e.timestamp_evento < ($2::date + INTERVAL '1 day')
GROUP BY e.url_pagina
ORDER BY receita DESC
LIMIT $3`;
    const params = [data_de, data_ate, safeLimit] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ Contribuição por página (${data_de} a ${data_ate})`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Erro ao obter contribuição por página',
        error: error instanceof Error ? error.message : String(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});
export const visitantesRecorrentes = tool({
  description: 'Taxa de recorrência de visitantes no período',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
WITH visitas AS (
  SELECT 
    id_visitante,
    COUNT(*) AS sessoes
  FROM gestaoanalytics.sessoes
  WHERE timestamp_inicio_sessao >= $1::date AND timestamp_inicio_sessao < ($2::date + INTERVAL '1 day')
  GROUP BY id_visitante
)
SELECT 
  COUNT(*) AS total_visitantes,
  COUNT(CASE WHEN sessoes > 1 THEN 1 END) AS visitantes_recorrentes,
  ROUND(COUNT(CASE WHEN sessoes > 1 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS taxa_recorrencia_pct
FROM visitas`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      // Constrói linhas de resumo para tabela
      const row0 = rows[0] || { total_visitantes: 0, visitantes_recorrentes: 0, taxa_recorrencia_pct: 0 };
      const total = Number(row0.total_visitantes || 0);
      const recorrentes = Number(row0.visitantes_recorrentes || 0);
      const taxa = Number(row0.taxa_recorrencia_pct || 0);
      const tableRows = [
        { metrica: 'Total de visitantes', valor: total, percentual: '-' },
        { metrica: 'Visitantes recorrentes', valor: recorrentes, percentual: `${(total ? (recorrentes/total)*100 : 0).toFixed(2)}%` },
        { metrica: 'Taxa de recorrência', valor: taxa, percentual: `${taxa.toFixed(2)}%` },
      ];
      // período em dias (aproximado)
      const diffDays = Math.max(1, Math.floor((new Date(data_ate).getTime() - new Date(data_de).getTime()) / (24*3600*1000)) + 1);
      return {
        success: true,
        message: `✅ Visitantes recorrentes (${data_de} a ${data_ate})`,
        periodo_dias: diffDays,
        comportamento: {
          total_visitantes: total,
          novos_visitantes: total - recorrentes,
          visitantes_recorrentes: recorrentes,
          percentual_novos: total ? `${(((total - recorrentes)/total)*100).toFixed(2)}%` : '0%',
          percentual_recorrentes: `${taxa.toFixed(2)}%`,
          frequencia_media_visitas: '-',
          engagement_rate: '-',
          classificacao: taxa >= 30 ? 'Bom' : 'Regular',
        },
        rows: tableRows,
        count: tableRows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Erro ao calcular visitantes recorrentes',
        error: error instanceof Error ? error.message : String(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});

export const ltvMedio = tool({
  description: 'LTV médio por canal no período',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ data_de, data_ate }) => {
    const sql = `
WITH clientes AS (
  SELECT 
    s.canal_trafego,
    s.id_visitante AS id_visitante,
    SUM(t.valor_total) AS receita_cliente
  FROM gestaoanalytics.transacoes t
  JOIN gestaoanalytics.sessoes s ON s.id = t.id_sessao
  WHERE t.timestamp_transacao >= $1::date AND t.timestamp_transacao < ($2::date + INTERVAL '1 day')
  GROUP BY s.canal_trafego, s.id_visitante
)
SELECT 
  canal_trafego,
  COUNT(DISTINCT id_visitante) AS clientes_unicos,
  ROUND(AVG(receita_cliente), 2) AS ltv_medio,
  ROUND(SUM(receita_cliente), 2) AS receita_total,
  CASE 
    WHEN canal_trafego ILIKE '%pago%' THEN 25
    WHEN canal_trafego ILIKE '%meta%' THEN 30
    WHEN canal_trafego ILIKE '%google%' THEN 20
    ELSE 0
  END AS custo_aquisicao_medio,
  ROUND(AVG(receita_cliente) - 
        CASE 
          WHEN canal_trafego ILIKE '%pago%' THEN 25
          WHEN canal_trafego ILIKE '%meta%' THEN 30
          WHEN canal_trafego ILIKE '%google%' THEN 20
          ELSE 0
        END, 2) AS margem_liquida_estim
FROM clientes
GROUP BY canal_trafego
ORDER BY ltv_medio DESC`;
    const params = [data_de, data_ate] as unknown[];
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `✅ LTV médio por canal (${data_de} a ${data_ate})`,
        rows,
        count: rows.length,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Erro ao obter LTV médio',
        error: error instanceof Error ? error.message : String(error),
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  },
});
