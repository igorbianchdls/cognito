import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const LOGISTICS_TABLES = [
  'envios',
  'eventos_rastreio',
  'logistica_reversa',
  'pacotes',
  'transportadoras',
] as const;

type LogisticsTable = (typeof LOGISTICS_TABLES)[number];

const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 500;

const TABLE_DATE_COLUMNS: Partial<Record<LogisticsTable, { from: string; to?: string }>> = {
  envios: { from: 'data_postagem', to: 'data_postagem' },
  eventos_rastreio: { from: 'data_evento', to: 'data_evento' },
  logistica_reversa: { from: 'data_solicitacao', to: 'data_solicitacao' },
  pacotes: { from: 'created_at', to: 'created_at' },
  transportadoras: { from: 'created_at', to: 'created_at' },
};

const TABLE_ORDER_COLUMNS: Record<LogisticsTable, string> = {
  envios: 'data_postagem',
  eventos_rastreio: 'data_evento',
  logistica_reversa: 'data_solicitacao',
  pacotes: 'created_at',
  transportadoras: 'nome',
};

const normalizeLimit = (limit?: number) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(limit), MIN_LIMIT), MAX_LIMIT);
};

const formatSqlParams = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]');

const buildLogisticsDataQuery = (args: {
  table: LogisticsTable;
  limit: number;
  status_atual?: string;
  transportadora_id?: string;
  codigo_rastreio?: string;
  order_id?: string;
  ativo?: boolean;
  data_de?: string;
  data_ate?: string;
}) => {
  const {
    table,
    limit,
    status_atual,
    transportadora_id,
    codigo_rastreio,
    order_id,
    ativo,
    data_de,
    data_ate,
  } = args;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let index = 1;

  const push = (clause: string, value: unknown) => {
    conditions.push(`${clause} $${index}`);
    params.push(value);
    index += 1;
  };

  if (status_atual) {
    if (table === 'envios') {
      push('status_atual =', status_atual);
    } else if (table === 'logistica_reversa') {
      // Na reversa a coluna é 'status'
      push('status =', status_atual);
    }
  }

  if (transportadora_id && (table === 'envios' || table === 'pacotes' || table === 'logistica_reversa')) {
    push('transportadora_id =', transportadora_id);
  }

  if (codigo_rastreio) {
    if (table === 'envios') {
      push('codigo_rastreio =', codigo_rastreio);
    } else if (table === 'eventos_rastreio') {
      // eventos_rastreio não possui 'codigo_rastreio'; filtra via envio_id
      conditions.push(`envio_id IN (SELECT id FROM gestaologistica.envios WHERE codigo_rastreio = $${index})`);
      params.push(codigo_rastreio);
      index += 1;
    }
  }

  if (order_id && table === 'envios') {
    push('order_id =', order_id);
  }

  if (typeof ativo === 'boolean' && table === 'transportadoras') {
    push('ativo =', ativo);
  }

  const dateColumns = TABLE_DATE_COLUMNS[table];
  if (data_de && dateColumns?.from) {
    push(`${dateColumns.from} >=`, data_de);
  }

  if (data_ate) {
    const column = dateColumns?.to ?? dateColumns?.from;
    if (column) {
      push(`${column} <=`, data_ate);
    }
  }

  const limitIndex = index;
  params.push(limit);

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = TABLE_ORDER_COLUMNS[table] ?? 'created_at';

  const sql = `
    SELECT *
    FROM gestaologistica.${table}
    ${whereClause}
    ORDER BY ${orderBy} DESC
    LIMIT $${limitIndex}
  `.trim();

  return { sql, params };
};

const buildTransportadoraFilterClause = (transportadoraId?: string) =>
  transportadoraId ? 'AND transportadora_id = $2' : '';

const buildTransportadoraParam = (transportadoraId?: string) =>
  transportadoraId ? [transportadoraId] : [null];

const computeClassification = (value: number, thresholds: { excellent: number; good: number; warning: number }) => {
  if (value >= thresholds.excellent) return 'Excelente';
  if (value >= thresholds.good) return 'Bom';
  if (value >= thresholds.warning) return 'Atenção';
  return 'Crítico';
};

