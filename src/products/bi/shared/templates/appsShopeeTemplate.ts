import { BiSlicers } from '@/products/bi'

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

const platformFilters = {
  tenant_id: 1,
  plataforma: 'shopee',
}

export const APPS_SHOPEE_TEMPLATE_TEXT = JSON.stringify(
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
            scheme: ['#EE4D2D', '#FF7337', '#16A34A', '#0EA5E9', '#F59E0B'],
          },
        },
      },
      children: [
        {
          type: 'Header',
          props: {
            title: 'Dashboard Shopee',
            subtitle: 'E-commerce • Vendas, logística, financeiro e estoque',
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
            { type: 'KPI', props: { fr: 1, title: 'GMV', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'SUM(valor_total)', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Pedidos', format: 'number', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'COUNT()', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Ticket Médio', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'AVG(valor_total)', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Clientes Únicos', format: 'number', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'COUNT_DISTINCT(cliente_id)', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Receita Líquida Est.', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'SUM(valor_liquido_estimado)', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Reembolsos', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'SUM(valor_reembolsado)', filters: platformFilters } } },
          ],
        },

        {
          type: 'Div',
          props: { direction: 'row', gap: 12, padding: 16, wrap: true, childGrow: true },
          children: [
            { type: 'KPI', props: { fr: 1, title: 'Taxas de Pedido', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'SUM(taxa_total)', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Fee Rate', format: 'percent', borderless: true, dataQuery: { model: 'ecommerce.pedidos', measure: 'CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Payout Líquido', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.payouts', measure: 'SUM(valor_liquido)', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Envios', format: 'number', borderless: true, dataQuery: { model: 'ecommerce.envios', measure: 'COUNT()', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Frete Custo', format: 'currency', borderless: true, dataQuery: { model: 'ecommerce.envios', measure: 'SUM(frete_custo)', filters: platformFilters } } },
            { type: 'KPI', props: { fr: 1, title: 'Estoque Disponível', format: 'number', borderless: true, dataQuery: { model: 'ecommerce.estoque_saldos', measure: 'SUM(quantidade_disponivel)', filters: platformFilters } } },
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
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'mes', measure: 'SUM(valor_total)', filters: platformFilters, orderBy: { field: 'dimension', dir: 'asc' }, limit: 18 },
                format: 'currency',
                height: 250,
                nivo: { curve: 'monotoneX', area: true },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Pedidos por Status',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'status', measure: 'COUNT()', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 },
                format: 'number',
                height: 250,
                interaction: { clickAsFilter: true, filterField: 'status', storePath: 'filters.status', clearOnSecondClick: true },
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'PieChart',
              props: {
                fr: 1,
                title: 'GMV por Conta',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'canal_conta', measure: 'SUM(valor_total)', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 },
                format: 'currency',
                height: 250,
                interaction: { clickAsFilter: true, filterField: 'canal_conta_id', storePath: 'filters.canal_conta_id', clearOnSecondClick: true },
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
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'loja', measure: 'SUM(valor_total)', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 10 },
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
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'mes', measure: 'SUM(valor_liquido_estimado)', filters: platformFilters, orderBy: { field: 'dimension', dir: 'asc' }, limit: 18 },
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
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'status_pagamento', measure: 'COUNT()', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 },
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
                dataQuery: { model: 'ecommerce.pedido_itens', dimension: 'produto', measure: 'SUM(valor_total)', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 12 },
                format: 'currency',
                height: 260,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Top Produtos por Quantidade',
                dataQuery: { model: 'ecommerce.pedido_itens', dimension: 'produto', measure: 'SUM(quantidade)', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 12 },
                format: 'number',
                height: 260,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Taxas por Tipo',
                dataQuery: { model: 'ecommerce.taxas_pedido', dimension: 'tipo_taxa', measure: 'SUM(valor)', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 10 },
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
                dataQuery: { model: 'ecommerce.payouts', dimension: 'mes', measure: 'SUM(valor_liquido)', filters: platformFilters, orderBy: { field: 'dimension', dir: 'asc' }, limit: 18 },
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
                dataQuery: { model: 'ecommerce.envios', dimension: 'transportadora', measure: 'COUNT()', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 },
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
                dataQuery: { model: 'ecommerce.estoque_saldos', dimension: 'mes', measure: 'SUM(quantidade_disponivel)', filters: platformFilters, orderBy: { field: 'dimension', dir: 'asc' }, limit: 18 },
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
                title: 'Ticket Médio por Conta',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'canal_conta', measure: 'AVG(valor_total)', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 10 },
                format: 'currency',
                height: 220,
                nivo: { layout: 'horizontal' },
              },
            },
            {
              type: 'BarChart',
              props: {
                fr: 1,
                title: 'Clientes Únicos por Loja',
                dataQuery: { model: 'ecommerce.pedidos', dimension: 'loja', measure: 'COUNT_DISTINCT(cliente_id)', filters: platformFilters, orderBy: { field: 'measure', dir: 'desc' }, limit: 10 },
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
                  { icon: 'trendingUp', text: 'Shopee em expansão de volume; manter estoque dos itens de entrada evita perda de conversão.' },
                  { icon: 'sparkles', text: 'Mix com ticket menor pede atenção no fee rate para proteger margem líquida.' },
                  { icon: 'triangleAlert', text: 'Atrasos logísticos em picos promocionais tendem a elevar cancelamento e reembolso.' },
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
