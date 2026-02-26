type AdsPlatform = 'meta_ads' | 'google_ads'

type AnyRecord = Record<string, any>

type InsightItem = { icon: string; text: string }

type AdsDashboardTemplateConfig = {
  plataforma: AdsPlatform
  title: string
  subtitle: string
  palette: string[]
  insights: InsightItem[]
  topCampaignSecondaryTitle: string
  topCampaignSecondaryMeasure: string
  topCampaignSecondaryFormat: 'currency' | 'number' | 'percent'
}

const MODEL = 'trafegopago.desempenho_diario'
const MONTH_DIMENSION_EXPR = "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')"

const SQL = {
  roas: 'CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END',
  ctr: 'CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END',
  cpc: 'CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(gasto)/SUM(cliques) END',
  cpm: 'CASE WHEN SUM(impressoes)=0 THEN 0 ELSE (SUM(gasto)*1000.0)/SUM(impressoes) END',
  cpa: 'CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END',
  cvr: 'CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END',
  leadRate: 'CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(leads)/SUM(cliques) END',
} as const

function baseFilters(plataforma: AdsPlatform, nivel: 'campaign' | 'ad_group' | 'ad'): AnyRecord {
  return { tenant_id: 1, plataforma, nivel }
}

function dataQuery(
  plataforma: AdsPlatform,
  nivel: 'campaign' | 'ad_group' | 'ad',
  measure: string,
  extra: AnyRecord = {},
) {
  return {
    model: MODEL,
    measure,
    filters: { ...baseFilters(plataforma, nivel), ...(extra.filters || {}) },
    ...(extra.dimension ? { dimension: extra.dimension } : {}),
    ...(extra.dimensionExpr ? { dimensionExpr: extra.dimensionExpr } : {}),
    ...(extra.orderBy ? { orderBy: extra.orderBy } : {}),
    ...(typeof extra.limit === 'number' ? { limit: extra.limit } : {}),
  }
}

function kpi(
  title: string,
  format: 'currency' | 'number' | 'percent',
  dq: AnyRecord,
  extra: AnyRecord = {},
) {
  return {
    type: 'KPI',
    props: {
      fr: 1,
      title,
      format,
      borderless: true,
      dataQuery: dq,
      ...extra,
    },
  }
}

function monthlyChart(
  type: 'LineChart' | 'BarChart',
  title: string,
  format: 'currency' | 'number' | 'percent',
  plataforma: AdsPlatform,
  measure: string,
  extra: AnyRecord = {},
) {
  return {
    type,
    props: {
      fr: 1,
      title,
      dataQuery: dataQuery(plataforma, 'campaign', measure, {
        dimension: 'mes',
        dimensionExpr: MONTH_DIMENSION_EXPR,
        orderBy: { field: 'dimension', dir: 'asc' },
        limit: 12,
      }),
      format,
      height: 250,
      interaction: { clickAsFilter: false },
      ...(type === 'LineChart'
        ? { nivo: { curve: 'monotoneX', area: true } }
        : { nivo: { layout: 'vertical' } }),
      ...extra,
    },
  }
}

function rankingBarChart(
  title: string,
  format: 'currency' | 'number' | 'percent',
  plataforma: AdsPlatform,
  nivel: 'campaign' | 'ad_group' | 'ad',
  dimension: 'conta_id' | 'campanha_id' | 'grupo_id' | 'anuncio_id',
  measure: string,
  orderDir: 'asc' | 'desc' = 'desc',
) {
  return {
    type: 'BarChart',
    props: {
      fr: 1,
      title,
      dataQuery: dataQuery(plataforma, nivel, measure, {
        dimension,
        orderBy: { field: 'measure', dir: orderDir },
        limit: 8,
      }),
      format,
      height: 260,
      nivo: { layout: 'horizontal' },
      interaction: {
        clickAsFilter: true,
        filterField: dimension,
        storePath: `filters.${dimension}`,
        clearOnSecondClick: true,
      },
    },
  }
}

