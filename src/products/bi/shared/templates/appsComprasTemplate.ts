import { migrateTemplateDataQueries } from '@/products/bi/shared/templates/dataQuerySqlMigration'
import { BiSlicers } from '@/products/bi'

const fornecedorOptionsSource = BiSlicers.createOptionsSource('compras.compras', 'fornecedor_id', 100)
const centroCustoOptionsSource = BiSlicers.createOptionsSource('compras.compras', 'centro_custo_id', 100)

export const APPS_COMPRAS_TEMPLATE_TEXT = JSON.stringify(migrateTemplateDataQueries([
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
            cornerSize: 8,
            cornerWidth: 1
          }
        }
      }
    },
    children: [
      { type: "Header", props: { title: "Dashboard de Compras", subtitle: "Principais indicadores e cortes", align: "center", controlsPosition: "right", datePicker: { visible: true, mode: "range", position: "right", storePath: "filters.dateRange", actionOnChange: { type: "refresh_data" }, style: { padding: 6, fontFamily: "Barlow", fontSize: 12 } } } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "KPI", props: { title: "Gasto", format: "currency", dataQuery: { model: "compras.compras", measure: "SUM(valor_total)", filters: {} } } },
        { type: "KPI", props: { title: "Fornecedores", format: "number", dataQuery: { model: "compras.compras", measure: "COUNT_DISTINCT(fornecedor_id)", filters: {} } } },
        { type: "KPI", props: { title: "Pedidos", format: "number", dataQuery: { model: "compras.compras", measure: "COUNT_DISTINCT(id)", filters: {} }, valueStyle: { fontSize: 22 } } },
        { type: "KPI", props: { title: "Transações", format: "number", dataQuery: { model: "compras.recebimentos", measure: "COUNT()", filters: {} } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Fornecedores", dataQuery: { model: "compras.compras", dimension: "fornecedor", measure: "SUM(valor_total)", filters: {}, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Centros de Custo", dataQuery: { model: "compras.compras", dimension: "centro_custo", measure: "SUM(valor_total)", filters: {}, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "SlicerCard", props: { fr: 1, title: "Filtro Centro de Custo", fields: [
          { label: "Centro de Custo", type: "list", storePath: "filters.centro_custo_id", source: centroCustoOptionsSource, selectAll: true, search: true }
        ] } },
        { type: "BarChart", props: { fr: 1, title: "Filiais", dataQuery: { model: "compras.compras", dimension: "filial", measure: "SUM(valor_total)", filters: {}, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Categorias", dataQuery: { model: "compras.compras", dimension: "categoria_despesa", measure: "SUM(valor_total)", filters: {}, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Projetos", dataQuery: { model: "compras.compras", dimension: "projeto", measure: "SUM(valor_total)", filters: {}, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Status (Qtd)", dataQuery: { model: "compras.compras", dimension: "status", measure: "COUNT()", filters: {}, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "number", height: 220, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "PieChart", props: { fr: 1, title: "Status (Pizza)", dataQuery: { model: "compras.compras", dimension: "status", measure: "COUNT()", filters: {}, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "number", height: 260, nivo: { innerRadius: 0.35 } } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Gasto por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "SUM(valor_total)", filters: { de: "1900-01-01", ate: "2100-12-31" }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 220, nivo: { layout: 'vertical' } } },
        { type: "BarChart", props: { fr: 1, title: "Pedidos por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "COUNT()", filters: { de: "1900-01-01", ate: "2100-12-31" }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "number", height: 220, nivo: { layout: 'vertical' } } },
        { type: "BarChart", props: { fr: 1, title: "Ticket Médio por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "AVG(valor_total)", filters: { de: "1900-01-01", ate: "2100-12-31" }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 220, nivo: { layout: 'vertical' } } }
        ,{ type: "AISummary", props: { fr: 1, title: "Insights da IA", items: [
          { icon: "shoppingCart", text: "Compras concentradas por fornecedor podem aumentar risco de negociação e prazo." },
          { icon: "lightbulb", text: "Centros de custo com maior recorrência merecem revisão de contratos e limites." },
          { icon: "triangleAlert", text: "Itens sem recebimento ou com atraso tendem a impactar o fluxo do período." }
        ] } }
      ]}
    ]
  }
]), null, 2);
