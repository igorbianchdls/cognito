export const APPS_GOOGLEADS_TEMPLATE_TEXT = JSON.stringify(
  [
    {
      type: 'Theme',
      props: {
        name: 'light',
        managers: {
          border: {
            style: 'solid',
            width: 1,
            color: '#bfc9d9',
            radius: 8,
            frame: { variant: 'hud', cornerSize: 8, cornerWidth: 1 },
          },
        },
      },
      children: [
        {
          type: 'Header',
          props: {
            title: 'Dashboard Google Ads',
            subtitle: 'Lumi Skin • Search, Shopping e PMax (visão DTC)',
            align: 'center',
            controlsPosition: 'right',
            datePicker: {
              visible: true,
              mode: 'range',
              position: 'right',
              storePath: 'filters.dateRange',
              actionOnChange: { type: 'refresh_data' },
              style: { padding: 6, fontFamily: 'Barlow', fontSize: 12 },
            },
          },
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, childGrow: true },
          children: [
            {
              type: 'KPI',
              props: {
                fr: 1,
                title: 'Gasto (Campanhas)',
                format: 'currency',
                borderless: true,
                dataQuery: { model: 'trafegopago.desempenho_diario', measure: 'SUM(gasto)', filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' } },
              },
            },
            {
              type: 'KPI',
              props: {
                fr: 1,
                title: 'Receita Atribuída',
                format: 'currency',
                borderless: true,
                dataQuery: { model: 'trafegopago.desempenho_diario', measure: 'SUM(receita_atribuida)', filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' } },
              },
            },
            {
              type: 'KPI',
              props: {
                fr: 1,
                title: 'Cliques',
                format: 'number',
                borderless: true,
                dataQuery: { model: 'trafegopago.desempenho_diario', measure: 'SUM(cliques)', filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' } },
              },
            },
            {
              type: 'KPI',
              props: {
                fr: 1,
                title: 'Conversões',
                format: 'number',
                borderless: true,
                dataQuery: { model: 'trafegopago.desempenho_diario', measure: 'SUM(conversoes)', filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' } },
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, childGrow: true },
          children: [
            {
              type: 'LineChart',
              props: {
                fr: 1,
                title: 'Gasto por Mês',
                dataQuery: {
                  model: 'trafegopago.desempenho_diario',
                  dimension: 'mes',
                  dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                  measure: 'SUM(gasto)',
                  filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' },
                  orderBy: { field: 'dimension', dir: 'asc' },
                  limit: 12,
                },
                format: 'currency',
                height: 240,
                nivo: { curve: 'monotoneX', area: true },
              },
            },
            {
              type: 'LineChart',
              props: {
                fr: 1,
                title: 'Receita por Mês',
                dataQuery: {
                  model: 'trafegopago.desempenho_diario',
                  dimension: 'mes',
                  dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                  measure: 'SUM(receita_atribuida)',
                  filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' },
                  orderBy: { field: 'dimension', dir: 'asc' },
                  limit: 12,
                },
                format: 'currency',
                height: 240,
                nivo: { curve: 'monotoneX', area: true },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'ROAS por Mês',
                dataQuery: {
                  model: 'trafegopago.desempenho_diario',
                  dimension: 'mes',
                  dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                  measure: 'CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END',
                  filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' },
                  orderBy: { field: 'dimension', dir: 'asc' },
                  limit: 12,
                },
                format: 'number',
                height: 240,
                nivo: { layout: 'vertical' },
              },
            },
            {
              type: 'AISummary',
              props: {
                fr: 1,
                title: 'Insights da IA',
                items: [
                  { icon: 'badgecheck', text: 'Search de marca costuma puxar ROAS; compare picos de receita com gasto incremental.' },
                  { icon: 'trendingUp', text: 'Shopping/PMax ajudam escala; monitore eficiência por mês e concentração de gasto.' },
                  { icon: 'triangleAlert', text: 'Separe campaign/ad_group/ad no tráfego pago para evitar leituras duplicadas do mesmo investimento.' },
                ],
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, childGrow: true },
          children: [
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Top Campanhas por Gasto',
                dataQuery: {
                  model: 'trafegopago.desempenho_diario',
                  dimension: 'campanha_id',
                  measure: 'SUM(gasto)',
                  filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' },
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'currency',
                height: 240,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Top Campanhas por Cliques',
                dataQuery: {
                  model: 'trafegopago.desempenho_diario',
                  dimension: 'campanha_id',
                  measure: 'SUM(cliques)',
                  filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'campaign' },
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'number',
                height: 240,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Top Grupos por Gasto',
                dataQuery: {
                  model: 'trafegopago.desempenho_diario',
                  dimension: 'grupo_id',
                  measure: 'SUM(gasto)',
                  filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'ad_group' },
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'currency',
                height: 240,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'PieChart',
              props: {
                fr: 1,
                title: 'Receita por Anúncio (Top 8)',
                dataQuery: {
                  model: 'trafegopago.desempenho_diario',
                  dimension: 'anuncio_id',
                  measure: 'SUM(receita_atribuida)',
                  filters: { tenant_id: 1, plataforma: 'google_ads', nivel: 'ad' },
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'currency',
                height: 240,
                nivo: { innerRadius: 0.35 },
              },
            },
          ],
        },
      ],
    },
  ],
  null,
  2,
)

