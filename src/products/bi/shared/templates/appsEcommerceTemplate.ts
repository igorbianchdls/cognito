import { BiSlicers } from '@/products/bi'

const plataformaOptionsSource = BiSlicers.createOptionsSource('ecommerce.pedidos', 'plataforma', 20)
const contaOptionsSource = {
  ...BiSlicers.createOptionsSource('ecommerce.pedidos', 'canal_conta_id', 80),
  dependsOn: ['filters.plataforma'],
}
const lojaOptionsSource = {
  ...BiSlicers.createOptionsSource('ecommerce.pedidos', 'loja_id', 80),
  dependsOn: ['filters.plataforma', 'filters.canal_conta_id'],
}
const statusPedidoOptionsSource = {
  ...BiSlicers.createOptionsSource('ecommerce.pedidos', 'status', 40),
  dependsOn: ['filters.plataforma', 'filters.canal_conta_id', 'filters.loja_id'],
}
const statusPagamentoOptionsSource = {
  ...BiSlicers.createOptionsSource('ecommerce.pedidos', 'status_pagamento', 40),
  dependsOn: ['filters.plataforma', 'filters.canal_conta_id', 'filters.loja_id'],
}
const statusFulfillmentOptionsSource = {
  ...BiSlicers.createOptionsSource('ecommerce.pedidos', 'status_fulfillment', 40),
  dependsOn: ['filters.plataforma', 'filters.canal_conta_id', 'filters.loja_id'],
}

const globalFilters = {
  tenant_id: 1,
}

