export const APPS_SHOPEE_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_shopee_template_dsl">
  <Theme name="light">
    <Config>
      {
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
              "#EE4D2D",
              "#FF7337",
              "#16A34A",
              "#0EA5E9",
              "#F59E0B"
            ]
          }
        }
      }
    </Config>
    <Header title="Dashboard Shopee" subtitle="E-commerce • Vendas, logística, financeiro e estoque" direction="row" justify="between" align="center">
      <DatePicker visible mode="range" storePath="filters.dateRange">
        <ActionOnChange type="refresh_data" />
        <Style>
          {
            "padding": 6,
            "fontFamily": "Barlow",
            "fontSize": 12
          }
        </Style>
      </DatePicker>
    </Header>
    <Container direction="row" gap={12} padding={16} wrap justify="start" align="start">
      <SlicerCard fr={1} title="Filtro de Contas">
        <Config>
          {
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
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Filtro de Lojas">
        <Config>
          {
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
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Status do Pedido">
        <Config>
          {
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
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Status Pagamento">
        <Config>
          {
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
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Status Fulfillment">
        <Config>
          {
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
        </Config>
      </SlicerCard>
    </Container>
    <Container direction="row" gap={12} padding={16} wrap>
      <KPI fr={1} title="GMV" format="currency" borderless>
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Pedidos" format="number" borderless>
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Ticket Médio" format="currency" borderless>
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Clientes Únicos" format="number" borderless>
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Receita Líquida Est." format="currency" borderless>
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Reembolsos" format="currency" borderless>
        <Query>
          SELECT
            SUM(valor_reembolsado) AS value
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
    </Container>
    <Container direction="row" gap={12} padding={16} wrap>
      <KPI fr={1} title="Taxas de Pedido" format="currency" borderless>
        <Query>
          SELECT
            SUM(taxa_total) AS value
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Fee Rate" format="percent" borderless>
        <Query>
          SELECT
            CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END AS value
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Payout Líquido" format="currency" borderless>
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Envios" format="number" borderless>
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Frete Custo" format="currency" borderless>
        <Query>
          SELECT
            SUM(frete_custo) AS value
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Estoque Disponível" format="number" borderless>
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "shopee"
            }
          </Filters>
        </DataQuery>
      </KPI>
    </Container>
    <Container direction="row" gap={12} padding={16} wrap>
      <Chart type="line" fr={2} title="GMV por Mês" format="currency" height={250}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 18
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Pedidos por Status" format="number" height={250}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="status" storePath="filters.status" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="pie" fr={1} title="GMV por Conta" format="currency" height={250}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="canal_conta_id" storePath="filters.canal_conta_id" clearOnSecondClick />
        <Nivo innerRadius={0.45} />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
    </Container>
    <Container direction="row" gap={12} padding={16} wrap>
      <Chart type="bar" fr={1} title="GMV por Loja" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="loja_id" storePath="filters.loja_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 10
            }
          }
        </Config>
      </Chart>
      <Chart type="line" fr={1} title="Receita Líquida Est. por Mês" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 18
            }
          }
        </Config>
      </Chart>
      <Chart type="pie" fr={1} title="Status de Pagamento" format="number" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="status_pagamento" storePath="filters.status_pagamento" clearOnSecondClick />
        <Nivo innerRadius={0.45} />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
    </Container>
    <Container direction="row" gap={12} padding={16} wrap>
      <Chart type="bar" fr={1} title="Top Produtos por Receita" format="currency" height={260}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Top Produtos por Quantidade" format="number" height={260}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Taxas por Tipo" format="currency" height={260}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 10
            }
          }
        </Config>
      </Chart>
    </Container>
    <Container direction="row" gap={12} padding={16} wrap>
      <Chart type="line" fr={1} title="Payout Líquido por Mês" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 18
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Envios por Transportadora" format="number" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="line" fr={1} title="Estoque Disponível por Mês" format="number" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 18
            }
          }
        </Config>
      </Chart>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Chart type="bar" fr={1} title="Ticket Médio por Conta" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 10
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Clientes Únicos por Loja" format="number" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "shopee"
              },
              "limit": 10
            }
          }
        </Config>
      </Chart>
      <AISummary fr={1} title="Insights da IA">
        <Config>
          {
            "containerStyle": {
              "padding": "12px 12px 16px 12px"
            },
            "itemTextStyle": {
              "padding": "0 8px"
            },
            "items": [
              {
                "icon": "trendingUp",
                "text": "Shopee em expansão de volume; manter estoque dos itens de entrada evita perda de conversão."
              },
              {
                "icon": "sparkles",
                "text": "Mix com ticket menor pede atenção no fee rate para proteger margem líquida."
              },
              {
                "icon": "triangleAlert",
                "text": "Atrasos logísticos em picos promocionais tendem a elevar cancelamento e reembolso."
              }
            ]
          }
        </Config>
      </AISummary>
    </Container>
  </Theme>
</DashboardTemplate>`