export const getLogisticsData = tool({
  description: 'Busca dados de gestão logística (envios, rastreamento, logística reversa, pacotes, transportadoras)',
  inputSchema: z.object({
    table: z.enum(LOGISTICS_TABLES).describe('Tabela a consultar'),
    limit: z.number().default(DEFAULT_LIMIT).describe('Número máximo de resultados'),
    status_atual: z.string().optional()
      .describe('Filtrar por status atual (para envios, logistica_reversa)'),
    transportadora_id: z.string().optional()
      .describe('Filtrar por ID da transportadora (para envios, pacotes)'),
    codigo_rastreio: z.string().optional()
      .describe('Filtrar por código de rastreio (para envios, eventos_rastreio)'),
    order_id: z.string().optional()
      .describe('Filtrar por ID do pedido (para envios, logistica_reversa)'),
    ativo: z.boolean().optional()
      .describe('Filtrar por status ativo (para transportadoras)'),
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),
  execute: async (input) => {
    try {
      const limit = normalizeLimit(input.limit);
      const { sql, params } = buildLogisticsDataQuery({ ...input, limit });
      const rows = await runQuery<Record<string, unknown>>(sql, params);

      return {
        success: true,
        count: rows.length,
        table: input.table,
        message: `✅ ${rows.length} registros encontrados em ${input.table}`,
        rows,
        data: rows,
        sql_query: sql,
        sql_params: formatSqlParams(params),
      };
    } catch (error) {
      console.error('ERRO getLogisticsData:', error);
      return {
        success: false,
        message: `❌ Erro ao buscar dados de ${input.table}`,
        table: input.table,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        rows: [],
        data: [],
      };
    }
  },
});

export const calculateDeliveryPerformance = tool({
  description: 'Calcula métricas de performance de entregas: SLA, tempo médio, lead time e sucesso na primeira tentativa',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    transportadora_id: z.string().optional().describe('Filtrar por transportadora específica'),
  }),
  execute: async ({ date_range_days = 30, transportadora_id }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const summarySql = `
      WITH filtered_envios AS (
        SELECT
          id,
          transportadora_id,
          data_postagem,
          data_estimada_entrega,
          data_entrega_real,
          created_at,
          custo_frete,
        FROM gestaologistica.envios
        WHERE data_postagem >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
          ${transportadora_id ? 'AND transportadora_id = $2' : ''}
      )
      SELECT
        COUNT(*) AS total_envios,
        COUNT(*) FILTER (WHERE data_entrega_real IS NOT NULL) AS entregues,
        COUNT(*) FILTER (WHERE data_entrega_real IS NOT NULL AND data_entrega_real <= data_estimada_entrega) AS entregues_no_prazo,
        AVG(EXTRACT(EPOCH FROM (data_entrega_real - data_postagem)) / 86400.0) FILTER (WHERE data_entrega_real IS NOT NULL) AS avg_delivery_days,
        MIN(EXTRACT(EPOCH FROM (data_entrega_real - data_postagem)) / 86400.0) FILTER (WHERE data_entrega_real IS NOT NULL) AS min_delivery_days,
        MAX(EXTRACT(EPOCH FROM (data_entrega_real - data_postagem)) / 86400.0) FILTER (WHERE data_entrega_real IS NOT NULL) AS max_delivery_days,
        AVG(EXTRACT(EPOCH FROM (data_postagem - created_at)) / 3600.0) AS avg_lead_hours,
        SUM(custo_frete) AS custo_total
      FROM filtered_envios
    `;

    const attemptSql = `
      WITH filtered_envios AS (
        SELECT
          id,
          data_entrega_real,
          data_estimada_entrega
        FROM gestaologistica.envios
        WHERE data_postagem >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
          ${transportadora_id ? 'AND transportadora_id = $2' : ''}
      )
      SELECT
        COUNT(*) FILTER (WHERE data_entrega_real IS NOT NULL) AS entregues,
        COUNT(*) FILTER (
          WHERE data_entrega_real IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM gestaologistica.eventos_rastreio er
              WHERE er.envio_id = fe.id
                AND (er.mensagem ILIKE '%tentativa%' OR er.status ILIKE '%tentativa%')
            )
        ) AS entregas_com_tentativa
      FROM filtered_envios fe
    `;

    const params = transportadora_id ? [range, transportadora_id] : [range];

    try {
      const summary = (await runQuery<{
        total_envios: string | number | null;
        entregues: string | number | null;
        entregues_no_prazo: string | number | null;
        avg_delivery_days: string | number | null;
        min_delivery_days: string | number | null;
        max_delivery_days: string | number | null;
        avg_lead_hours: string | number | null;
        custo_total: string | number | null;
      }>(summarySql, params))[0] ?? {
        total_envios: 0,
        entregues: 0,
        entregues_no_prazo: 0,
        avg_delivery_days: null,
        min_delivery_days: null,
        max_delivery_days: null,
        avg_lead_hours: null,
        custo_total: 0,
      };

      const attempts = (await runQuery<{
        entregues: string | number | null;
        entregas_com_tentativa: string | number | null;
      }>(attemptSql, params))[0] ?? {
        entregues: 0,
        entregas_com_tentativa: 0,
      };

      const totalEnvios = Number(summary.total_envios ?? 0);
      const delivered = Number(summary.entregues ?? 0);
      const onTime = Number(summary.entregues_no_prazo ?? 0);
      const avgDeliveryDays = Number(summary.avg_delivery_days ?? 0);
      const minDeliveryDays = Number(summary.min_delivery_days ?? 0);
      const maxDeliveryDays = Number(summary.max_delivery_days ?? 0);
      const avgLeadHours = Number(summary.avg_lead_hours ?? 0);
      const costoTotal = Number(summary.custo_total ?? 0);
      const totalPeso = 0; // não disponível diretamente aqui
      const entreguesTentativa = Number(attempts.entregas_com_tentativa ?? 0);

      const onTimeRate = delivered > 0 ? (onTime / delivered) * 100 : 0;
      const firstAttemptRate = delivered > 0
        ? ((delivered - entreguesTentativa) / delivered) * 100
        : 0;
      const leadClassification = avgLeadHours <= 24
        ? 'Excelente (same-day)'
        : avgLeadHours <= 48
          ? 'Bom (até 48h)'
          : avgLeadHours <= 72
            ? 'Atenção'
            : 'Crítico';

      const performanceScore = Number(
        (
          (onTimeRate * 0.5) +
          (firstAttemptRate * 0.3) +
          (Math.min(100, Math.max(0, (100 - Math.max(0, avgDeliveryDays - 2) * 10))) * 0.2)
        ).toFixed(2),
      );

      const rows = [
        {
          metric: 'On-time delivery rate',
          value: `${onTimeRate.toFixed(2)}%`,
          benchmark: 'Meta: ≥ 95%',
          classification: computeClassification(onTimeRate, { excellent: 95, good: 90, warning: 85 }),
          detail: `${onTime} entregas no prazo em ${delivered} concluídas`,
        },
        {
          metric: 'Average delivery time',
          value: `${avgDeliveryDays.toFixed(1)} dias`,
          benchmark: 'Meta: ≤ SLA contratado',
          classification: avgDeliveryDays <= 3 ? 'Rápido' : avgDeliveryDays <= 7 ? 'Normal' : 'Lento',
          detail: `Mín ${minDeliveryDays.toFixed(1)} • Máx ${maxDeliveryDays.toFixed(1)} dias`,
        },
        {
          metric: 'First attempt success',
          value: `${firstAttemptRate.toFixed(2)}%`,
          benchmark: 'Meta: ≥ 85%',
          classification: computeClassification(firstAttemptRate, { excellent: 90, good: 85, warning: 75 }),
          detail: `${delivered - entreguesTentativa} entregas sem tentativa adicional`,
        },
        {
          metric: 'Average lead time',
          value: `${avgLeadHours.toFixed(1)} h`,
          benchmark: 'Meta: < 24h',
          classification: leadClassification,
          detail: 'Tempo entre criação do pedido e postagem',
        },
        {
          metric: 'Total shipping cost',
          value: `R$ ${costoTotal.toFixed(2)}`,
          benchmark: totalEnvios > 0
            ? `Ticket médio: R$ ${(costoTotal / totalEnvios).toFixed(2)}`
            : 'Ticket médio: R$ 0,00',
          classification: 'Informativo',
          detail: totalPeso > 0
            ? `Custo por kg: R$ ${(costoTotal / totalPeso).toFixed(2)}`
            : 'Sem dados de peso',
        },
        {
          metric: 'Performance score',
          value: `${performanceScore.toFixed(1)}`,
          benchmark: 'Meta: ≥ 90',
          classification: computeClassification(performanceScore, { excellent: 90, good: 80, warning: 70 }),
          detail: 'Score ponderado (On-time 50% + 1ª tentativa 30% + qualidade 20%)',
        },
      ];

      const combinedSql = `${summarySql}\n\n-- Auxiliar: tentativas\n${attemptSql}`;

      return {
        success: true,
        message: `Performance logística avaliada nos últimos ${range} dias`,
        periodo_dias: range,
        transportadora_id: transportadora_id ?? 'TODAS',
        totals: {
          total_envios: totalEnvios,
          entregues: delivered,
          on_time: onTime,
        },
        rows,
        sql_query: combinedSql,
        sql_params: formatSqlParams(params),
        sql_queries: [
          { name: 'resumo_envios', sql: summarySql, params },
          { name: 'tentativas_entrega', sql: attemptSql, params },
        ],
      };
    } catch (error) {
      console.error('ERRO calculateDeliveryPerformance:', error);
      return {
        success: false,
        message: `Erro ao calcular performance de entregas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analyzeCarrierBenchmark = tool({
  description: 'Compara performance e custos entre transportadoras, gera ranking e recomendações',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const sql = `
      WITH filtered_envios AS (
        SELECT
          e.id,
          e.transportadora_id,
          e.data_postagem,
          e.data_estimada_entrega,
          e.data_entrega_real,
          e.custo_frete,
        FROM gestaologistica.envios e
        WHERE e.data_postagem >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      ),
      agg AS (
        SELECT
          fe.transportadora_id,
          COUNT(*) AS total_envios,
          COUNT(*) FILTER (WHERE fe.data_entrega_real IS NOT NULL) AS entregues,
          COUNT(*) FILTER (
            WHERE fe.data_entrega_real IS NOT NULL
              AND fe.data_entrega_real <= fe.data_estimada_entrega
          ) AS entregues_no_prazo,
          AVG(EXTRACT(EPOCH FROM (fe.data_entrega_real - fe.data_postagem)) / 86400.0) FILTER (WHERE fe.data_entrega_real IS NOT NULL) AS avg_delivery_days,
          SUM(fe.custo_frete) AS custo_total,
          SUM(
            CASE
              WHEN fe.data_entrega_real IS NOT NULL
                AND EXISTS (
                  SELECT 1
                  FROM gestaologistica.eventos_rastreio er
                  WHERE er.envio_id = fe.id
                    AND (er.mensagem ILIKE '%tentativa%' OR er.status ILIKE '%tentativa%')
                )
              THEN 1 ELSE 0
            END
          ) AS entregas_com_tentativa
        FROM filtered_envios fe
        GROUP BY fe.transportadora_id
      )
      SELECT
        COALESCE(t.nome, agg.transportadora_id) AS transportadora,
        agg.total_envios,
        agg.entregues,
        agg.entregues_no_prazo,
        agg.avg_delivery_days,
        agg.custo_total,
        agg.entregas_com_tentativa
      FROM agg
      LEFT JOIN gestaologistica.transportadoras t
        ON t.id = agg.transportadora_id
      WHERE agg.total_envios > 0
      ORDER BY agg.total_envios DESC
    `;

    try {
      const rowsRaw = await runQuery<{
        transportadora: string | null;
        total_envios: string | number | null;
        entregues: string | number | null;
        entregues_no_prazo: string | number | null;
        avg_delivery_days: string | number | null;
        custo_total: string | number | null;
        peso_total: string | number | null;
        entregas_com_tentativa: string | number | null;
      }>(sql, [range]);

      const rows = rowsRaw.map((row) => {
        const totalEnvios = Number(row.total_envios ?? 0);
        const entregues = Number(row.entregues ?? 0);
        const onTime = Number(row.entregues_no_prazo ?? 0);
        const custoTotal = Number(row.custo_total ?? 0);
        const pesoTotal = Number(row.peso_total ?? 0);
        const tentativas = Number(row.entregas_com_tentativa ?? 0);
        const avgDelivery = Number(row.avg_delivery_days ?? 0);

        const onTimeRate = entregues > 0 ? (onTime / entregues) * 100 : 0;
        const firstAttemptRate = entregues > 0 ? ((entregues - tentativas) / entregues) * 100 : 0;
        const custoMedioEnvio = totalEnvios > 0 ? custoTotal / totalEnvios : 0;
        const custoPorKg = pesoTotal > 0 ? custoTotal / pesoTotal : 0;
        const performanceScore = Number(
          (
            (onTimeRate * 0.5) +
            (firstAttemptRate * 0.3) +
            (Math.max(0, 100 - Math.max(0, avgDelivery - 2) * 10) * 0.2)
          ).toFixed(2),
        );

        return {
          transportadora: row.transportadora ?? 'N/D',
          total_envios: totalEnvios,
          entregues,
          on_time_rate: Number(onTimeRate.toFixed(2)),
          first_attempt_rate: Number(firstAttemptRate.toFixed(2)),
          avg_delivery_days: Number(avgDelivery.toFixed(2)),
          custo_total: Number(custoTotal.toFixed(2)),
          custo_medio_envio: Number(custoMedioEnvio.toFixed(2)),
          custo_por_kg: Number(custoPorKg.toFixed(2)),
          performance_score: performanceScore,
          classificacao: computeClassification(performanceScore, { excellent: 90, good: 80, warning: 70 }),
        };
      }).sort((a, b) => b.performance_score - a.performance_score);

      return {
        success: true,
        message: `Benchmark de transportadoras (${rows.length} avaliadas)`,
        periodo_dias: range,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO analyzeCarrierBenchmark:', error);
      return {
        success: false,
        message: `Erro ao comparar transportadoras: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analyzeShippingCostStructure = tool({
  description: 'Análise da estrutura de custos de frete por faixa de peso e ticket médio',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const sql = `
      WITH pac AS (
        SELECT
          peso_kg,
          created_at
        FROM gestaologistica.pacotes
        WHERE created_at >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
          AND peso_kg IS NOT NULL
      )
      SELECT
        CASE
          WHEN peso_kg < 1 THEN '0 - 1 kg'
          WHEN peso_kg < 5 THEN '1 - 5 kg'
          WHEN peso_kg < 10 THEN '5 - 10 kg'
          WHEN peso_kg < 20 THEN '10 - 20 kg'
          ELSE '20+ kg'
        END AS faixa_peso,
        COUNT(*) AS total_pacotes,
        AVG(peso_kg) AS peso_medio
      FROM pac
      GROUP BY faixa_peso
      ORDER BY MIN(peso_kg)
    `;

    try {
      const rows = await runQuery<{
        faixa_peso: string;
        total_envios: string | number;
        custo_total: string | number;
        custo_medio_envio: string | number;
        peso_total: string | number;
        custo_medio_por_kg: string | number;
      }>(sql, [range]);

      const formatted = rows.map(row => ({
        faixa_peso: row.faixa_peso,
        total_envios: Number(row.total_envios ?? 0),
        custo_total: Number(row.custo_total ?? 0).toFixed(2),
        custo_medio_envio: Number(row.custo_medio_envio ?? 0).toFixed(2),
        peso_total: Number(row.peso_total ?? 0).toFixed(2),
        custo_medio_por_kg: Number(row.custo_medio_por_kg ?? 0).toFixed(2),
      }));

      return {
        success: true,
        message: 'Estrutura de custo por faixa de peso',
        periodo_dias: range,
        rows: formatted,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO analyzeShippingCostStructure:', error);
      return {
        success: false,
        message: `Erro ao analisar custo de frete: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analyzeReverseLogisticsTrends = tool({
  description: 'Mapeia tendências de logística reversa por data e motivo',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 1), 365);

    const sqlTimeline = `
      WITH filtered AS (
        SELECT
          data_solicitacao::date AS dia,
          status,
          motivo
        FROM gestaologistica.logistica_reversa
        WHERE data_solicitacao >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      )
      SELECT
        dia,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status ILIKE 'conclu%') AS concluidas,
        COUNT(*) FILTER (WHERE status ILIKE 'pend%') AS pendentes
      FROM filtered
      GROUP BY dia
      ORDER BY dia DESC
    `;

    const sqlMotivos = `
      WITH filtered AS (
        SELECT
          motivo
        FROM gestaologistica.logistica_reversa
        WHERE data_solicitacao >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      )
      SELECT
        COALESCE(NULLIF(motivo, ''), 'Não informado') AS motivo,
        COUNT(*) AS total
      FROM filtered
      GROUP BY motivo
      ORDER BY total DESC
      LIMIT 10
    `;

    try {
      const timeline = await runQuery<{
        dia: string;
        total: string | number;
        concluidas: string | number;
        pendentes: string | number;
      }>(sqlTimeline, [range]);

      const reasons = await runQuery<{
        motivo: string;
        total: string | number;
      }>(sqlMotivos, [range]);

      const rows = [
        ...timeline.map(row => {
          const total = Number(row.total ?? 0);
          const concluidas = Number(row.concluidas ?? 0);
          const pendentes = Number(row.pendentes ?? 0);
          return {
            categoria: 'Timeline',
            chave: row.dia,
            total,
            concluidas,
            pendentes,
            taxa_conclusao: total > 0 ? `${((concluidas / total) * 100).toFixed(2)}%` : '0%',
          };
        }),
        ...reasons.map((row, index) => ({
          categoria: 'Motivo',
          chave: `${index + 1}º ${row.motivo}`,
          total: Number(row.total ?? 0),
          concluidas: null,
          pendentes: null,
          taxa_conclusao: null,
        })),
      ];

      const combinedSql = `${sqlTimeline}\n\n-- Top motivos\n${sqlMotivos}`;

      return {
        success: true,
        message: 'Logística reversa: timeline e principais motivos',
        periodo_dias: range,
        rows,
        sql_query: combinedSql,
        sql_params: formatSqlParams([range]),
        sql_queries: [
          { name: 'timeline', sql: sqlTimeline, params: [range] },
          { name: 'motivos', sql: sqlMotivos, params: [range] },
        ],
      };
    } catch (error) {
      console.error('ERRO analyzeReverseLogisticsTrends:', error);
      return {
        success: false,
        message: `Erro ao analisar logística reversa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const optimizePackageDimensions = tool({
  description: 'Avalia eficiência de cubagem e sugere otimizações de embalagem',
  inputSchema: z.object({
    include_examples: z.boolean().default(false).describe('Retornar exemplos de pacotes com baixa eficiência'),
  }),
  execute: async ({ include_examples = false }) => {
    const summarySql = `
      SELECT
        COALESCE(t.nome, p.transportadora_id) AS transportadora,
        COUNT(*) AS total_pacotes,
        AVG(p.peso_kg) AS peso_medio,
        AVG((p.altura_cm * COALESCE(p.largura_cm, p.lar_cm) * p.comprimento_cm) / 6000.0) AS peso_volumetrico_medio,
        AVG(p.peso_kg / NULLIF((p.altura_cm * COALESCE(p.largura_cm, p.lar_cm) * p.comprimento_cm) / 6000.0, 0)) AS eficiencia_media,
        PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY p.peso_kg / NULLIF((p.altura_cm * COALESCE(p.largura_cm, p.lar_cm) * p.comprimento_cm) / 6000.0, 0)) AS eficiencia_p10,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY p.peso_kg / NULLIF((p.altura_cm * COALESCE(p.largura_cm, p.lar_cm) * p.comprimento_cm) / 6000.0, 0)) AS eficiencia_p90
      FROM gestaologistica.pacotes p
      LEFT JOIN gestaologistica.transportadoras t ON t.id = p.transportadora_id
      WHERE p.peso_kg IS NOT NULL
        AND p.altura_cm IS NOT NULL
        AND (p.largura_cm IS NOT NULL OR p.lar_cm IS NOT NULL)
        AND p.comprimento_cm IS NOT NULL
      GROUP BY transportadora
      ORDER BY eficiencia_media ASC
    `;

    const examplesSql = `
      SELECT
        transportadora_id,
        peso_kg,
        altura_cm,
        COALESCE(largura_cm, lar_cm) AS largura_cm,
        comprimento_cm,
        (peso_kg / NULLIF((altura_cm * COALESCE(largura_cm, lar_cm) * comprimento_cm) / 6000.0, 0)) AS eficiencia
      FROM gestaologistica.pacotes
      WHERE peso_kg IS NOT NULL
        AND altura_cm IS NOT NULL
        AND (largura_cm IS NOT NULL OR lar_cm IS NOT NULL)
        AND comprimento_cm IS NOT NULL
      ORDER BY eficiencia ASC
      LIMIT 5
    `;

    try {
      const summaryRows = await runQuery<{
        transportadora: string;
        total_pacotes: string | number;
        peso_medio: string | number;
        peso_volumetrico_medio: string | number;
        eficiencia_media: string | number;
        eficiencia_p10: string | number;
        eficiencia_p90: string | number;
      }>(summarySql);

      const formatted = summaryRows.map(row => ({
        transportadora: row.transportadora ?? 'N/D',
        total_pacotes: Number(row.total_pacotes ?? 0),
        peso_medio: Number(row.peso_medio ?? 0).toFixed(2),
        peso_volumetrico_medio: Number(row.peso_volumetrico_medio ?? 0).toFixed(2),
        eficiencia_media: Number(row.eficiencia_media ?? 0).toFixed(2),
        eficiencia_p10: Number(row.eficiencia_p10 ?? 0).toFixed(2),
        eficiencia_p90: Number(row.eficiencia_p90 ?? 0).toFixed(2),
        classificacao: Number(row.eficiencia_media ?? 0) >= 0.8 ? 'Boa' : Number(row.eficiencia_media ?? 0) >= 0.6 ? 'Atenção' : 'Crítica',
      }));

      let exemplos: Array<Record<string, unknown>> | undefined;
      if (include_examples) {
        const exampleRows = await runQuery<{
          transportadora_id: string | null;
          peso_kg: string | number;
          altura_cm: string | number;
          largura_cm: string | number;
          comprimento_cm: string | number;
          eficiencia: string | number | null;
        }>(examplesSql);

        exemplos = exampleRows.map(row => ({
          transportadora_id: row.transportadora_id ?? 'N/D',
          peso_kg: Number(row.peso_kg ?? 0).toFixed(2),
          dimensoes_cm: `${Number(row.altura_cm ?? 0).toFixed(1)} x ${Number(row.largura_cm ?? 0).toFixed(1)} x ${Number(row.comprimento_cm ?? 0).toFixed(1)}`,
          eficiencia: row.eficiencia !== null ? Number(row.eficiencia).toFixed(2) : '0.00',
        }));
      }

      const combinedSql = include_examples ? `${summarySql}\n\n-- Exemplos\n${examplesSql}` : summarySql;

      return {
        success: true,
        message: 'Eficiência de cubagem por transportadora',
        rows: formatted,
        low_efficiency_examples: exemplos,
        sql_query: combinedSql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO optimizePackageDimensions:', error);
      return {
        success: false,
        message: `Erro ao analisar pacotes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const detectDeliveryAnomalies = tool({
  description: 'Detecta anomalias em atraso de entregas usando z-score diário',
  inputSchema: z.object({
    date_range_days: z.number().default(60).describe('Período de análise em dias'),
    sensitivity: z.number().default(2).describe('Sensibilidade do Z-score (padrão: 2)'),
  }),
  execute: async ({ date_range_days = 60, sensitivity = 2 }) => {
    const range = Math.min(Math.max(Math.trunc(date_range_days), 7), 365);

    const sql = `
      WITH filtered_envios AS (
        SELECT
          data_postagem::date AS dia,
          data_entrega_real,
          data_estimada_entrega
        FROM gestaologistica.envios
        WHERE data_postagem >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      )
      SELECT
        dia,
        COUNT(*) AS total_envios,
        COUNT(*) FILTER (WHERE data_entrega_real IS NOT NULL) AS entregues,
        COUNT(*) FILTER (
          WHERE data_entrega_real IS NOT NULL
            AND data_entrega_real > data_estimada_entrega
        ) AS atrasados
      FROM filtered_envios
      GROUP BY dia
      ORDER BY dia
    `;

    try {
      const rows = await runQuery<{
        dia: string;
        total_envios: string | number | null;
        entregues: string | number | null;
        atrasados: string | number | null;
      }>(sql, [range]);

      if (!rows.length) {
        return {
          success: false,
          message: 'Nenhum envio encontrado para análise de anomalias',
          sql_query: sql,
          sql_params: formatSqlParams([range]),
        };
      }

      const ratios = rows.map(row => {
        const total = Number(row.entregues ?? 0);
        const atrasos = Number(row.atrasados ?? 0);
        return total > 0 ? atrasos / total : 0;
      });

      const mean = ratios.reduce((acc, v) => acc + v, 0) / ratios.length;
      const variance = ratios.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / ratios.length;
      const stdDev = Math.sqrt(variance);

      const anomalies = rows.map((row, index) => {
        const entregues = Number(row.entregues ?? 0);
        const atrasados = Number(row.atrasados ?? 0);
        const ratio = entregues > 0 ? atrasados / entregues : 0;
        const zScore = stdDev > 0 ? (ratio - mean) / stdDev : 0;

        return {
          data: row.dia,
          entregues,
          atrasados,
          atraso_percentual: `${(ratio * 100).toFixed(2)}%`,
          z_score: Number(zScore.toFixed(2)),
          severidade: Math.abs(zScore) > sensitivity * 1.5 ? 'Crítica' : Math.abs(zScore) > sensitivity ? 'Alta' : 'Normal',
        };
      });

      const flagged = anomalies.filter(row => Math.abs(row.z_score) > sensitivity);

      return {
        success: true,
        message: `${flagged.length} dias com anomalias de atraso detectados`,
        periodo_dias: range,
        sensitivity,
        rows: anomalies,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO detectDeliveryAnomalies:', error);
      return {
        success: false,
        message: `Erro ao detectar anomalias de entrega: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

const simpleLinearRegression = (points: Array<{ x: number; y: number }>) => {
  const n = points.length;
  if (n === 0) {
    return { slope: 0, intercept: 0 };
  }
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0);

  const denominator = (n * sumX2) - (sumX * sumX);
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  const intercept = (sumY - (slope * sumX)) / n;
  return { slope, intercept };
};

export const forecastDeliveryCosts = tool({
  description: 'Projeção de custos de frete baseada em tendência linear dos últimos 60 dias',
  inputSchema: z.object({
    date_range_days: z.number().default(60).describe('Histórico em dias para calcular a tendência'),
    forecast_days: z.number().default(7).describe('Quantidade de dias a prever'),
  }),
  execute: async ({ date_range_days = 60, forecast_days = 7 }) => {
    const history = Math.min(Math.max(Math.trunc(date_range_days), 14), 365);
    const forecastHorizon = Math.min(Math.max(Math.trunc(forecast_days), 1), 30);

    const sql = `
      SELECT
        data_postagem::date AS dia,
        SUM(custo_frete) AS custo_total,
        SUM(peso_kg) AS peso_total,
        COUNT(*) AS envios
      FROM gestaologistica.envios
      WHERE data_postagem >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      GROUP BY dia
      ORDER BY dia
    `;

    try {
      const historical = await runQuery<{
        dia: string;
        custo_total: string | number;
        peso_total: string | number;
        envios: string | number;
      }>(sql, [history]);

      if (historical.length < 2) {
        return {
          success: false,
          message: 'Histórico insuficiente para previsão de custos',
          sql_query: sql,
          sql_params: formatSqlParams([history]),
        };
      }

      const points = historical.map((row, index) => ({
        x: index + 1,
        y: Number(row.custo_total ?? 0),
        dia: row.dia,
        envios: Number(row.envios ?? 0),
        peso_total: Number(row.peso_total ?? 0),
      }));

      const regression = simpleLinearRegression(points.map(({ x, y }) => ({ x, y })));

      const forecastRows = Array.from({ length: forecastHorizon }, (_, idx) => {
        const x = points.length + idx + 1;
        const projectedCost = Math.max(0, regression.intercept + regression.slope * x);
        return {
          periodo: `D+${idx + 1}`,
          custo_previsto: Number(projectedCost.toFixed(2)),
        };
      });

      const lastPoint = points[points.length - 1];

      const rows = [
        {
          categoria: 'Histórico',
          periodo: `${points.length} dias`,
          custo_previsto: points.reduce((acc, point) => acc + point.y, 0) / points.length,
          detalhe: 'Custo médio diário',
        },
        ...forecastRows.map(row => ({
          categoria: 'Forecast',
          periodo: row.periodo,
          custo_previsto: row.custo_previsto,
          detalhe: `Projeção linear (inclinação ${regression.slope.toFixed(2)})`,
        })),
      ];

      const summary = {
        custo_medio_diario: points.reduce((acc, point) => acc + point.y, 0) / points.length,
        ultimo_custo: lastPoint.y,
        slope: regression.slope,
      };

      return {
        success: true,
        message: `Previsão de custo de frete para os próximos ${forecastHorizon} dias`,
        periodo_dias: history,
        forecast_dias: forecastHorizon,
        rows,
        summary,
        sql_query: sql,
        sql_params: formatSqlParams([history]),
      };
    } catch (error) {
      console.error('ERRO forecastDeliveryCosts:', error);
      return {
        success: false,
        message: `Erro ao prever custos de entrega: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
