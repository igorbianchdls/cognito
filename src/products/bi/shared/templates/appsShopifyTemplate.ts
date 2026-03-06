export const APPS_SHOPIFY_TEMPLATE_DSL = String.raw`<dashboard-template name="apps_shopify_template_dsl">
  <theme>
    <props>
      {
        "name": "light",
        "managers": {
          "border": {
            "style": "solid",
            "width": 1,
            "color": "#bfc9d9",
            "radius": 10,
            "frame": {
              "variant": "hud",
              "cornerSize": 8,
              "cornerWidth": 1
            }
          },
          "color": {
            "scheme": [
              "#95BF47",
              "#5E8E3E",
              "#008060",
              "#38BDF8",
              "#F59E0B"
            ]
          }
        }
      }
    </props>
    <header>
      <props>
        {
          "title": "Dashboard Shopify",
          "subtitle": "E-commerce • Vendas, logística, financeiro e estoque",
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
          "wrap": true,
          "childGrow": true,
          "justify": "start",
          "align": "start"
        }
      </props>
      <slicer-card>
        <props>
          {
            "fr": 1,
            "title": "Filtro de Contas",
            "fields": [
              {
                "label": "Conta",
                "type": "list",
                "storePath": "filters.canal_conta_id",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "canal_conta_id",
                  "pageSize": 80,
                  "dependsOn": [
                    "filters.plataforma"
                  ]
                }
              }
            ]
          }
        </props>
      </slicer-card>
      <slicer-card>
        <props>
          {
            "fr": 1,
            "title": "Filtro de Lojas",
            "fields": [
              {
                "label": "Loja",
                "type": "list",
                "storePath": "filters.loja_id",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "loja_id",
                  "pageSize": 80,
                  "dependsOn": [
                    "filters.plataforma",
                    "filters.canal_conta_id"
                  ]
                }
              }
            ]
          }
        </props>
      </slicer-card>
      <slicer-card>
        <props>
          {
            "fr": 1,
            "title": "Status do Pedido",
            "fields": [
              {
                "label": "Status",
                "type": "list",
                "storePath": "filters.status",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "status",
                  "pageSize": 40,
                  "dependsOn": [
                    "filters.plataforma",
                    "filters.canal_conta_id",
                    "filters.loja_id"
                  ]
                }
              }
            ]
          }
        </props>
      </slicer-card>
      <slicer-card>
        <props>
          {
            "fr": 1,
            "title": "Status Pagamento",
            "fields": [
              {
                "label": "Pagamento",
                "type": "list",
                "storePath": "filters.status_pagamento",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "status_pagamento",
                  "pageSize": 40,
                  "dependsOn": [
                    "filters.plataforma",
                    "filters.canal_conta_id",
                    "filters.loja_id"
                  ]
                }
              }
            ]
          }
        </props>
      </slicer-card>
      <slicer-card>
        <props>
          {
            "fr": 1,
            "title": "Status Fulfillment",
            "fields": [
              {
                "label": "Fulfillment",
                "type": "list",
                "storePath": "filters.status_fulfillment",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "status_fulfillment",
                  "pageSize": 40,
                  "dependsOn": [
                    "filters.plataforma",
                    "filters.canal_conta_id",
                    "filters.loja_id"
                  ]
                }
              }
            ]
          }
        </props>
      </slicer-card>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "wrap": true,
          "childGrow": true
        }
      </props>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "GMV",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  SUM(valor_total) AS value\nFROM ecommerce.pedidos src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_fulfillment::text, '') = ANY(\n          string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_pagamento::text, '') = ANY(\n          string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Pedidos",
            "format": "number",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  COUNT(*) AS value\nFROM ecommerce.pedidos src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_fulfillment::text, '') = ANY(\n          string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_pagamento::text, '') = ANY(\n          string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Ticket Médio",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  AVG(valor_total) AS value\nFROM ecommerce.pedidos src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_fulfillment::text, '') = ANY(\n          string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_pagamento::text, '') = ANY(\n          string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Clientes Únicos",
            "format": "number",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  COUNT(DISTINCT cliente_id) AS value\nFROM ecommerce.pedidos src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_fulfillment::text, '') = ANY(\n          string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_pagamento::text, '') = ANY(\n          string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Receita Líquida Est.",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  SUM(valor_liquido_estimado) AS value\nFROM ecommerce.pedidos src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_fulfillment::text, '') = ANY(\n          string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_pagamento::text, '') = ANY(\n          string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Reembolsos",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  SUM(valor_reembolsado) AS value\nFROM ecommerce.pedidos src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_fulfillment::text, '') = ANY(\n          string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_pagamento::text, '') = ANY(\n          string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
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
          "wrap": true,
          "childGrow": true
        }
      </props>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Taxas de Pedido",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  SUM(taxa_total) AS value\nFROM ecommerce.pedidos src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_fulfillment::text, '') = ANY(\n          string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_pagamento::text, '') = ANY(\n          string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Fee Rate",
            "format": "percent",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END AS value\nFROM ecommerce.pedidos src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_fulfillment::text, '') = ANY(\n          string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status_pagamento::text, '') = ANY(\n          string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Payout Líquido",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  SUM(valor_liquido) AS value\nFROM ecommerce.payouts src\nWHERE\n      ({{de}}::date IS NULL OR src.data_pagamento::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_pagamento::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Envios",
            "format": "number",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  COUNT(*) AS value\nFROM ecommerce.envios src\nWHERE\n      ({{de}}::date IS NULL OR src.despachado_em::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.despachado_em::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Frete Custo",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  SUM(frete_custo) AS value\nFROM ecommerce.envios src\nWHERE\n      ({{de}}::date IS NULL OR src.despachado_em::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.despachado_em::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Estoque Disponível",
            "format": "number",
            "borderless": true,
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "query": "SELECT\n  SUM(quantidade_disponivel) AS value\nFROM ecommerce.estoque_saldos src\nWHERE\n      ({{de}}::date IS NULL OR src.snapshot_date::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.snapshot_date::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.canal_conta_id::text, '') = ANY(\n          string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.loja_id::text, '') = ANY(\n          string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.plataforma::text, '') = ANY(\n          string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.status::text, '') = ANY(\n          string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
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
          "wrap": true,
          "childGrow": true
        }
      </props>
      <chart type="line" fr="2" title="GMV por Mês" format="currency" height="250">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM'))::text AS label,
            SUM(valor_total) AS value
          FROM ecommerce.pedidos src
          WHERE
                ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_fulfillment::text, '') = ANY(
                    string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_pagamento::text, '') = ANY(
                    string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY label ASC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo curve="monotoneX" area="true" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 18
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Pedidos por Status" format="number" height="250">
        <query>
          SELECT
            COALESCE(src.status::text, '-') AS key,
            COALESCE(src.status::text, '-') AS label,
            COUNT(*) AS value
          FROM ecommerce.pedidos src
          WHERE
                ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_fulfillment::text, '') = ANY(
                    string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_pagamento::text, '') = ANY(
                    string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="status" store-path="filters.status" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 8
            }
          }
        </props>
      </chart>
      <chart type="pie" fr="1" title="GMV por Conta" format="currency" height="250">
        <query>
          SELECT
            COALESCE(src.canal_conta_id::text, '-') AS key,
            COALESCE(src.canal_conta_id::text, '-') AS label,
            SUM(valor_total) AS value
          FROM ecommerce.pedidos src
          WHERE
                ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_fulfillment::text, '') = ANY(
                    string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_pagamento::text, '') = ANY(
                    string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="canal_conta_id" store-path="filters.canal_conta_id" clear-on-second-click="true" />
        <nivo inner-radius="0.45" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
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
          "wrap": true,
          "childGrow": true
        }
      </props>
      <chart type="bar" fr="1" title="GMV por Loja" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.loja_id::text, '-') AS key,
            COALESCE(src.loja_id::text, '-') AS label,
            SUM(valor_total) AS value
          FROM ecommerce.pedidos src
          WHERE
                ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_fulfillment::text, '') = ANY(
                    string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_pagamento::text, '') = ANY(
                    string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="loja_id" store-path="filters.loja_id" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 10
            }
          }
        </props>
      </chart>
      <chart type="line" fr="1" title="Receita Líquida Est. por Mês" format="currency" height="240">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM'))::text AS label,
            SUM(valor_liquido_estimado) AS value
          FROM ecommerce.pedidos src
          WHERE
                ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_fulfillment::text, '') = ANY(
                    string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_pagamento::text, '') = ANY(
                    string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY label ASC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo curve="monotoneX" area="true" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 18
            }
          }
        </props>
      </chart>
      <chart type="pie" fr="1" title="Status de Pagamento" format="number" height="240">
        <query>
          SELECT
            COALESCE(src.status_pagamento::text, '-') AS key,
            COALESCE(src.status_pagamento::text, '-') AS label,
            COUNT(*) AS value
          FROM ecommerce.pedidos src
          WHERE
                ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_fulfillment::text, '') = ANY(
                    string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_pagamento::text, '') = ANY(
                    string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="status_pagamento" store-path="filters.status_pagamento" clear-on-second-click="true" />
        <nivo inner-radius="0.45" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
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
          "wrap": true,
          "childGrow": true
        }
      </props>
      <chart type="bar" fr="1" title="Top Produtos por Receita" format="currency" height="260">
        <query>
          SELECT
            COALESCE(src.produto_id::text, '-') AS key,
            COALESCE(src.produto_id::text, '-') AS label,
            SUM(valor_total) AS value
          FROM ecommerce.pedido_itens src
          WHERE
                ({{de}}::date IS NULL OR src.created_at::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.created_at::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 12
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Top Produtos por Quantidade" format="number" height="260">
        <query>
          SELECT
            COALESCE(src.produto_id::text, '-') AS key,
            COALESCE(src.produto_id::text, '-') AS label,
            SUM(quantidade) AS value
          FROM ecommerce.pedido_itens src
          WHERE
                ({{de}}::date IS NULL OR src.created_at::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.created_at::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 12
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Taxas por Tipo" format="currency" height="260">
        <query>
          SELECT
            COALESCE(src.tipo_taxa::text, '-') AS key,
            COALESCE(src.tipo_taxa::text, '-') AS label,
            SUM(valor) AS value
          FROM ecommerce.taxas_pedido src
          WHERE
                ({{de}}::date IS NULL OR src.competencia_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.competencia_em::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 10
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
          "wrap": true,
          "childGrow": true
        }
      </props>
      <chart type="line" fr="1" title="Payout Líquido por Mês" format="currency" height="220">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_pagamento), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_pagamento), 'YYYY-MM'))::text AS label,
            SUM(valor_liquido) AS value
          FROM ecommerce.payouts src
          WHERE
                ({{de}}::date IS NULL OR src.data_pagamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pagamento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY label ASC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo curve="monotoneX" area="true" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 18
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Envios por Transportadora" format="number" height="220">
        <query>
          SELECT
            COALESCE(src.transportadora::text, '-') AS key,
            COALESCE(src.transportadora::text, '-') AS label,
            COUNT(*) AS value
          FROM ecommerce.envios src
          WHERE
                ({{de}}::date IS NULL OR src.despachado_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.despachado_em::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 8
            }
          }
        </props>
      </chart>
      <chart type="line" fr="1" title="Estoque Disponível por Mês" format="number" height="220">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', snapshot_date), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', snapshot_date), 'YYYY-MM'))::text AS label,
            SUM(quantidade_disponivel) AS value
          FROM ecommerce.estoque_saldos src
          WHERE
                ({{de}}::date IS NULL OR src.snapshot_date::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.snapshot_date::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY label ASC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo curve="monotoneX" area="true" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 18
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
      <chart type="bar" fr="1" title="Ticket Médio por Conta" format="currency" height="220">
        <query>
          SELECT
            COALESCE(src.canal_conta_id::text, '-') AS key,
            COALESCE(src.canal_conta_id::text, '-') AS label,
            AVG(valor_total) AS value
          FROM ecommerce.pedidos src
          WHERE
                ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_fulfillment::text, '') = ANY(
                    string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_pagamento::text, '') = ANY(
                    string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 10
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Clientes Únicos por Loja" format="number" height="220">
        <query>
          SELECT
            COALESCE(src.loja_id::text, '-') AS key,
            COALESCE(src.loja_id::text, '-') AS label,
            COUNT(DISTINCT cliente_id) AS value
          FROM ecommerce.pedidos src
          WHERE
                ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.canal_conta_id::text, '') = ANY(
                    string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.loja_id::text, '') = ANY(
                    string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.plataforma::text, '') = ANY(
                    string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_fulfillment::text, '') = ANY(
                    string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status_pagamento::text, '') = ANY(
                    string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopify"
              },
              "limit": 10
            }
          }
        </props>
      </chart>
      <ai-summary>
        <props>
          {
            "fr": 1,
            "title": "Insights da IA",
            "containerStyle": {
              "padding": "12px 12px 16px 12px"
            },
            "itemTextStyle": {
              "padding": "0 8px"
            },
            "items": [
              {
                "icon": "trendingUp",
                "text": "Shopify com evolução consistente de receita líquida; ampliar catálogo premium pode aumentar ticket."
              },
              {
                "icon": "sparkles",
                "text": "Recompra e clientes recorrentes sustentam margem melhor que canais de marketplace."
              },
              {
                "icon": "triangleAlert",
                "text": "Custos de frete e reembolso em semanas de pico podem reduzir o resultado final do mês."
              }
            ]
          }
        </props>
      </ai-summary>
    </div>
  </theme>
</dashboard-template>`
