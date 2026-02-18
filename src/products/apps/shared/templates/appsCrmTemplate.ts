import { BiSlicers } from '@/products/apps/bi'

const vendedorOptionsSource = BiSlicers.createOptionsSource('crm.oportunidades', 'vendedor_id', 80)
const faseOptionsSource = BiSlicers.createOptionsSource('crm.oportunidades', 'fase_pipeline_id', 80)
const origemOptionsSource = BiSlicers.createOptionsSource('crm.oportunidades', 'origem_id', 80)

export const APPS_CRM_TEMPLATE_TEXT = JSON.stringify(
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
            title: 'Dashboard de CRM',
            subtitle: 'Pipeline, conversão e origem de leads',
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
            { type: 'KPI', props: { title: 'Pipeline (R$)', valuePath: 'crm.kpis.faturamento', format: 'currency' } },
            { type: 'KPI', props: { title: 'Vendas', valuePath: 'crm.kpis.vendas', format: 'number' } },
            { type: 'KPI', props: { title: 'Oportunidades', valuePath: 'crm.kpis.oportunidades', format: 'number' } },
            { type: 'KPI', props: { title: 'Leads', valuePath: 'crm.kpis.totalLeads', format: 'number' } },
            { type: 'KPI', props: { title: 'Conversão', valuePath: 'crm.kpis.taxaConversao', format: 'number', unit: '%' } },
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
                    label: 'Vendedor',
                    type: 'tile-multi',
                    storePath: 'filters.vendedor_id',
                    clearable: true,
                    search: true,
                    selectAll: true,
                    source: vendedorOptionsSource,
                  },
                  {
                    label: 'Fase',
                    type: 'tile-multi',
                    storePath: 'filters.fase_pipeline_id',
                    clearable: true,
                    search: true,
                    selectAll: true,
                    source: faseOptionsSource,
                  },
                  {
                    label: 'Origem',
                    type: 'tile-multi',
                    storePath: 'filters.origem_id',
                    clearable: true,
                    search: true,
                    selectAll: true,
                    source: origemOptionsSource,
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
                fr: 2,
                title: 'Pipeline por Vendedor',
                dataQuery: {
                  model: 'crm.oportunidades',
                  dimension: 'vendedor',
                  measure: 'SUM(valor_estimado)',
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
                fr: 2,
                title: 'Pipeline por Fase',
                dataQuery: {
                  model: 'crm.oportunidades',
                  dimension: 'fase',
                  measure: 'SUM(valor_estimado)',
                  filters: {},
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
              type: 'PieChart',
              props: {
                fr: 1,
                title: 'Leads por Origem',
                dataQuery: {
                  model: 'crm.leads',
                  dimension: 'origem',
                  measure: 'COUNT()',
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
              type: 'LineChart',
              props: {
                fr: 2,
                title: 'Pipeline Mensal',
                dataQuery: {
                  model: 'crm.oportunidades',
                  dimension: 'mes',
                  dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_prevista), 'YYYY-MM')",
                  measure: 'SUM(valor_estimado)',
                  filters: {},
                  orderBy: { field: 'dimension', dir: 'asc' },
                  limit: 12,
                },
                format: 'currency',
                height: 260,
                nivo: { curve: 'monotoneX', area: true },
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

