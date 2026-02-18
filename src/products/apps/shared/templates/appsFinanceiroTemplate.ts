import { BiSlicers } from '@/products/apps/bi'

const fornecedorOptionsSource = BiSlicers.createOptionsSource('financeiro.contas_pagar', 'fornecedor_id', 80)
const statusOptionsSource = BiSlicers.createOptionsSource('financeiro.contas_pagar', 'status', 40)

export const APPS_FINANCEIRO_TEMPLATE_TEXT = JSON.stringify(
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
            frame: { variant: 'hud', cornerSize: 14, cornerWidth: 1 },
          },
        },
      },
      children: [
        {
          type: 'Header',
          props: {
            title: 'Dashboard Financeiro',
            subtitle: 'Contas a pagar, receber e fluxo do período',
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
            { type: 'KPI', props: { title: 'Recebidos', valuePath: 'financeiro.kpis.recebidos_mes', format: 'currency' } },
            { type: 'KPI', props: { title: 'Pagos', valuePath: 'financeiro.kpis.pagos_mes', format: 'currency' } },
            { type: 'KPI', props: { title: 'Geração de Caixa', valuePath: 'financeiro.kpis.geracao_caixa', format: 'currency' } },
            {
              type: 'KPI',
              props: {
                title: 'Títulos em AP',
                format: 'number',
                dataQuery: { model: 'financeiro.contas_pagar', measure: 'COUNT()', filters: { tenant_id: 1 } },
              },
            },
          ],
        },
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
          children: [
            {
              type: 'SlicerCard',
              props: {
                fr: 1,
                title: 'Filtros',
                layout: 'horizontal',
                fields: [
                  {
                    label: 'Fornecedor',
                    type: 'tile-multi',
                    storePath: 'filters.fornecedor_id',
                    selectAll: true,
                    search: true,
                    clearable: true,
                    source: fornecedorOptionsSource,
                  },
                  {
                    label: 'Status',
                    type: 'tile-multi',
                    storePath: 'filters.status',
                    selectAll: true,
                    search: true,
                    clearable: true,
                    source: statusOptionsSource,
                  },
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
                title: 'AP por Fornecedor',
                dataQuery: {
                  model: 'financeiro.contas_pagar',
                  dimension: 'fornecedor',
                  measure: 'SUM(valor_liquido)',
                  filters: { tenant_id: 1 },
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
                title: 'AP por Categoria',
                dataQuery: {
                  model: 'financeiro.contas_pagar',
                  dimension: 'categoria_despesa',
                  measure: 'SUM(valor_liquido)',
                  filters: { tenant_id: 1 },
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
                title: 'AR por Cliente',
                dataQuery: {
                  model: 'financeiro.contas_receber',
                  dimension: 'cliente',
                  measure: 'SUM(valor_liquido)',
                  filters: { tenant_id: 1 },
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'currency',
                height: 240,
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
                title: 'Contas a Receber por Mês',
                dataQuery: {
                  model: 'financeiro.contas_receber',
                  dimension: 'mes',
                  dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_vencimento), 'YYYY-MM')",
                  measure: 'SUM(valor_liquido)',
                  filters: { tenant_id: 1 },
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
                title: 'Status de AP',
                dataQuery: {
                  model: 'financeiro.contas_pagar',
                  dimension: 'status',
                  measure: 'COUNT()',
                  filters: { tenant_id: 1 },
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'number',
                height: 240,
                nivo: { layout: 'horizontal' },
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

