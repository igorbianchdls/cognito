export const APPS_COMPRAS_TEMPLATE_DSL = String.raw`<dashboard-template name="apps_compras_template_dsl">
  <theme>
    <props>
      {
        "name": "light",
        "managers": {
          "border": {
            "style": "solid",
            "width": 1,
            "color": "#bfc9d9",
            "radius": 8,
            "frame": {
              "variant": "hud",
              "cornerSize": 8,
              "cornerWidth": 1
            }
          }
        }
      }
    </props>
    <header>
      <props>
        {
          "title": "Dashboard de Compras",
          "subtitle": "Principais indicadores e cortes",
          "align": "center",
          "controlsPosition": "right",
          "datePicker": {
            "visible": true,
            "mode": "range",
            "position": "right",
            "storePath": "filters.dateRange",
            "actionOnChange": {
              "type": "refresh_data"
            },
            "style": {
              "padding": 6,
              "fontFamily": "Barlow",
              "fontSize": 12
            }
          }
        }
      </props>
    </header>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <kpi>
        <props>
          {
            "title": "Gasto",
            "format": "currency",
            "dataQuery": {
              "query": "SELECT\n  COALESCE(SUM(src.valor_total), 0)::float AS value\nFROM compras.compras src\nWHERE src.tenant_id = {{tenant_id}}\n  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n  AND (\n    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.fornecedor_id::text, '') = ANY(\n      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.centro_custo_id::text, '') = ANY(\n      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.filial_id::text, '') = ANY(\n      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(\n      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.projeto_id::text, '') = ANY(\n      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )",
              "yField": "value",
              "filters": {}
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Fornecedores",
            "format": "number",
            "dataQuery": {
              "query": "SELECT\n  COUNT(DISTINCT src.fornecedor_id)::int AS value\nFROM compras.compras src\nWHERE src.tenant_id = {{tenant_id}}\n  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n  AND (\n    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.fornecedor_id::text, '') = ANY(\n      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.centro_custo_id::text, '') = ANY(\n      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.filial_id::text, '') = ANY(\n      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(\n      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.projeto_id::text, '') = ANY(\n      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )",
              "yField": "value",
              "filters": {}
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Pedidos",
            "format": "number",
            "dataQuery": {
              "query": "SELECT\n  COUNT(DISTINCT src.id)::int AS value\nFROM compras.compras src\nWHERE src.tenant_id = {{tenant_id}}\n  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n  AND (\n    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.fornecedor_id::text, '') = ANY(\n      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.centro_custo_id::text, '') = ANY(\n      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.filial_id::text, '') = ANY(\n      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(\n      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.projeto_id::text, '') = ANY(\n      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )",
              "yField": "value",
              "filters": {}
            },
            "valueStyle": {
              "fontSize": 22
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Transações",
            "format": "number",
            "dataQuery": {
              "query": "SELECT\n  COUNT(DISTINCT r.id)::int AS value\nFROM compras.recebimentos r\nJOIN compras.compras src ON src.id = r.compra_id\nWHERE src.tenant_id = {{tenant_id}}\n  AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n  AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n  AND (\n    NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.fornecedor_id::text, '') = ANY(\n      string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.centro_custo_id::text, '') = ANY(\n      string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.filial_id::text, '') = ANY(\n      string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.categoria_despesa_id::text, '') = ANY(\n      string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )\n  AND (\n    NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n    OR COALESCE(src.projeto_id::text, '') = ANY(\n      string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n    )\n  )",
              "yField": "value",
              "filters": {}
            }
          }
        </props>
      </kpi>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <chart type="bar" fr="1" title="Fornecedores" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.fornecedor_id, 0)::text AS key,
            COALESCE(f.nome_fantasia, '-') AS label,
            COALESCE(SUM(src.valor_total), 0)::float AS value
          FROM compras.compras src
          LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Centros de Custo" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.centro_custo_id, 0)::text AS key,
            COALESCE(cc.nome, '-') AS label,
            COALESCE(SUM(src.valor_total), 0)::float AS value
          FROM compras.compras src
          LEFT JOIN empresa.centros_custo cc ON cc.id = src.centro_custo_id
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
      <slicer-card>
        <props>
          {
            "fr": 1,
            "title": "Filtro Centro de Custo",
            "fields": [
              {
                "label": "Centro de Custo",
                "type": "list",
                "storePath": "filters.centro_custo_id",
                "source": {
                  "type": "options",
                  "model": "compras.compras",
                  "field": "centro_custo_id",
                  "pageSize": 100
                },
                "selectAll": true,
                "search": true
              }
            ]
          }
        </props>
      </slicer-card>
      <chart type="bar" fr="1" title="Filiais" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.filial_id, 0)::text AS key,
            COALESCE(fil.nome, '-') AS label,
            COALESCE(SUM(src.valor_total), 0)::float AS value
          FROM compras.compras src
          LEFT JOIN empresa.filiais fil ON fil.id = src.filial_id
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <chart type="bar" fr="1" title="Categorias" format="currency" height="220">
        <query>
          SELECT
            COALESCE(src.categoria_despesa_id, 0)::text AS key,
            COALESCE(cd.nome, '-') AS label,
            COALESCE(SUM(src.valor_total), 0)::float AS value
          FROM compras.compras src
          LEFT JOIN financeiro.categorias_despesa cd ON cd.id = src.categoria_despesa_id
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Projetos" format="currency" height="220">
        <query>
          SELECT
            COALESCE(src.projeto_id, 0)::text AS key,
            COALESCE(pr.nome, '-') AS label,
            COALESCE(SUM(src.valor_total), 0)::float AS value
          FROM compras.compras src
          LEFT JOIN financeiro.projetos pr ON pr.id = src.projeto_id
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Status (Qtd)" format="number" height="220">
        <query>
          SELECT
            COALESCE(src.status, '-') AS key,
            COALESCE(src.status, '-') AS label,
            COUNT(*)::int AS value
          FROM compras.compras src
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
    </div>
    <chart type="pie" fr="1" title="Status (Pizza)" format="number" height="260">
      <query>
        SELECT
          COALESCE(src.status, '-') AS key,
          COALESCE(src.status, '-') AS label,
          COUNT(*)::int AS value
        FROM compras.compras src
        WHERE src.tenant_id = {{tenant_id}}
          AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
          AND (
            NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
            OR COALESCE(src.fornecedor_id::text, '') = ANY(
              string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
            )
          )
          AND (
            NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
            OR COALESCE(src.centro_custo_id::text, '') = ANY(
              string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
            )
          )
          AND (
            NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
            OR COALESCE(src.filial_id::text, '') = ANY(
              string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
            )
          )
          AND (
            NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
            OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
              string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
            )
          )
          AND (
            NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
            OR COALESCE(src.projeto_id::text, '') = ANY(
              string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
            )
          )
        GROUP BY 1, 2
        ORDER BY 3 DESC
      </query>
      <fields x="label" y="value" key="key" />
      <nivo inner-radius="0.35" />
      <props>
        {
          "dataQuery": {
            "filters": {},
            "limit": 8
          }
        }
      </props>
    </chart>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <chart type="bar" fr="1" title="Gasto por Mês" format="currency" height="220">
        <query>
          SELECT
            TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
            TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
            COALESCE(SUM(src.valor_total), 0)::float AS value
          FROM compras.compras src
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 2 ASC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="vertical" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Pedidos por Mês" format="number" height="220">
        <query>
          SELECT
            TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
            TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
            COUNT(DISTINCT src.id)::int AS value
          FROM compras.compras src
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 2 ASC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="vertical" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Ticket Médio por Mês" format="currency" height="220">
        <query>
          SELECT
            TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
            TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS label,
            COALESCE(AVG(src.valor_total), 0)::float AS value
          FROM compras.compras src
          WHERE src.tenant_id = {{tenant_id}}
            AND ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
            AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
            AND (
              NULLIF(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.fornecedor_id::text, '') = ANY(
                string_to_array(regexp_replace({{fornecedor_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.centro_custo_id::text, '') = ANY(
                string_to_array(regexp_replace({{centro_custo_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.filial_id::text, '') = ANY(
                string_to_array(regexp_replace({{filial_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.categoria_despesa_id::text, '') = ANY(
                string_to_array(regexp_replace({{categoria_despesa_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
            AND (
              NULLIF(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
              OR COALESCE(src.projeto_id::text, '') = ANY(
                string_to_array(regexp_replace({{projeto_id}}::text, '[{}[:space:]]', '', 'g'), ',')
              )
            )
          GROUP BY 1, 2
          ORDER BY 2 ASC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="vertical" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </props>
      </chart>
      <ai-summary>
        <props>
          {
            "fr": 1,
            "title": "Insights da IA",
            "items": [
              {
                "icon": "shoppingCart",
                "text": "Compras concentradas por fornecedor podem aumentar risco de negociação e prazo."
              },
              {
                "icon": "lightbulb",
                "text": "Centros de custo com maior recorrência merecem revisão de contratos e limites."
              },
              {
                "icon": "triangleAlert",
                "text": "Itens sem recebimento ou com atraso tendem a impactar o fluxo do período."
              }
            ]
          }
        </props>
      </ai-summary>
    </div>
  </theme>
</dashboard-template>`