export const APPS_ECOMMERCE_TEMPLATE_TEXT = JSON.stringify(
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
            radius: 10,
            frame: {
              variant: 'hud',
              cornerSize: 8,
              cornerWidth: 1,
            },
          },
          color: {
            scheme: ['#0EA5E9', '#F97316', '#22C55E', '#8B5CF6', '#EF4444'],
          },
        },
      },
      children: [
        {
          type: 'Header',
          props: {
            title: 'Dashboard E-commerce (Consolidado)',
            subtitle: 'Amazon, Mercado Livre, Shopee e Shopify em uma visão única',
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
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true, justify: 'start', align: 'start' },
          children: [
            {
              type: 'SlicerCard',
              props: {
                fr: 1,
                title: 'Filtro de Plataformas',
                fields: [
                  { label: 'Plataforma', type: 'list', storePath: 'filters.plataforma', search: true, selectAll: true, clearable: true, source: plataformaOptionsSource },
                ],
              },
            },
            {
              type: 'SlicerCard',
              props: {
                fr: 1,
                title: 'Filtro de Contas',
                fields: [
                  { label: 'Conta', type: 'list', storePath: 'filters.canal_conta_id', search: true, selectAll: true, clearable: true, source: contaOptionsSource },
                ],
              },
            },
            {
              type: 'SlicerCard',
              props: {
                fr: 1,
                title: 'Filtro de Lojas',
                fields: [
                  { label: 'Loja', type: 'list', storePath: 'filters.loja_id', search: true, selectAll: true, clearable: true, source: lojaOptionsSource },
                ],
              },
            },
            {
              type: 'SlicerCard',
              props: {
                fr: 1,
                title: 'Status do Pedido',
                fields: [
                  { label: 'Status', type: 'list', storePath: 'filters.status', search: true, selectAll: true, clearable: true, source: statusPedidoOptionsSource },
                ],
              },
            },
            {
              type: 'SlicerCard',
              props: {
                fr: 1,
                title: 'Status Pagamento',
                fields: [
                  { label: 'Pagamento', type: 'list', storePath: 'filters.status_pagamento', search: true, selectAll: true, clearable: true, source: statusPagamentoOptionsSource },
                ],
              },
            },
            {
              type: 'SlicerCard',
              props: {
                fr: 1,
                title: 'Status Fulfillment',
                fields: [
                  { label: 'Fulfillment', type: 'list', storePath: 'filters.status_fulfillment', search: true, selectAll: true, clearable: true, source: statusFulfillmentOptionsSource },
                ],
              },
            },
          ],
        },

        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            { type: 'KPI', props: { fr: 1, title: 'GMV Consolidado', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'SUM(valor_total)', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Pedidos', format: 'number', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'COUNT()', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Ticket Médio', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'AVG(valor_total)', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Clientes Únicos', format: 'number', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'COUNT_DISTINCT(cliente_id)', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Receita Líquida Est.', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'SUM(valor_liquido_estimado)', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Reembolsos', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'SUM(valor_reembolsado)', filters: globalFilters } } },
          ],
        },

        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            { type: 'KPI', props: { fr: 1, title: 'Taxas de Pedido', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'SUM(taxa_total)', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Fee Rate', format: 'percent', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Payout Líquido', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.payouts', measure: 'SUM(valor_liquido)', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Envios', format: 'number', borderless: true, dataQuery: { model: 'ecommerce.envios', measure: 'COUNT()', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Frete Custo', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.envios', measure: 'SUM(frete_custo)', filters: globalFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Estoque Disponível', format: 'number', borderless: true, dataQuery: { model: 'ecommerce.estoque_saldos', measure: 'SUM(quantidade_disponivel)', filters: globalFilters } } },
          ],
        },

        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            {
              type: 'LineChart',
              props: {
                fr: 2,
                title: 'GMV por Mês',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'mes', measure: 'SUM(valor_total)', filters: globalFilters, orderBy: { field: 'dimension', dir: 'asc' }, limit: 18 },
                format: 'currency',
                height: 250,
                nivo: { curve: 'monotoneX', area: true },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Pedidos por Plataforma',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'plataforma', measure: 'COUNT()', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 },
                format: 'number',
                height: 250,
                interaction: { clickAsFilter: true, filterField: 'plataforma', storePath: 'filters.plataforma', clearOnSecondClick: true },
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'PieChart',
              props: {
                fr: 1,
                title: 'GMV por Plataforma',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'plataforma', measure: 'SUM(valor_total)', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 },
                format: 'currency',
                height: 250,
                interaction: { clickAsFilter: true, filterField: 'plataforma', storePath: 'filters.plataforma', clearOnSecondClick: true },
                nivo: { innerRadius: 0.45 },
              },
            },
          ],
        },

        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'GMV por Loja',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'loja', measure: 'SUM(valor_total)', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 12 },
                format: 'currency',
                height: 240,
                interaction: { clickAsFilter: true, filterField: 'loja_id', storePath: 'filters.loja_id', clearOnSecondClick: true },
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'LineChart',
              props: {
                fr: 1,
                title: 'Receita Líquida Est. por Mês',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'mes', measure: 'SUM(valor_liquido_estimado)', filters: globalFilters, orderBy: { field: 'dimension', dir: 'asc' }, limit: 18 },
                format: 'currency',
                height: 240,
                nivo: { curve: 'monotoneX', area: true },
              },
            },
            {
              type: 'PieChart',
              props: {
                fr: 1,
                title: 'Status de Pagamento',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'status_pagamento', measure: 'COUNT()', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 },
                format: 'number',
                height: 240,
                interaction: { clickAsFilter: true, filterField: 'status_pagamento', storePath: 'filters.status_pagamento', clearOnSecondClick: true },
                nivo: { innerRadius: 0.45 },
              },
            },
          ],
        },

        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Top Produtos por Receita',
                dataQuery: { model: 'ecommerce.pedido_itens', dimension: 'produto', measure: 'SUM(valor_total)', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 12 },
                format: 'currency',
                height: 260,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Categorias por Receita',
                dataQuery: { model: 'ecommerce.pedido_itens', dimension: 'categoria', measure: 'SUM(valor_total)', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 10 },
                format: 'currency',
                height: 260,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Taxas por Tipo',
                dataQuery: { model: 'ecommerce.taxas_pedido', dimension: 'tipo_taxa', measure: 'SUM(valor)', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 10 },
                format: 'currency',
                height: 260,
                nivo: { layout: 'horizontal' },
              },
            },
          ],
        },

        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            {
              type: 'LineChart',
              props: {
                fr: 1,
                title: 'Payout Líquido por Mês',
                dataQuery: { model: 'ecommerce.payouts', dimension: 'mes', measure: 'SUM(valor_liquido)', filters: globalFilters, orderBy: { field: 'dimension', dir: 'asc' }, limit: 18 },
                format: 'currency',
                height: 220,
                nivo: { curve: 'monotoneX', area: true },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Envios por Transportadora',
                dataQuery: { model: 'ecommerce.envios', dimension: 'transportadora', measure: 'COUNT()', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 10 },
                format: 'number',
                height: 220,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'LineChart',
              props: {
                fr: 1,
                title: 'Estoque Disponível por Mês',
                dataQuery: { model: 'ecommerce.estoque_saldos', dimension: 'mes', measure: 'SUM(quantidade_disponivel)', filters: globalFilters, orderBy: { field: 'dimension', dir: 'asc' }, limit: 18 },
                format: 'number',
                height: 220,
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
                title: 'Ticket Médio por Plataforma',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'plataforma', measure: 'AVG(valor_total)', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 },
                format: 'currency',
                height: 220,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Clientes Únicos por Plataforma',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'plataforma', measure: 'COUNT_DISTINCT(cliente_id)', filters: globalFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 },
                format: 'number',
                height: 220,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'AISummary',
              props: {
                fr: 1,
                title: 'Insights da IA',
                containerStyle: { padding: '12px 12px 16px 12px' },
                itemTextStyle: { padding: '0 8px' },
                items: [
                  { icon: 'trendingUp', text: 'O consolidado mostra onde o volume está crescendo e onde a margem está pressionada por taxas.' },
                  { icon: 'sparkles', text: 'Comparar ticket médio e receita líquida por plataforma ajuda a priorizar investimento comercial.' },
                  { icon: 'triangleAlert', text: 'Picos de reembolso e custo logístico podem reduzir payout mesmo com GMV em alta.' },
                ],
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
