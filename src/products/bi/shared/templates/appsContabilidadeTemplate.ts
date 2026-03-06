import { migrateTemplateDataQueries } from '@/products/bi/shared/templates/dataQuerySqlMigration'
import { renderDashboardTemplateDslFromJsonText } from '@/products/bi/shared/templates/templateDslBridge'
export const APPS_CONTABILIDADE_TEMPLATE_TEXT = JSON.stringify(migrateTemplateDataQueries(
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
            title: 'Dashboard Contabilidade',
            subtitle: 'Razao contabil, saldos e distribuicoes por conta',
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
          props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
          children: [
            {
              type: 'KPI',
              props: {
                title: 'Debitos no Periodo',
                format: 'currency',
                dataQuery: { model: 'contabilidade.lancamentos_contabeis_linhas', measure: 'SUM(debito)', filters: {} },
              },
            },
            {
              type: 'KPI',
              props: {
                title: 'Creditos no Periodo',
                format: 'currency',
                dataQuery: { model: 'contabilidade.lancamentos_contabeis_linhas', measure: 'SUM(credito)', filters: {} },
              },
            },
            {
              type: 'KPI',
              props: {
                title: 'Saldo (D-C)',
                format: 'currency',
                dataQuery: { model: 'contabilidade.lancamentos_contabeis_linhas', measure: 'SUM(debito - credito)', filters: {} },
              },
            },
            {
              type: 'KPI',
              props: {
                title: 'Lancamentos',
                format: 'number',
                dataQuery: { model: 'contabilidade.lancamentos_contabeis_linhas', measure: 'COUNT_DISTINCT(lancamento_id)', filters: {} },
              },
            },
            {
              type: 'KPI',
              props: {
                title: 'Linhas Contabeis',
                format: 'number',
                dataQuery: { model: 'contabilidade.lancamentos_contabeis_linhas', measure: 'COUNT()', filters: {} },
              },
            },
            {
              type: 'KPI',
              props: {
                title: 'Contas Movimentadas',
                format: 'number',
                dataQuery: { model: 'contabilidade.lancamentos_contabeis_linhas', measure: 'COUNT_DISTINCT(conta_id)', filters: {} },
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
          children: [
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Debitos por Tipo de Conta',
                dataQuery: {
                  model: 'contabilidade.lancamentos_contabeis_linhas',
                  dimension: 'tipo_conta',
                  measure: 'SUM(debito)',
                  filters: {},
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
                title: 'Creditos por Tipo de Conta',
                dataQuery: {
                  model: 'contabilidade.lancamentos_contabeis_linhas',
                  dimension: 'tipo_conta',
                  measure: 'SUM(credito)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'currency',
                height: 240,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'AISummary',
              props: {
                fr: 1,
                title: 'Insights da IA',
                items: [
                  { icon: 'brain', text: 'Lançamentos concentrados em poucas contas podem mascarar variações sazonais do período.' },
                  { icon: 'activity', text: 'Compare débitos e créditos por conta antes de analisar saldo consolidado mensal.' },
                  { icon: 'triangleAlert', text: 'Diferenças de classificação contábil costumam aparecer primeiro nas contas analíticas.' },
                ],
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
          children: [
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Top Contas (Debito)',
                dataQuery: {
                  model: 'contabilidade.lancamentos_contabeis_linhas',
                  dimension: 'conta',
                  measure: 'SUM(debito)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 10,
                },
                format: 'currency',
                height: 260,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Top Contas (Credito)',
                dataQuery: {
                  model: 'contabilidade.lancamentos_contabeis_linhas',
                  dimension: 'conta',
                  measure: 'SUM(credito)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 10,
                },
                format: 'currency',
                height: 260,
                nivo: { layout: 'horizontal' },
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
          children: [
            {
              type: 'LineChart',
              props: {
                fr: 1,
                title: 'Debitos por Mes',
                dataQuery: {
                  model: 'contabilidade.lancamentos_contabeis_linhas',
                  dimension: 'periodo',
                  measure: 'SUM(debito)',
                  filters: {},
                  orderBy: { field: 'dimension', dir: 'asc' },
                  limit: 24,
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
                title: 'Creditos por Mes',
                dataQuery: {
                  model: 'contabilidade.lancamentos_contabeis_linhas',
                  dimension: 'periodo',
                  measure: 'SUM(credito)',
                  filters: {},
                  orderBy: { field: 'dimension', dir: 'asc' },
                  limit: 24,
                },
                format: 'currency',
                height: 240,
                nivo: { curve: 'monotoneX', area: true },
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
          children: [
            {
              type: 'PieChart',
              props: {
                fr: 1,
                title: 'Origem dos Lancamentos',
                dataQuery: {
                  model: 'contabilidade.lancamentos_contabeis_linhas',
                  dimension: 'origem',
                  measure: 'COUNT_DISTINCT(lancamento_id)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'number',
                height: 260,
                nivo: { innerRadius: 0.35 },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Saldo por Conta (D-C)',
                dataQuery: {
                  model: 'contabilidade.lancamentos_contabeis_linhas',
                  dimension: 'conta',
                  measure: 'SUM(debito - credito)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 10,
                },
                format: 'currency',
                height: 260,
                nivo: { layout: 'horizontal' },
              },
            },
          ],
        },
      ],
    },
  ]),
  null,
  2,
)

export const APPS_CONTABILIDADE_TEMPLATE_DSL = renderDashboardTemplateDslFromJsonText(APPS_CONTABILIDADE_TEMPLATE_TEXT, 'apps_contabilidade_template_dsl')
