import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]');

type PaidTrafficTable =
  | 'contas_ads'
  | 'campanhas'
  | 'grupos_de_anuncios'
  | 'anuncios_criacao'
  | 'anuncios_colaboradores'
  | 'anuncios_publicados'
  | 'metricas_anuncios'
  | 'resumos_campanhas';

type BaseFilters = {
  limit: number;
  plataforma?: string;
  status?: string;
  criativo_status?: string;
  objetivo?: string;
  data_de?: string;
  data_ate?: string;
  roas_minimo?: number;
  gasto_minimo?: number;
  gasto_maximo?: number;
  conversoes_minimo?: number;
  ctr_minimo?: number;
};

type QueryBuilder = (filters: BaseFilters) => { sql: string; params: unknown[] };

type BuildOptions = {
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  dateColumn?: { from?: string; to?: string };
  additional?: (ctx: { clauses: string[]; addParam: (value: unknown) => string }) => void;
};

const buildSelectQuery = (
  table: PaidTrafficTable,
  columns: string[],
  filters: BaseFilters,
  options: BuildOptions = {},
) => {
  const clauses: string[] = [];
  const params: unknown[] = [];

  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (filters.plataforma && columns.includes('plataforma')) {
    clauses.push(`plataforma = ${addParam(filters.plataforma)}`);
  }

  if (filters.status && columns.includes('status')) {
    clauses.push(`status = ${addParam(filters.status)}`);
  }

  if (filters.criativo_status && columns.includes('criativo_status')) {
    clauses.push(`criativo_status = ${addParam(filters.criativo_status)}`);
  }

  if (filters.objetivo && columns.includes('objetivo')) {
    clauses.push(`objetivo = ${addParam(filters.objetivo)}`);
  }

  if (options.dateColumn?.from && filters.data_de) {
    clauses.push(`${options.dateColumn.from} >= ${addParam(filters.data_de)}`);
  }

  if (filters.data_ate) {
    const dateToColumn = options.dateColumn?.to ?? options.dateColumn?.from;
    if (dateToColumn) {
      clauses.push(`${dateToColumn} <= ${addParam(filters.data_ate)}`);
    }
  }

  options.additional?.({ clauses, addParam });

  const limitPlaceholder = addParam(filters.limit);
  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderBy = options.orderBy ?? columns[0];
  const orderDirection = options.orderDirection ?? 'DESC';

  const sql = `
    SELECT ${columns.join(', ')}
    FROM trafego_pago.${table}
    ${whereClause}
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT ${limitPlaceholder}
  `.trim();

  return { sql, params };
};

const paidTrafficQueryBuilders: Record<PaidTrafficTable, QueryBuilder> = {
  contas_ads: (filters) =>
    buildSelectQuery(
      'contas_ads',
      [
        'id',
        'plataforma',
        'nome_conta',
        'conectado_em',
        'status',
        'budget_mensal',
        'moeda',
        'ultima_sync',
      ],
      filters,
      { orderBy: 'conectado_em', orderDirection: 'DESC' },
    ),
  campanhas: (filters) =>
    buildSelectQuery(
      'campanhas',
      [
        'id',
        'conta_ads_id',
        'nome',
        'objetivo',
        'status',
        'inicio',
        'fim',
        'orcamento_total',
        'orcamento_diario',
        'moeda',
        'publico_alvo',
        'created_at',
        'updated_at',
      ],
      filters,
      { orderBy: 'inicio', orderDirection: 'DESC', dateColumn: { from: 'inicio', to: 'fim' } },
    ),
  grupos_de_anuncios: (filters) =>
    buildSelectQuery(
      'grupos_de_anuncios',
      [
        'id',
        'campanha_id',
        'nome',
        'status',
        'publico_alvo',
        'budget_diario',
        'lance',
        'criado_em',
        'atualizado_em',
      ],
      filters,
      { orderBy: 'criado_em', orderDirection: 'DESC', dateColumn: { from: 'criado_em', to: 'atualizado_em' } },
    ),
  anuncios_criacao: (filters) =>
    buildSelectQuery(
      'anuncios_criacao',
      [
        'id',
        'grupo_id',
        'titulo',
        'hook',
        'expansao_hook',
        'copy_completo',
        'legenda',
        'criativo_status',
        'criado_por',
        'atualizado_por',
        'criado_em',
        'atualizado_em',
      ],
      filters,
      { orderBy: 'criado_em', orderDirection: 'DESC', dateColumn: { from: 'criado_em', to: 'atualizado_em' } },
    ),
  anuncios_colaboradores: (filters) =>
    buildSelectQuery(
      'anuncios_colaboradores',
      ['id', 'anuncio_criacao_id', 'usuario_id', 'acao', 'comentario', 'registrado_em'],
      filters,
      { orderBy: 'registrado_em', orderDirection: 'DESC', dateColumn: { from: 'registrado_em' } },
    ),
  anuncios_publicados: (filters) =>
    buildSelectQuery(
      'anuncios_publicados',
      [
        'id',
        'anuncio_criacao_id',
        'conta_ads_id',
        'grupo_id',
        'anuncio_id_plataforma',
        'titulo',
        'descricao',
        'publicado_em',
        'status',
        'orcamento_diario',
        'gasto_total',
        'criativo_id',
      ],
      filters,
      { orderBy: 'publicado_em', orderDirection: 'DESC', dateColumn: { from: 'publicado_em' } },
    ),
  metricas_anuncios: (filters) =>
    buildSelectQuery(
      'metricas_anuncios',
      [
        'id',
        'anuncio_id',
        'anuncio_publicado_id',
        'campanha_id',
        'plataforma',
        'data',
        'impressao',
        'cliques',
        'ctr',
        'cpc',
        'conversao',
        'cpa',
        'gasto',
        'receita',
        'roas',
        'cpm_real',
        'engajamento',
        'criado_em',
      ],
      filters,
      {
        orderBy: 'data',
        orderDirection: 'DESC',
        dateColumn: { from: 'data' },
        additional: ({ clauses, addParam }) => {
          if (filters.roas_minimo !== undefined) {
            clauses.push(`roas >= ${addParam(filters.roas_minimo)}`);
          }
          if (filters.gasto_minimo !== undefined) {
            clauses.push(`gasto >= ${addParam(filters.gasto_minimo)}`);
          }
          if (filters.gasto_maximo !== undefined) {
            clauses.push(`gasto <= ${addParam(filters.gasto_maximo)}`);
          }
          if (filters.conversoes_minimo !== undefined) {
            clauses.push(`conversao >= ${addParam(filters.conversoes_minimo)}`);
          }
          if (filters.ctr_minimo !== undefined) {
            clauses.push(`ctr >= ${addParam(filters.ctr_minimo)}`);
          }
        },
      },
    ),
  resumos_campanhas: (filters) =>
    buildSelectQuery(
      'resumos_campanhas',
      [
        'id',
        'campanha_id',
        'total_gasto',
        'total_cliques',
        'total_conversoes',
        'ctr_medio',
        'cpc_medio',
        'cpa_medio',
        'roas_medio',
        'registrado_em',
      ],
      filters,
      { orderBy: 'registrado_em', orderDirection: 'DESC', dateColumn: { from: 'registrado_em' } },
    ),
};

