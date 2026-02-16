export const APPS_HOME_TEMPLATE_TEXT = JSON.stringify([
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
            cornerSize: 14,
            cornerWidth: 1
          }
        }
      }
    },
    children: [
      { type: "Header", props: { title: "Dashboard (Dados Reais)", subtitle: "Vendas, Compras e Financeiro", align: "center", datePicker: { visible: true, mode: "range", position: "right", storePath: "filters.dateRange", actionOnChange: { type: "refresh_data" }, style: { padding: 6, fontFamily: "Barlow", fontSize: 12 } }, slicers: [
        { label: "Status", type: "tile", storePath: "filters.status", clearable: true, source: { type: 'static', options: [
          { value: 'aberto', label: 'Aberto' }, { value: 'fechado', label: 'Fechado' }, { value: 'atrasado', label: 'Atrasado' }
        ] } },
        { label: "Filiais", type: "tile-multi", storePath: "filters.filiais", clearable: true, source: { type: 'static', options: [
          { value: 'matriz', label: 'Matriz' }, { value: 'filial-1', label: 'Filial 1' }, { value: 'filial-2', label: 'Filial 2' }
        ] } }
      ] } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "KPI", props: { title: "Recebidos (Período)", valuePath: "financeiro.kpis.recebidos_mes", format: "currency", titleStyle: { fontWeight: 600, fontSize: 12, color: "#64748b" }, valueStyle: { fontWeight: 700, fontSize: 24, color: "#0f172a" } } },
        { type: "KPI", props: { title: "Pagos (Período)", valuePath: "financeiro.kpis.pagos_mes", format: "currency" } },
        { type: "KPI", props: { title: "Geração de Caixa", valuePath: "financeiro.kpis.geracao_caixa", format: "currency", valueStyle: { fontSize: 22 } } }
      ]},
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { title: "AP por Fornecedor", dataQuery: { model: "financeiro.contas_pagar", dimension: "fornecedor", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { title: "AR por Centro de Lucro", dataQuery: { model: "financeiro.contas_receber", dimension: "centro_lucro", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { title: "Títulos (por Valor)", dataQuery: { model: "financeiro.contas_pagar", dimension: "titulo", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
      ]},
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "Card", props: { title: "AP por Centro de Custo" }, children: [
          { type: "BarChart", props: { title: "Centros de Custo", dataQuery: { model: "financeiro.contas_pagar", dimension: "centro_custo", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "AP por Categoria (Despesa)" }, children: [
          { type: "BarChart", props: { title: "Categorias de Despesa", dataQuery: { model: "financeiro.contas_pagar", dimension: "categoria_despesa", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "AP por Departamento" }, children: [
          { type: "BarChart", props: { title: "Departamentos", dataQuery: { model: "financeiro.contas_pagar", dimension: "departamento", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]}
      ]},
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "Card", props: { title: "AR por Categoria (Receita)" }, children: [
          { type: "BarChart", props: { title: "Categorias de Receita", dataQuery: { model: "financeiro.contas_receber", dimension: "categoria_receita", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "AP por Filial" }, children: [
          { type: "BarChart", props: { title: "Filiais", dataQuery: { model: "financeiro.contas_pagar", dimension: "filial", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "AP por Unidade de Negócio" }, children: [
          { type: "BarChart", props: { title: "Unidades de Negócio", dataQuery: { model: "financeiro.contas_pagar", dimension: "unidade_negocio", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]}
      ]},
      { type: "PieChart", props: { title: "Canais de Venda", dataQuery: { model: "vendas.pedidos", dimension: "canal_venda", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { innerRadius: 0.3 } } },
      { type: "BarChart", props: { title: "Gasto por Fornecedor", dataQuery: { model: "compras.compras", dimension: "fornecedor", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 200 } }
    ]
  }
], null, 2);
