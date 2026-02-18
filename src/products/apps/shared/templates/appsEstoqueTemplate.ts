import { BiSlicers } from '@/products/apps/bi'

const almoxarifadoOptionsSource = BiSlicers.createOptionsSource('estoque.estoques_atual', 'almoxarifado_id', 80)
const produtoOptionsSource = BiSlicers.createOptionsSource('estoque.estoques_atual', 'produto_id', 120)
const tipoMovimentoOptionsSource = BiSlicers.createOptionsSource('estoque.movimentacoes', 'tipo_movimento', 40)

export const APPS_ESTOQUE_TEMPLATE_TEXT = JSON.stringify(
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
            title: 'Dashboard de Estoque',
            subtitle: 'Nível de estoque, movimentações e valor imobilizado',
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
            { type: 'KPI', props: { title: 'Valor em Estoque', valuePath: 'estoque.kpis.valor_total_estoque', format: 'currency' } },
            { type: 'KPI', props: { title: 'Quantidade Total', valuePath: 'estoque.kpis.quantidade_total', format: 'number' } },
            { type: 'KPI', props: { title: 'Produtos Ativos', valuePath: 'estoque.kpis.produtos_ativos', format: 'number' } },
            { type: 'KPI', props: { title: 'Movimentações', valuePath: 'estoque.kpis.movimentacoes_periodo', format: 'number' } },
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
                    label: 'Almoxarifado',
                    type: 'tile-multi',
                    storePath: 'filters.almoxarifado_id',
                    clearable: true,
                    search: true,
                    selectAll: true,
                    source: almoxarifadoOptionsSource,
                  },
                  {
                    label: 'Produto',
                    type: 'tile-multi',
                    storePath: 'filters.produto_id',
                    clearable: true,
                    search: true,
                    selectAll: true,
                    source: produtoOptionsSource,
                  },
                  {
                    label: 'Tipo Movimento',
                    type: 'tile-multi',
                    storePath: 'filters.tipo_movimento',
                    clearable: true,
                    search: true,
                    selectAll: true,
                    source: tipoMovimentoOptionsSource,
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
                title: 'Estoque por Almoxarifado',
                dataQuery: {
                  model: 'estoque.estoques_atual',
                  dimension: 'almoxarifado',
                  measure: 'SUM(quantidade)',
                  filters: {},
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
                fr: 2,
                title: 'Top Produtos por Quantidade',
                dataQuery: {
                  model: 'estoque.estoques_atual',
                  dimension: 'produto',
                  measure: 'SUM(quantidade)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 10,
                },
                format: 'number',
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
                title: 'Movimentações por Tipo',
                dataQuery: {
                  model: 'estoque.movimentacoes',
                  dimension: 'tipo_movimento',
                  measure: 'SUM(quantidade)',
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
                title: 'Valor Movimentado por Mês',
                dataQuery: {
                  model: 'estoque.movimentacoes',
                  dimension: 'mes',
                  dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM')",
                  measure: 'SUM(valor_total)',
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
        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true },
          children: [
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Valor em Estoque por Almoxarifado',
                dataQuery: {
                  model: 'estoque.estoques_atual',
                  dimension: 'almoxarifado',
                  measure: 'SUM(valor_total)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'currency',
                height: 230,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'PieChart',
              props: {
                fr: 1,
                title: 'Movimentações por Natureza',
                dataQuery: {
                  model: 'estoque.movimentacoes',
                  dimension: 'natureza',
                  measure: 'SUM(quantidade)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'number',
                height: 230,
                nivo: { innerRadius: 0.35 },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Movimentos por Almoxarifado',
                dataQuery: {
                  model: 'estoque.movimentacoes',
                  dimension: 'almoxarifado',
                  measure: 'COUNT()',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'number',
                height: 230,
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
              type: 'BarChart',
              props: {
                fr: 2,
                title: 'Top Produtos por Valor Movimentado',
                dataQuery: {
                  model: 'estoque.movimentacoes',
                  dimension: 'produto',
                  measure: 'SUM(valor_total)',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 10,
                },
                format: 'currency',
                height: 230,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'LineChart',
              props: {
                fr: 2,
                title: 'Quantidade Movimentada por Mês',
                dataQuery: {
                  model: 'estoque.movimentacoes',
                  dimension: 'mes',
                  dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM')",
                  measure: 'SUM(quantidade)',
                  filters: {},
                  orderBy: { field: 'dimension', dir: 'asc' },
                  limit: 12,
                },
                format: 'number',
                height: 230,
                nivo: { curve: 'monotoneX', area: true },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'SKUs por Almoxarifado',
                dataQuery: {
                  model: 'estoque.estoques_atual',
                  dimension: 'almoxarifado',
                  measure: 'COUNT()',
                  filters: {},
                  orderBy: { field: 'measure', dir: 'desc' },
                  limit: 8,
                },
                format: 'number',
                height: 230,
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