export const getPaidTrafficData = tool({
  description: 'Busca dados de tráfego pago (contas ads, campanhas, anúncios, métricas)',
  inputSchema: z.object({
    table: z.enum([
      'contas_ads',
      'campanhas',
      'grupos_de_anuncios',
      'anuncios_criacao',
      'anuncios_colaboradores',
      'anuncios_publicados',
      'metricas_anuncios',
      'resumos_campanhas',
    ]),
    limit: z.number().default(20),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional(),
    status: z.enum(['ativa', 'ativo', 'pausada', 'pausado', 'encerrada', 'encerrado', 'rejeitado']).optional(),
    criativo_status: z.enum(['aprovado', 'rascunho', 'em_revisao', 'rejeitado']).optional(),
    objetivo: z.string().optional(),
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
    roas_minimo: z.number().optional(),
    gasto_minimo: z.number().optional(),
    gasto_maximo: z.number().optional(),
    conversoes_minimo: z.number().optional(),
    ctr_minimo: z.number().optional(),
  }),
  execute: async (filters) => {
    const { table, limit, ...rest } = filters;
    const builder = paidTrafficQueryBuilders[table];
    const { sql, params } = builder({
      limit: typeof limit === 'number' ? limit : 20,
      ...rest,
    });

    try {
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        table,
        count: rows.length,
        rows,
        message: `✅ ${rows.length} registros encontrados em ${table}`,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO getPaidTrafficData:', error);
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

export const analyzeCampaignROAS = tool({
  description: 'Analisa ROI/ROAS por campanha: gasto, receita, conversões, custo por conversão',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ date_range_days = 30, plataforma }) => {
    const sql = `
WITH metricas AS (
  SELECT
    ma.campanha_id,
    COALESCE(c.nome, 'Sem campanha') AS campanha_nome,
    COALESCE(c.status, 'desconhecido') AS campanha_status,
    COALESCE(c.objetivo, 'não informado') AS objetivo,
    SUM(ma.gasto) AS gasto_total,
    SUM(ma.receita) AS receita_total,
    SUM(ma.conversao) AS conversoes_total,
    SUM(ma.impressao) AS impressoes_total,
    SUM(ma.cliques) AS cliques_total
  FROM trafego_pago.metricas_anuncios ma
  LEFT JOIN trafego_pago.campanhas c ON c.id = ma.campanha_id
  WHERE ma.data >= current_date - ($1::int - 1) * INTERVAL '1 day'
    AND ($2::text IS NULL OR ma.plataforma = $2)
  GROUP BY ma.campanha_id, c.nome, c.status, c.objetivo
)
SELECT
  campanha_id,
  campanha_nome,
  campanha_status,
  objetivo,
  gasto_total,
  receita_total,
  conversoes_total,
  impressoes_total,
  cliques_total,
  CASE WHEN gasto_total > 0 THEN receita_total / gasto_total ELSE 0 END AS roas,
  CASE WHEN conversoes_total > 0 THEN gasto_total / conversoes_total ELSE 0 END AS cpa,
  CASE WHEN impressoes_total > 0 THEN (cliques_total::numeric / impressoes_total) * 100 ELSE 0 END AS ctr
FROM metricas
ORDER BY roas DESC, gasto_total DESC
LIMIT $3;
    `.trim();

    type CampaignAggRow = {
      campanha_id: string | null;
      campanha_nome: string;
      campanha_status: string;
      objetivo: string;
      gasto_total: number | null;
      receita_total: number | null;
      conversoes_total: number | null;
      impressoes_total: number | null;
      cliques_total: number | null;
      roas: number | null;
      cpa: number | null;
      ctr: number | null;
    };

    const params = [date_range_days, plataforma ?? null, 100];

    try {
      const rows = await runQuery<CampaignAggRow>(sql, params);

      if (!rows.length) {
        return {
          success: false,
          message: 'Nenhuma métrica encontrada no período',
          periodo_dias: date_range_days,
          plataforma: plataforma ?? 'Todas',
          campanhas: [],
          sql_query: sql,
          sql_params: formatSqlParams(params),
        };
      }

      const campanhas = rows.map((row) => {
        const gasto = Number(row.gasto_total ?? 0);
        const receita = Number(row.receita_total ?? 0);
        const conversoes = Number(row.conversoes_total ?? 0);
        const roas = Number(row.roas ?? 0);
        const cpa = Number(row.cpa ?? 0);
        const ctr = Number(row.ctr ?? 0);
        const campanhaLabel = row.campanha_nome?.trim() ? row.campanha_nome : row.campanha_id ?? 'Sem campanha';

        let classificacao = 'Ruim';
        if (roas >= 4) classificacao = 'Excelente';
        else if (roas >= 2.5) classificacao = 'Bom';
        else if (roas >= 1.5) classificacao = 'Regular';

        return {
          campanha_id: campanhaLabel,
          campanha_identificador: row.campanha_id,
          campanha_nome: row.campanha_nome,
          campanha_status: row.campanha_status,
          objetivo: row.objetivo,
          gasto: gasto.toFixed(2),
          receita: receita.toFixed(2),
          conversoes,
          roas: roas.toFixed(2),
          custo_por_conversao: cpa.toFixed(2),
          ctr: `${ctr.toFixed(2)}%`,
          classificacao,
        };
      });

      return {
        success: true,
        message: `Análise de ${campanhas.length} campanhas`,
        periodo_dias: date_range_days,
        plataforma: plataforma ?? 'Todas',
        total_campanhas: campanhas.length,
        melhor_campanha: campanhas[0]?.campanha_id,
        campanhas,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO analyzeCampaignROAS:', error);
      return {
        success: false,
        message: `Erro ao analisar ROAS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        periodo_dias: date_range_days,
        plataforma: plataforma ?? 'Todas',
        campanhas: [],
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const compareAdsPlatforms = tool({
  description: 'Compara performance entre plataformas dentro de um intervalo de datas',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar uma plataforma específica'),
  }),
  execute: async ({ data_de, data_ate, plataforma }) => {
    const sqlQuery = `
SELECT 
  ca.plataforma,

  -- Valores absolutos
  SUM(m.impressao) AS total_impressoes,
  SUM(m.cliques) AS total_cliques,
  SUM(m.conversao) AS total_conversoes,
  ROUND(SUM(m.gasto), 2) AS total_gasto,
  ROUND(SUM(m.receita), 2) AS total_receita,

  -- Métricas derivadas
  ROUND(SUM(m.cliques)::numeric / NULLIF(SUM(m.impressao), 0) * 100, 2) AS ctr,         -- taxa de cliques
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.cliques), 0), 2) AS cpc,                   -- custo por clique
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.conversao), 0), 2) AS cpa,                 -- custo por aquisição
  ROUND(SUM(m.receita)::numeric / NULLIF(SUM(m.gasto), 0), 2) AS roas,                  -- retorno sobre gasto
  ROUND(SUM(m.receita)::numeric - SUM(m.gasto), 2) AS lucro                             -- lucro bruto (opcional)
  
FROM trafego_pago.metricas_anuncios m
JOIN trafego_pago.anuncios_publicados ap ON m.anuncio_publicado_id = ap.id
JOIN trafego_pago.contas_ads ca ON ap.conta_ads_id = ca.id
WHERE m.data BETWEEN $1::date AND $2::date
  AND ($3::text IS NULL OR ca.plataforma = $3)
GROUP BY ca.plataforma
ORDER BY total_gasto DESC;
    `.trim();

    type Row = {
      plataforma: string | null;
      total_impressoes: number | string | null;
      total_cliques: number | string | null;
      total_conversoes: number | string | null;
      total_gasto: number | string | null;
      total_receita: number | string | null;
      ctr: number | string | null;
      cpc: number | string | null;
      cpa: number | string | null;
      roas: number | string | null;
      lucro: number | string | null;
    };

    try {
      const params = [data_de, data_ate, plataforma ?? null];
      const rows = await runQuery<Row>(sqlQuery, params);

      if (!rows || rows.length === 0) {
        return {
          success: false,
          message: 'Nenhuma métrica encontrada',
          sql_query: sqlQuery,
          sql_params: formatSqlParams(params),
        };
      }

      // Melhor/pior plataforma por ROAS (opcional, não afeta a tabela)
      const byRoas = [...rows].sort((a, b) => Number(b.roas ?? 0) - Number(a.roas ?? 0));

      return {
        success: true,
        message: `Análise de ${rows.length} plataformas`,
        total_plataformas: rows.length,
        melhor_plataforma: byRoas[0]?.plataforma ?? undefined,
        pior_plataforma: byRoas[byRoas.length - 1]?.plataforma ?? undefined,
        plataformas: rows,
        sql_query: sqlQuery,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO compareAdsPlatforms:', error);
      return {
        success: false,
        message: `Erro ao comparar plataformas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        sql_query: sqlQuery,
        sql_params: formatSqlParams([data_de, data_ate, plataforma ?? null]),
      };
    }
  }
});

