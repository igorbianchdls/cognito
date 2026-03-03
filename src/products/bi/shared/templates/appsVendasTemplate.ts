import { BiSlicers } from '@/products/bi'

const canalVendaOptionsSource = BiSlicers.createOptionsSource('vendas.pedidos', 'canal_venda_id', 50)

const VENDAS_WHERE = `
WHERE p.tenant_id = {{tenant_id}}
  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
`.trim()

const QUERY_KPI_VENDAS = `
SELECT
  COALESCE(SUM(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
${VENDAS_WHERE}
`.trim()

const QUERY_KPI_PEDIDOS = `
SELECT
  COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
${VENDAS_WHERE}
`.trim()

const QUERY_KPI_TICKET_MEDIO = `
SELECT
  COALESCE(AVG(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
${VENDAS_WHERE}
`.trim()

const QUERY_CANAIS = `
SELECT
  cv.id AS key,
  COALESCE(cv.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_CATEGORIAS = `
SELECT
  cr.id AS key,
  COALESCE(cr.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_CLIENTES = `
SELECT
  c.id AS key,
  COALESCE(c.nome_fantasia, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_VENDEDORES = `
SELECT
  v.id AS key,
  COALESCE(f.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_FILIAIS = `
SELECT
  fil.id AS key,
  COALESCE(fil.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN empresa.filiais fil ON fil.id = p.filial_id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_UNIDADES = `
SELECT
  un.id AS key,
  COALESCE(un.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_TERRITORIOS = `
SELECT
  t.id AS key,
  COALESCE(t.nome, '-') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

const QUERY_FATURAMENTO_MES = `
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(pi.subtotal), 0)::float AS value
FROM vendas.pedidos p
JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 2 ASC
`.trim()

const QUERY_PEDIDOS_MES = `
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 2 ASC
`.trim()

const QUERY_TICKET_MES = `
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COALESCE(AVG(p.valor_total), 0)::float AS value
FROM vendas.pedidos p
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 2 ASC
`.trim()

const QUERY_PEDIDOS_POR_CANAL = `
SELECT
  cv.id AS key,
  COALESCE(cv.nome, '-') AS label,
  COUNT(DISTINCT p.id)::int AS value
FROM vendas.pedidos p
LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
${VENDAS_WHERE}
GROUP BY 1, 2
ORDER BY 3 DESC
`.trim()

export const APPS_VENDAS_TEMPLATE_TEXT = JSON.stringify([
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
          frame: {
            variant: 'hud',
            cornerSize: 8,
            cornerWidth: 1,
          },
        },
      },
    },
    children: [
      { type: 'Header', props: { title: 'Dashboard de Vendas', subtitle: 'Principais indicadores e cortes', align: 'center', controlsPosition: 'right', datePicker: { visible: true, mode: 'range', position: 'right', storePath: 'filters.dateRange', actionOnChange: { type: 'refresh_data' }, style: { padding: 6, fontFamily: 'Barlow', fontSize: 12 } } } },
      { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
        { type: 'KPI', props: { fr: 1, title: 'Vendas', format: 'currency', borderless: true, dataQuery: { query: QUERY_KPI_VENDAS, yField: 'value', filters: {} } } },
        { type: 'KPI', props: { fr: 1, title: 'Pedidos', format: 'number', borderless: true, dataQuery: { query: QUERY_KPI_PEDIDOS, yField: 'value', filters: {} } } },
        { type: 'KPI', props: { fr: 1, title: 'Ticket Médio', format: 'currency', borderless: true, dataQuery: { query: QUERY_KPI_TICKET_MEDIO, yField: 'value', filters: {} } } },
        { type: 'KPI', props: { fr: 1, title: 'Margem Bruta', valuePath: 'vendas.kpis.margemBruta', format: 'currency', borderless: true } },
      ] },

      { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
        { type: 'PieChart', props: { fr: 1, title: 'Canais', dataQuery: { query: QUERY_CANAIS, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 6 }, interaction: { clickAsFilter: true, filterField: 'canal_venda_id', storePath: 'filters.canal_venda_id', clearOnSecondClick: true }, format: 'currency', height: 240, nivo: { innerRadius: 0.35 } } },
        { type: 'BarChart', props: { fr: 2, title: 'Categorias', dataQuery: { query: QUERY_CATEGORIAS, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 6 }, interaction: { clickAsFilter: true, filterField: 'categoria_receita_id', storePath: 'filters.categoria_receita_id', clearOnSecondClick: true }, format: 'currency', height: 240, nivo: { layout: 'horizontal' } } },
        { type: 'SlicerCard', props: { fr: 1, title: 'Filtro de Canais', fields: [
          { label: 'Canal', type: 'list', storePath: 'filters.canal_venda_id', source: canalVendaOptionsSource, selectAll: true, search: true, clearable: true },
        ] } },
        { type: 'BarChart', props: { fr: 2, title: 'Clientes', dataQuery: { query: QUERY_CLIENTES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 5 }, interaction: { clickAsFilter: false }, format: 'currency', height: 240, nivo: { layout: 'horizontal' } } },
      ] },

      { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
        { type: 'BarChart', props: { fr: 1, title: 'Vendedores', dataQuery: { query: QUERY_VENDEDORES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 6 }, interaction: { clickAsFilter: true, filterField: 'vendedor_id', storePath: 'filters.vendedor_id', clearOnSecondClick: true }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
        { type: 'BarChart', props: { fr: 1, title: 'Filiais', dataQuery: { query: QUERY_FILIAIS, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 6 }, interaction: { clickAsFilter: true, filterField: 'filial_id', storePath: 'filters.filial_id', clearOnSecondClick: true }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
        { type: 'BarChart', props: { fr: 1, title: 'Unidades de Negócio', dataQuery: { query: QUERY_UNIDADES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 6 }, interaction: { clickAsFilter: true, filterField: 'unidade_negocio_id', storePath: 'filters.unidade_negocio_id', clearOnSecondClick: true }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
      ] },

      { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
        { type: 'LineChart', props: { fr: 3, title: 'Faturamento por Mês', dataQuery: { query: QUERY_FATURAMENTO_MES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 12 }, interaction: { clickAsFilter: false }, format: 'currency', height: 240, nivo: { curve: 'monotoneX', area: true } } },
      ] },

      { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
        { type: 'BarChart', props: { fr: 1, title: 'Pedidos por Mês', dataQuery: { query: QUERY_PEDIDOS_MES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 12 }, interaction: { clickAsFilter: false }, format: 'number', height: 220, nivo: { layout: 'vertical' } } },
        { type: 'BarChart', props: { fr: 1, title: 'Ticket Médio por Mês', dataQuery: { query: QUERY_TICKET_MES, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 12 }, interaction: { clickAsFilter: false }, format: 'currency', height: 220, nivo: { layout: 'vertical' } } },
        { type: 'AISummary', props: { fr: 1, title: 'Insights da IA', items: [
          { icon: 'trendingUp', text: 'Receita concentrada em poucos clientes; monitore dependência dos top compradores.' },
          { icon: 'sparkles', text: 'Canais com melhor desempenho tendem a manter ticket médio acima da média do período.' },
          { icon: 'triangleAlert', text: 'Quedas em filiais específicas podem distorcer o resultado consolidado do mês.' },
        ] } },
      ] },

      { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
        { type: 'BarChart', props: { fr: 1, title: 'Territórios', dataQuery: { query: QUERY_TERRITORIOS, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 6 }, interaction: { clickAsFilter: true, filterField: 'territorio_id', storePath: 'filters.territorio_id', clearOnSecondClick: true }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
        { type: 'BarChart', props: { fr: 1, title: 'Serviços/Categorias', dataQuery: { query: QUERY_CATEGORIAS, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 6 }, interaction: { clickAsFilter: true, filterField: 'categoria_receita_id', storePath: 'filters.categoria_receita_id', clearOnSecondClick: true }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
        { type: 'BarChart', props: { fr: 1, title: 'Pedidos', dataQuery: { query: QUERY_PEDIDOS_POR_CANAL, xField: 'label', yField: 'value', keyField: 'key', filters: {}, limit: 6 }, interaction: { clickAsFilter: true, filterField: 'canal_venda_id', storePath: 'filters.canal_venda_id', clearOnSecondClick: true }, format: 'number', height: 220, nivo: { layout: 'horizontal' } } },
      ] },
    ],
  },
], null, 2)
