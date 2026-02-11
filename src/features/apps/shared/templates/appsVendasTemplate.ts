export const APPS_VENDAS_TEMPLATE_TEXT = JSON.stringify([
  {
    type: "Theme",
    props: {
      name: "light",
      managers: {
        border: {
          style: "solid",
          width: 1,
          color: "#bfc9d9",
          radius: 8,
          frame: {
            variant: "hud",
            baseColor: "#bfc9d9",
            cornerColor: "#6f89aa",
            cornerSize: 14,
            cornerWidth: 1
          }
        }
      }
    },
    children: [
      { type: "Header", props: { title: "Dashboard de Vendas", subtitle: "Principais indicadores e cortes", align: "center", controlsPosition: "right", datePicker: { visible: true, mode: "range", position: "right", storePath: "filters.dateRange", actionOnChange: { type: "refresh_data" }, style: { padding: 6, fontFamily: "Barlow", fontSize: 12 } } } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "KPI", props: { fr: 1, title: "Vendas", format: "currency", borderless: true, dataQuery: { model: "vendas.pedidos", measure: "SUM(p.valor_total)", filters: { tenant_id: 1 } } } },
        { type: "KPI", props: { fr: 1, title: "Pedidos", format: "number", borderless: true, dataQuery: { model: "vendas.pedidos", measure: "COUNT()", filters: { tenant_id: 1 } } } },
        { type: "KPI", props: { fr: 1, title: "Ticket Médio", format: "currency", borderless: true, dataQuery: { model: "vendas.pedidos", measure: "AVG(p.valor_total)", filters: { tenant_id: 1 } } } },
        { type: "KPI", props: { fr: 1, title: "Margem Bruta", valuePath: "vendas.kpis.margemBruta", format: "currency", borderless: true } },
        { type: "Gauge", props: { fr: 1, title: "Conversão", value: 0.37, format: "percent", size: 140, thickness: 12, indicatorColor: "#10b981" } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "SlicerCard", props: { fr: 1, title: "Filtro de Canais (Tile)", layout: "horizontal", fields: [
          { label: "Canal", type: "tile-multi", storePath: "filters.canal_venda_id", selectAll: true, search: true, clearable: true, source: { type: "api", url: "/api/modulos/vendas/options?field=canal_venda_id&limit=50" } }
        ] } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "PieChart", props: { fr: 1, title: "Canais", dataQuery: { model: "vendas.pedidos", dimension: "canal_venda", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 240, nivo: { innerRadius: 0.35 } } },
        { type: "BarChart", props: { fr: 2, title: "Categorias", dataQuery: { model: "vendas.pedidos", dimension: "categoria_receita", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "SlicerCard", props: { fr: 1, title: "Filtro de Canais", fields: [
          { label: "Canal", type: "list", storePath: "filters.canal_venda_id", source: { type: "api", url: "/api/modulos/vendas/options?field=canal_venda_id&limit=50" }, selectAll: true, search: true, clearable: true }
        ] } },
        { type: "BarChart", props: { fr: 2, title: "Clientes", dataQuery: { model: "vendas.pedidos", dimension: "cliente", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 5 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Vendedores", dataQuery: { model: "vendas.pedidos", dimension: "vendedor", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Filiais", dataQuery: { model: "vendas.pedidos", dimension: "filial", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Unidades de Negócio", dataQuery: { model: "vendas.pedidos", dimension: "unidade_negocio", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "LineChart", props: { fr: 3, title: "Faturamento por Mês", dataQuery: { model: "vendas.pedidos", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 240, nivo: { curve: 'monotoneX', area: true } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Pedidos por Mês", dataQuery: { model: "vendas.pedidos", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "number", height: 220, nivo: { layout: 'vertical' } } },
        { type: "BarChart", props: { fr: 1, title: "Ticket Médio por Mês", dataQuery: { model: "vendas.pedidos", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "AVG(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 220, nivo: { layout: 'vertical' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Territórios", dataQuery: { model: "vendas.pedidos", dimension: "territorio", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Serviços/Categorias", dataQuery: { model: "vendas.pedidos", dimension: "categoria_receita", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Pedidos", dataQuery: { model: "vendas.pedidos", dimension: "canal_venda", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "number", height: 220, nivo: { layout: 'horizontal' } } }
      ]}
    ]
  }
], null, 2);