export const analyzeCreativePerformance = tool({
  description: 'Desempenho por anúncio (título/plataforma) com métricas derivadas',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar uma plataforma específica'),
    limit: z.number().default(20).describe('Limite de linhas (default 20)'),
  }),
  execute: async ({ data_de, data_ate, plataforma, limit = 20 }) => {
    const sql = `
SELECT 
  ap.titulo AS anuncio,
  ca.plataforma,
  SUM(m.impressao) AS total_impressoes,
  SUM(m.cliques) AS total_cliques,
  SUM(m.conversao) AS total_conversoes,
  ROUND(SUM(m.gasto), 2) AS total_gasto,
  ROUND(SUM(m.receita), 2) AS total_receita,

  ROUND(SUM(m.cliques)::numeric / NULLIF(SUM(m.impressao), 0) * 100, 2) AS ctr,
  ROUND(SUM(m.conversao)::numeric / NULLIF(SUM(m.cliques), 0) * 100, 2) AS taxa_conversao,
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.cliques), 0), 2) AS cpc,
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.conversao), 0), 2) AS cpa,
  ROUND(SUM(m.receita)::numeric / NULLIF(SUM(m.gasto), 0), 2) AS roas,
  ROUND(SUM(m.receita)::numeric - SUM(m.gasto), 2) AS lucro,
  ROUND((SUM(m.gasto)::numeric / NULLIF(SUM(m.impressao), 0)) * 1000, 2) AS cpm,
  ROUND(SUM(m.receita)::numeric / NULLIF(SUM(m.conversao), 0), 2) AS ticket_medio,
  ROUND(AVG(m.frequencia), 2) AS frequencia_media,
  COALESCE(SUM(m.likes) + SUM(m.comentarios) + SUM(m.compartilhamentos) + SUM(m.salvos), 0) AS engajamento_total

FROM trafego_pago.metricas_anuncios m
JOIN trafego_pago.anuncios_publicados ap ON m.anuncio_publicado_id = ap.id
JOIN trafego_pago.contas_ads ca ON ap.conta_ads_id = ca.id

WHERE m.data BETWEEN $1::date AND $2::date
  AND ($3::text IS NULL OR ca.plataforma = $3)

GROUP BY ap.titulo, ca.plataforma
ORDER BY roas DESC
LIMIT $4;`.trim();

    try {
      const params = [data_de, data_ate, plataforma ?? null, limit];
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `Desempenho de ${rows.length} anúncio(s)`,
        count: rows.length,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO analyzeCreativePerformance:', error);
      return {
        success: false,
        message: `Erro ao analisar anúncios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams([data_de, data_ate, plataforma ?? null, limit]),
      };
    }
  }
});

export const identifyTopAds = tool({
  description: 'Identifica melhores anúncios por ROAS, conversões e CTR',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    limit: z.number().default(10).describe('Número de anúncios a retornar'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ date_range_days = 30, limit = 10, plataforma }) => {
    const sql = `
      WITH base AS (
        SELECT
          ap.id AS anuncio_id,
          COALESCE(ap.titulo, 'Sem título') AS anuncio_titulo,
          ca.plataforma,
          SUM(ma.gasto) AS gasto_total,
          SUM(ma.receita) AS receita_total,
          SUM(ma.conversao) AS conversoes_total,
          SUM(ma.impressao) AS impressoes_total,
          SUM(ma.cliques) AS cliques_total
        FROM trafego_pago.metricas_anuncios ma
        LEFT JOIN trafego_pago.anuncios_publicados ap ON ap.id = ma.anuncio_publicado_id
        LEFT JOIN trafego_pago.contas_ads ca ON ap.conta_ads_id = ca.id
        WHERE ma.data >= current_date - ($1::int - 1) * INTERVAL '1 day'
          AND ma.conversao >= 1
          AND ($2::text IS NULL OR ca.plataforma = $2)
        GROUP BY ap.id, ap.titulo, ca.plataforma
      )
      SELECT
        anuncio_id,
        anuncio_titulo,
        plataforma,
        gasto_total,
        receita_total,
        conversoes_total,
        impressoes_total,
        cliques_total,
        CASE WHEN gasto_total > 0 THEN receita_total / gasto_total ELSE 0 END AS roas,
        CASE WHEN conversoes_total > 0 THEN gasto_total / conversoes_total ELSE 0 END AS cpa,
        CASE WHEN impressoes_total > 0 THEN (cliques_total::numeric / impressoes_total) * 100 ELSE 0 END AS ctr
      FROM base
      ORDER BY roas DESC, conversoes_total DESC
      LIMIT $3;
    `.trim();

    type TopAdRow = {
      anuncio_id: string | null;
      anuncio_titulo: string | null;
      plataforma: string | null;
      gasto_total: number | null;
      receita_total: number | null;
      conversoes_total: number | null;
      impressoes_total: number | null;
      cliques_total: number | null;
      roas: number | null;
      cpa: number | null;
      ctr: number | null;
    };

    const params = [date_range_days, plataforma ?? null, limit];

    try {
      const rows = await runQuery<TopAdRow>(sql, params);

      if (!rows.length) {
        return {
          success: false,
          message: 'Nenhum anúncio com conversões encontrado',
          periodo_dias: date_range_days,
          plataforma: plataforma ?? 'Todas',
          top_anuncios: [],
          total_analisados: 0,
          sql_query: sql,
          sql_params: formatSqlParams(params),
        };
      }

      const anuncios = rows.map((row) => {
        const gasto = Number(row.gasto_total ?? 0);
        const receita = Number(row.receita_total ?? 0);
        const conversoes = Number(row.conversoes_total ?? 0);
        const roas = Number(row.roas ?? 0);
        const ctr = Number(row.ctr ?? 0);
        const cpa = Number(row.cpa ?? 0);

        let classificacao = 'Baixa';
        if (roas >= 4) classificacao = 'Excelente';
        else if (roas >= 2.5) classificacao = 'Boa';
        else if (roas >= 1.5) classificacao = 'Regular';

        return {
          anuncio_id: row.anuncio_id ?? 'sem-anuncio',
          titulo: row.anuncio_titulo ?? 'Sem título',
          plataforma: row.plataforma ?? 'Desconhecida',
          gasto: gasto.toFixed(2),
          receita: receita.toFixed(2),
          conversoes,
          roas: roas.toFixed(2),
          ctr: `${ctr.toFixed(2)}%`,
          custo_por_conversao: cpa.toFixed(2),
          classificacao,
        };
      });

      return {
        success: true,
        message: `Top ${anuncios.length} anúncios identificados`,
        periodo_dias: date_range_days,
        plataforma: plataforma ?? 'Todas',
        total_analisados: anuncios.length,
        top_anuncios: anuncios,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO identifyTopAds:', error);
      return {
        success: false,
        message: `Erro ao identificar top anúncios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        periodo_dias: date_range_days,
        plataforma: plataforma ?? 'Todas',
        top_anuncios: [],
        total_analisados: 0,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const analyzeSpendingTrends = tool({
  description: 'Analisa tendências de gasto: diário, semanal, anomalias',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ date_range_days = 30, plataforma }) => {
    const sql = `
      SELECT
        data::date AS dia,
        SUM(gasto) AS gasto_total,
        SUM(receita) AS receita_total
      FROM trafego_pago.metricas_anuncios
      WHERE data >= current_date - ($1::int - 1) * INTERVAL '1 day'
        AND ($2::text IS NULL OR plataforma = $2)
      GROUP BY dia
      ORDER BY dia ASC
    `.trim();

    const params = [date_range_days, plataforma ?? null];

    try {
      const rows = await runQuery<{ dia: string; gasto_total: number | null; receita_total: number | null }>(
        sql,
        params,
      );

      if (!rows.length) {
        return {
          success: false,
          message: 'Nenhuma métrica encontrada',
          periodo_dias: date_range_days,
          plataforma: plataforma ?? 'Todas',
          gastos_diarios: [],
          estatisticas: {},
          sql_query: sql,
          sql_params: formatSqlParams(params),
        };
      }

      const gastosDiarios = rows.map((row) => ({
        data: row.dia,
        gasto: Number(row.gasto_total ?? 0).toFixed(2),
        receita: Number(row.receita_total ?? 0).toFixed(2),
      }));

      const gastosValores = rows.map((row) => Number(row.gasto_total ?? 0));
      const media = gastosValores.reduce((acc, val) => acc + val, 0) / gastosValores.length;
      const max = Math.max(...gastosValores);
      const min = Math.min(...gastosValores);

      let tendencia = 'Estável';
      if (gastosValores.length >= 7) {
        const primeiraSemana = gastosValores.slice(0, 7).reduce((acc, val) => acc + val, 0) / 7;
        const ultimaSemana = gastosValores.slice(-7).reduce((acc, val) => acc + val, 0) / 7;
        if (primeiraSemana !== 0) {
          const variacao = ((ultimaSemana - primeiraSemana) / primeiraSemana) * 100;
          if (variacao > 10) tendencia = 'Crescente';
          else if (variacao < -10) tendencia = 'Decrescente';
        }
      }

      return {
        success: true,
        message: `Análise de gastos: ${gastosDiarios.length} dias`,
        periodo_dias: date_range_days,
        plataforma: plataforma ?? 'Todas',
        estatisticas: {
          gasto_medio_dia: media.toFixed(2),
          gasto_maximo: max.toFixed(2),
          gasto_minimo: min.toFixed(2),
          tendencia,
        },
        gastos_diarios: gastosDiarios,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO analyzeSpendingTrends:', error);
      return {
        success: false,
        message: `Erro ao analisar tendências: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        periodo_dias: date_range_days,
        plataforma: plataforma ?? 'Todas',
        gastos_diarios: [],
        estatisticas: {},
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const calculateCostMetrics = tool({
  description: 'Calcula métricas de custo: CPM, CPC, CPL, CPA',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ date_range_days = 30, plataforma }) => {
    const sql = `
      SELECT
        SUM(gasto) AS total_gasto,
        SUM(impressao) AS total_impressoes,
        SUM(cliques) AS total_cliques,
        SUM(conversao) AS total_conversoes
      FROM trafego_pago.metricas_anuncios
      WHERE data >= current_date - ($1::int - 1) * INTERVAL '1 day'
        AND ($2::text IS NULL OR plataforma = $2)
    `.trim();

    const params = [date_range_days, plataforma ?? null];

    try {
      const [row] = await runQuery<{
        total_gasto: number | null;
        total_impressoes: number | null;
        total_cliques: number | null;
        total_conversoes: number | null;
      }>(sql, params);

      if (!row) {
        return {
          success: false,
          message: 'Nenhuma métrica encontrada',
          periodo_dias: date_range_days,
          plataforma: plataforma ?? 'Todas',
          metricas: {},
          sql_query: sql,
          sql_params: formatSqlParams(params),
        };
      }

      const total_gasto = Number(row.total_gasto ?? 0);
      const total_impressoes = Number(row.total_impressoes ?? 0);
      const total_cliques = Number(row.total_cliques ?? 0);
      const total_conversoes = Number(row.total_conversoes ?? 0);

      const cpm = total_impressoes > 0 ? (total_gasto / total_impressoes) * 1000 : 0;
      const cpc = total_cliques > 0 ? total_gasto / total_cliques : 0;
      const cpa = total_conversoes > 0 ? total_gasto / total_conversoes : 0;
      const ctr = total_impressoes > 0 ? (total_cliques / total_impressoes) * 100 : 0;

      let classificacao_eficiencia = 'Baixa';
      if (cpa < 50 && ctr > 2) classificacao_eficiencia = 'Excelente';
      else if (cpa < 100 && ctr > 1) classificacao_eficiencia = 'Boa';
      else if (cpa < 200) classificacao_eficiencia = 'Regular';

      return {
        success: true,
        message: 'Métricas de custo calculadas',
        periodo_dias: date_range_days,
        plataforma: plataforma ?? 'Todas',
        metricas: {
          total_gasto: total_gasto.toFixed(2),
          total_impressoes,
          total_cliques,
          total_conversoes,
          cpm: cpm.toFixed(2),
          cpc: cpc.toFixed(2),
          cpa: cpa.toFixed(2),
          ctr: `${ctr.toFixed(2)}%`,
          classificacao_eficiencia,
        },
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO calculateCostMetrics:', error);
      return {
        success: false,
        message: `Erro ao calcular métricas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        periodo_dias: date_range_days,
        plataforma: plataforma ?? 'Todas',
        metricas: {},
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

export const forecastAdPerformance = tool({
  description: 'Previsão de performance: gasto, conversões, ROAS esperado',
  inputSchema: z.object({
    lookback_days: z.number().default(30).describe('Dias históricos para análise'),
    forecast_days: z.number().default(7).describe('Dias a prever'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ lookback_days = 30, forecast_days = 7, plataforma }) => {
    const sql = `
      SELECT
        data::date AS dia,
        SUM(gasto) AS gasto_total,
        SUM(receita) AS receita_total,
        SUM(conversao) AS conversoes_total
      FROM trafego_pago.metricas_anuncios
      WHERE data >= current_date - ($1::int - 1) * INTERVAL '1 day'
        AND ($2::text IS NULL OR plataforma = $2)
      GROUP BY dia
      ORDER BY dia ASC
    `.trim();

    const params = [lookback_days, plataforma ?? null];

    try {
      const rows = await runQuery<{
        dia: string;
        gasto_total: number | null;
        receita_total: number | null;
        conversoes_total: number | null;
      }>(sql, params);

      if (!rows.length) {
        return {
          success: false,
          message: 'Dados insuficientes para previsão',
          lookback_days,
          forecast_days,
          plataforma: plataforma ?? 'Todas',
          historico: {},
          previsao: {},
          sql_query: sql,
          sql_params: formatSqlParams(params),
        };
      }

      const total_gasto = rows.reduce((acc, row) => acc + Number(row.gasto_total ?? 0), 0);
      const total_receita = rows.reduce((acc, row) => acc + Number(row.receita_total ?? 0), 0);
      const total_conversoes = rows.reduce((acc, row) => acc + Number(row.conversoes_total ?? 0), 0);

      const diasConsiderados = Math.max(1, Math.min(rows.length, lookback_days));
      const gasto_medio_dia = total_gasto / diasConsiderados;
      const conversoes_medio_dia = total_conversoes / diasConsiderados;
      const roas_medio = total_gasto > 0 ? total_receita / total_gasto : 0;

      const gasto_previsto = gasto_medio_dia * forecast_days;
      const conversoes_previstas = Math.round(conversoes_medio_dia * forecast_days);
      const receita_prevista = gasto_previsto * roas_medio;

      return {
        success: true,
        message: `Previsão para ${forecast_days} dias`,
        lookback_days,
        forecast_days,
        plataforma: plataforma ?? 'Todas',
        historico: {
          gasto_medio_dia: gasto_medio_dia.toFixed(2),
          conversoes_medio_dia: conversoes_medio_dia.toFixed(2),
          roas_medio: roas_medio.toFixed(2),
        },
        previsao: {
          gasto_previsto: gasto_previsto.toFixed(2),
          conversoes_previstas,
          receita_prevista: receita_prevista.toFixed(2),
          roas_esperado: roas_medio.toFixed(2),
        },
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO forecastAdPerformance:', error);
      return {
        success: false,
        message: `Erro ao prever performance: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        lookback_days,
        forecast_days,
        plataforma: plataforma ?? 'Todas',
        historico: {},
        previsao: {},
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    }
  }
});

// Nova tool separada: analiseDeCampanhas (campanha/plataforma) com métricas derivadas
export const analiseDeCampanhas = tool({
  description: 'Análise de campanhas (campanha/plataforma) com métricas: CTR, CPC, CPA, ROAS, CPM, Ticket Médio, etc.',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar uma plataforma específica'),
  }),
  execute: async ({ data_de, data_ate, plataforma }) => {
    const sql = `
SELECT 
  c.nome AS campanha,
  ca.plataforma,
  SUM(m.impressao) AS total_impressoes,
  SUM(m.cliques) AS total_cliques,
  SUM(m.conversao) AS total_conversoes,
  ROUND(SUM(m.gasto), 2) AS total_gasto,
  ROUND(SUM(m.receita), 2) AS total_receita,

  ROUND(SUM(m.cliques)::numeric / NULLIF(SUM(m.impressao), 0) * 100, 2) AS ctr,
  ROUND(SUM(m.conversao)::numeric / NULLIF(SUM(m.cliques), 0) * 100, 2) AS taxa_conversao,
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.cliques), 0), 2) AS cpc,
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.conversao), 0), 2) AS cpa,
  ROUND(SUM(m.receita)::numeric / NULLIF(SUM(m.gasto), 0), 2) AS roas,
  ROUND(SUM(m.receita)::numeric - SUM(m.gasto), 2) AS lucro,
  ROUND((SUM(m.gasto)::numeric / NULLIF(SUM(m.impressao), 0)) * 1000, 2) AS cpm,
  ROUND(SUM(m.receita)::numeric / NULLIF(SUM(m.conversao), 0), 2) AS ticket_medio,
  ROUND(AVG(m.frequencia), 2) AS frequencia_media,
  COALESCE(SUM(m.likes) + SUM(m.comentarios) + SUM(m.compartilhamentos) + SUM(m.salvos), 0) AS engajamento_total

FROM trafego_pago.metricas_anuncios m
JOIN trafego_pago.anuncios_publicados ap ON m.anuncio_publicado_id = ap.id
JOIN trafego_pago.grupos_de_anuncios ga ON ap.grupo_id = ga.id
JOIN trafego_pago.campanhas c ON ga.campanha_id = c.id
JOIN trafego_pago.contas_ads ca ON ap.conta_ads_id = ca.id

WHERE m.data BETWEEN $1::date AND $2::date
  AND ($3::text IS NULL OR ca.plataforma = $3)
GROUP BY c.nome, ca.plataforma
ORDER BY total_gasto DESC;`.trim();

    try {
      const params = [data_de, data_ate, plataforma ?? null];
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return {
        success: true,
        message: `Análise de ${rows.length} linhas (campanha/plataforma)`,
        count: rows.length,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO analiseDeCampanhas:', error);
      return {
        success: false,
        message: `Erro ao analisar campanhas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
        sql_query: sql,
        sql_params: formatSqlParams([data_de, data_ate]),
      };
    }
  }
});

// Desempenho por Grupo de Anúncio (campanha de ad sets)
export const desempenhoPorGrupoDeAnuncio = tool({
  description: 'Desempenho agregado por grupo de anúncio (grupo/plataforma) com métricas derivadas',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar uma plataforma específica'),
    limit: z.number().default(50),
  }),
  execute: async ({ data_de, data_ate, plataforma, limit = 50 }) => {
    const sql = `
SELECT
  c.nome AS campanha,
  ga.nome AS grupo_de_anuncios,
  ca.plataforma,

  SUM(m.impressao) AS total_impressoes,
  SUM(m.cliques) AS total_cliques,
  SUM(m.conversao) AS total_conversoes,
  ROUND(SUM(m.gasto), 2) AS total_gasto,
  ROUND(SUM(m.receita), 2) AS total_receita,

  ROUND(SUM(m.cliques)::numeric / NULLIF(SUM(m.impressao), 0) * 100, 2) AS ctr,
  ROUND(SUM(m.conversao)::numeric / NULLIF(SUM(m.cliques), 0) * 100, 2) AS taxa_conversao,
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.cliques), 0), 2) AS cpc,
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.conversao), 0), 2) AS cpa,
  ROUND(SUM(m.receita)::numeric / NULLIF(SUM(m.gasto), 0), 2) AS roas,
  ROUND(SUM(m.receita)::numeric - SUM(m.gasto), 2) AS lucro,
  ROUND((SUM(m.gasto)::numeric / NULLIF(SUM(m.impressao), 0)) * 1000, 2) AS cpm,
  ROUND(SUM(m.receita)::numeric / NULLIF(SUM(m.conversao), 0), 2) AS ticket_medio,
  ROUND(AVG(m.frequencia), 2) AS frequencia_media,
  COALESCE(SUM(m.likes) + SUM(m.comentarios) + SUM(m.compartilhamentos) + SUM(m.salvos), 0) AS engajamento_total

FROM trafego_pago.metricas_anuncios m
JOIN trafego_pago.anuncios_publicados ap ON m.anuncio_publicado_id = ap.id
JOIN trafego_pago.grupos_de_anuncios ga ON ap.grupo_id = ga.id
JOIN trafego_pago.campanhas c ON ga.campanha_id = c.id
JOIN trafego_pago.contas_ads ca ON ap.conta_ads_id = ca.id

WHERE m.data BETWEEN $1::date AND $2::date
  AND ($3::text IS NULL OR ca.plataforma = $3)

GROUP BY c.nome, ga.nome, ca.plataforma
ORDER BY total_gasto DESC
LIMIT $4;`.trim();

    try {
      const params = [data_de, data_ate, plataforma ?? null, limit];
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return { success: true, message: `Desempenho de ${rows.length} grupo(s)`, count: rows.length, rows, sql_query: sql, sql_params: formatSqlParams(params) };
    } catch (error) {
      return { success: false, message: `Erro ao analisar grupos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, rows: [], sql_query: sql, sql_params: formatSqlParams([data_de, data_ate, plataforma ?? null, limit]) };
    }
  }
});

// Desempenho por Dia da Semana
export const desempenhoPorDiaDaSemana = tool({
  description: 'Desempenho agregado por dia da semana (plataforma) com métricas derivadas',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar uma plataforma específica'),
  }),
  execute: async ({ data_de, data_ate, plataforma }) => {
    const sql = `
SELECT 
  ca.plataforma,
  TRIM(TO_CHAR(m.data, 'Day')) AS dia_semana,
  ROUND(SUM(m.gasto), 2) AS total_gasto,
  ROUND(SUM(m.receita), 2) AS total_receita,
  SUM(m.conversao) AS total_conversoes,
  ROUND(SUM(m.receita) / NULLIF(SUM(m.gasto), 0), 2) AS roas,
  ROUND(SUM(m.gasto)::numeric / NULLIF(SUM(m.conversao), 0), 2) AS cpa,
  ROUND(SUM(m.conversao)::numeric / NULLIF(SUM(m.cliques), 0) * 100, 2) AS taxa_conversao
FROM trafego_pago.metricas_anuncios m
JOIN trafego_pago.anuncios_publicados ap ON m.anuncio_publicado_id = ap.id
JOIN trafego_pago.contas_ads ca ON ap.conta_ads_id = ca.id
WHERE m.data BETWEEN $1::date AND $2::date
  AND ($3::text IS NULL OR ca.plataforma = $3)
GROUP BY ca.plataforma, dia_semana
ORDER BY ca.plataforma, 
         CASE TRIM(TO_CHAR(m.data, 'Day'))
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
         END;`.trim();

    try {
      const params = [data_de, data_ate, plataforma ?? null];
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return { success: true, message: `Desempenho por dia da semana (${rows.length} linhas)`, count: rows.length, rows, sql_query: sql, sql_params: formatSqlParams(params) };
    } catch (error) {
      return { success: false, message: `Erro ao analisar por dia da semana: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, rows: [], sql_query: sql, sql_params: formatSqlParams([data_de, data_ate, plataforma ?? null]) };
    }
  }
});

// Detecção de Anomalias de ROAS (por dia)
export const deteccaoAnomaliasROAS = tool({
  description: 'Detecta anomalias de ROAS por dia usando z-score',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar uma plataforma específica'),
    zscore_limite: z.number().default(2.0),
  }),
  execute: async ({ data_de, data_ate, plataforma, zscore_limite = 2.0 }) => {
    const sql = `
WITH daily AS (
  SELECT m.data::date AS dia,
         SUM(m.gasto) AS gasto,
         SUM(m.receita) AS receita,
         CASE WHEN SUM(m.gasto) > 0 THEN SUM(m.receita) / SUM(m.gasto) ELSE 0 END AS roas
  FROM trafego_pago.metricas_anuncios m
  JOIN trafego_pago.anuncios_publicados ap ON m.anuncio_publicado_id = ap.id
  JOIN trafego_pago.contas_ads ca ON ap.conta_ads_id = ca.id
  WHERE m.data BETWEEN $1::date AND $2::date
    AND ($3::text IS NULL OR ca.plataforma = $3)
  GROUP BY 1
), stats AS (
  SELECT AVG(roas) AS media, STDDEV_SAMP(roas) AS desvio FROM daily
)
SELECT d.dia,
       d.roas,
       s.media,
       s.desvio,
       CASE WHEN s.desvio > 0 THEN (d.roas - s.media) / s.desvio ELSE 0 END AS zscore,
       CASE WHEN s.desvio > 0 AND ABS((d.roas - s.media) / s.desvio) > $4 THEN TRUE ELSE FALSE END AS anomalia
FROM daily d CROSS JOIN stats s
ORDER BY d.dia;`.trim();

    try {
      const params = [data_de, data_ate, plataforma ?? null, zscore_limite];
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return { success: true, message: `Análise de ${rows.length} dia(s)`, count: rows.length, rows, sql_query: sql, sql_params: formatSqlParams(params) };
    } catch (error) {
      return { success: false, message: `Erro ao detectar anomalias ROAS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, rows: [], sql_query: sql, sql_params: formatSqlParams([data_de, data_ate, plataforma ?? null, zscore_limite]) };
    }
  }
});

// Detecção de Anomalias na Taxa de Conversão (por dia)
export const deteccaoAnomaliasTaxaConversao = tool({
  description: 'Detecta anomalias de taxa de conversão por dia usando z-score',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (YYYY-MM-DD)'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar uma plataforma específica'),
    zscore_limite: z.number().default(2.0),
  }),
  execute: async ({ data_de, data_ate, plataforma, zscore_limite = 2.0 }) => {
    const sql = `
WITH daily AS (
  SELECT m.data::date AS dia,
         SUM(m.cliques) AS cliques,
         SUM(m.conversao) AS conversoes,
         CASE WHEN SUM(m.cliques) > 0 THEN (SUM(m.conversao)::numeric / SUM(m.cliques)) * 100 ELSE 0 END AS taxa_conversao
  FROM trafego_pago.metricas_anuncios m
  JOIN trafego_pago.anuncios_publicados ap ON m.anuncio_publicado_id = ap.id
  JOIN trafego_pago.contas_ads ca ON ap.conta_ads_id = ca.id
  WHERE m.data BETWEEN $1::date AND $2::date
    AND ($3::text IS NULL OR ca.plataforma = $3)
  GROUP BY 1
), stats AS (
  SELECT AVG(taxa_conversao) AS media, STDDEV_SAMP(taxa_conversao) AS desvio FROM daily
)
SELECT d.dia,
       d.taxa_conversao,
       s.media,
       s.desvio,
       CASE WHEN s.desvio > 0 THEN (d.taxa_conversao - s.media) / s.desvio ELSE 0 END AS zscore,
       CASE WHEN s.desvio > 0 AND ABS((d.taxa_conversao - s.media) / s.desvio) > $4 THEN TRUE ELSE FALSE END AS anomalia
FROM daily d CROSS JOIN stats s
ORDER BY d.dia;`.trim();

    try {
      const params = [data_de, data_ate, plataforma ?? null, zscore_limite];
      const rows = await runQuery<Record<string, unknown>>(sql, params);
      return { success: true, message: `Análise de ${rows.length} dia(s)`, count: rows.length, rows, sql_query: sql, sql_params: formatSqlParams(params) };
    } catch (error) {
      return { success: false, message: `Erro ao detectar anomalias Tx Conversão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, rows: [], sql_query: sql, sql_params: formatSqlParams([data_de, data_ate, plataforma ?? null, zscore_limite]) };
    }
  }
});