function buildAdsDashboardTemplate(config: AdsDashboardTemplateConfig) {
  const { plataforma } = config
  return [
    {
      type: 'Theme',
      props: {
        name: 'light',
        managers: {
          border: {
            style: 'solid',
            width: 1,
            color: '#bfc9d9',
            radius: 10,
            frame: { variant: 'hud', cornerSize: 8, cornerWidth: 1 },
          },
          color: {
            scheme: config.palette,
          },
        },
      },
      children: [
        {
          type: 'Header',
          props: {
            title: config.title,
            subtitle: config.subtitle,
            align: 'center',
            controlsPosition: 'below',
            datePicker: {
              visible: true,
              mode: 'range',
              position: 'right',
              storePath: 'filters.dateRange',
              actionOnChange: { type: 'refresh_data' },
              style: { padding: 6, fontFamily: 'Barlow', fontSize: 12 },
            },
            slicers: [
              {
                type: 'range',
                label: 'Faixa de gasto',
                storeMinPath: 'filters.gasto_min',
                storeMaxPath: 'filters.gasto_max',
                prefix: 'R$',
                step: 100,
                placeholderMin: 'mín',
                placeholderMax: 'máx',
                clearable: true,
                actionOnChange: { type: 'refresh_data' },
              },
            ],
          },
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            {
              type: 'SlicerCard',
              props: {
                fr: 1,
                title: 'Filtros de análise',
                layout: 'horizontal',
                applyMode: 'manual',
                actionOnApply: { type: 'refresh_data' },
                fields: [
                  {
                    label: 'Conta',
                    type: 'list',
                    storePath: 'filters.conta_id',
                    width: 240,
                    search: true,
                    selectAll: true,
                    clearable: true,
                    source: { type: 'options', model: MODEL, field: 'conta_id', limit: 50 },
                  },
                  {
                    label: 'Campanha',
                    type: 'list',
                    storePath: 'filters.campanha_id',
                    width: 260,
                    search: true,
                    selectAll: true,
                    clearable: true,
                    source: {
                      type: 'options',
                      model: MODEL,
                      field: 'campanha_id',
                      limit: 100,
                      dependsOn: ['filters.conta_id'],
                    },
                  },
                  {
                    label: 'Grupo',
                    type: 'list',
                    storePath: 'filters.grupo_id',
                    width: 240,
                    search: true,
                    selectAll: true,
                    clearable: true,
                    source: {
                      type: 'options',
                      model: MODEL,
                      field: 'grupo_id',
                      limit: 100,
                      dependsOn: ['filters.conta_id', 'filters.campanha_id'],
                    },
                  },
                  {
                    label: 'Anúncio',
                    type: 'list',
                    storePath: 'filters.anuncio_id',
                    width: 240,
                    search: true,
                    selectAll: true,
                    clearable: true,
                    source: {
                      type: 'options',
                      model: MODEL,
                      field: 'anuncio_id',
                      limit: 100,
                      dependsOn: ['filters.conta_id', 'filters.campanha_id', 'filters.grupo_id'],
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            kpi('Gasto (Campanhas)', 'currency', dataQuery(plataforma, 'campaign', 'SUM(gasto)')),
            kpi('Receita Atribuída', 'currency', dataQuery(plataforma, 'campaign', 'SUM(receita_atribuida)')),
            kpi('ROAS', 'number', dataQuery(plataforma, 'campaign', SQL.roas)),
            kpi('Cliques', 'number', dataQuery(plataforma, 'campaign', 'SUM(cliques)')),
            kpi('Impressões', 'number', dataQuery(plataforma, 'campaign', 'SUM(impressoes)')),
            kpi('Conversões', 'number', dataQuery(plataforma, 'campaign', 'SUM(conversoes)')),
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            kpi('Leads', 'number', dataQuery(plataforma, 'campaign', 'SUM(leads)')),
            kpi('CTR', 'percent', dataQuery(plataforma, 'campaign', SQL.ctr)),
            kpi('CPC', 'currency', dataQuery(plataforma, 'campaign', SQL.cpc)),
            kpi('CPM', 'currency', dataQuery(plataforma, 'campaign', SQL.cpm)),
            kpi('CPA', 'currency', dataQuery(plataforma, 'campaign', SQL.cpa)),
            kpi('CVR', 'percent', dataQuery(plataforma, 'campaign', SQL.cvr)),
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            monthlyChart('LineChart', 'Gasto por Mês', 'currency', plataforma, 'SUM(gasto)'),
            monthlyChart('LineChart', 'Receita por Mês', 'currency', plataforma, 'SUM(receita_atribuida)'),
            monthlyChart('BarChart', 'ROAS por Mês', 'number', plataforma, SQL.roas),
            monthlyChart('BarChart', 'CPA por Mês', 'currency', plataforma, SQL.cpa),
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            monthlyChart('LineChart', 'Impressões por Mês', 'number', plataforma, 'SUM(impressoes)', {
              nivo: { curve: 'monotoneX', area: false },
            }),
            monthlyChart('LineChart', 'Cliques por Mês', 'number', plataforma, 'SUM(cliques)', {
              nivo: { curve: 'monotoneX', area: false },
            }),
            monthlyChart('BarChart', 'CTR por Mês', 'percent', plataforma, SQL.ctr),
            monthlyChart('BarChart', 'CVR por Mês', 'percent', plataforma, SQL.cvr),
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            {
              type: 'AISummary',
              props: {
                fr: 1,
                title: 'Leituras e alertas',
                colorScheme: config.palette,
                items: config.insights,
              },
            },
            {
              type: 'PieChart',
              props: {
                fr: 1,
                title: 'Participação de Gasto por Conta (Top 8)',
                dataQuery: dataQuery(plataforma, 'campaign', 'SUM(gasto)', {
                  dimension: 'conta_id',
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                }),
                format: 'currency',
                height: 260,
                interaction: {
                  clickAsFilter: true,
                  filterField: 'conta_id',
                  storePath: 'filters.conta_id',
                },
                nivo: { innerRadius: 0.45 },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Top Campanhas por Leads',
                dataQuery: dataQuery(plataforma, 'campaign', 'SUM(leads)', {
                  dimension: 'campanha_id',
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                }),
                format: 'number',
                height: 260,
                nivo: { layout: 'horizontal' },
                interaction: {
                  clickAsFilter: true,
                  filterField: 'campanha_id',
                  storePath: 'filters.campanha_id',
                },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Lead Rate por Mês',
                dataQuery: dataQuery(plataforma, 'campaign', SQL.leadRate, {
                  dimension: 'mes',
                  dimensionExpr: MONTH_DIMENSION_EXPR,
                  orderBy: { field: 'dimension', dir: 'asc' },
                  limit: 12,
                }),
                format: 'percent',
                height: 260,
                interaction: { clickAsFilter: false },
                nivo: { layout: 'vertical' },
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            rankingBarChart('Top Campanhas por Gasto', 'currency', plataforma, 'campaign', 'campanha_id', 'SUM(gasto)', 'desc'),
            rankingBarChart(config.topCampaignSecondaryTitle, config.topCampaignSecondaryFormat, plataforma, 'campaign', 'campanha_id', config.topCampaignSecondaryMeasure, 'desc'),
            rankingBarChart('Top Campanhas por ROAS', 'number', plataforma, 'campaign', 'campanha_id', SQL.roas, 'desc'),
            rankingBarChart('Piores Campanhas por ROAS', 'number', plataforma, 'campaign', 'campanha_id', SQL.roas, 'asc'),
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            rankingBarChart('Top Grupos por Gasto', 'currency', plataforma, 'ad_group', 'grupo_id', 'SUM(gasto)', 'desc'),
            rankingBarChart('Top Grupos por ROAS', 'number', plataforma, 'ad_group', 'grupo_id', SQL.roas, 'desc'),
            rankingBarChart('Top Anúncios por Receita', 'currency', plataforma, 'ad', 'anuncio_id', 'SUM(receita_atribuida)', 'desc'),
            rankingBarChart('Top Anúncios por Conversões', 'number', plataforma, 'ad', 'anuncio_id', 'SUM(conversoes)', 'desc'),
          ],
        },
      ],
    },
  ]
}

export function buildAdsDashboardTemplateText(config: AdsDashboardTemplateConfig): string {
  return JSON.stringify(buildAdsDashboardTemplate(config), null, 2)
}
