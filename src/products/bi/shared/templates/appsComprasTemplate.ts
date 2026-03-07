export const APPS_COMPRAS_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_compras_template_dsl">
  <Theme name="light">
    <Config>
      {
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
    </Config>
    <Header title="Dashboard de Compras" subtitle="Principais indicadores e cortes" align="center" controlsPosition="right">
      <DatePicker visible mode="range" position="right" storePath="filters.dateRange">
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
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <KPI title="Gasto" format="currency">
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI title="Fornecedores" format="number">
        <Query>
          SELECT
            COUNT(DISTINCT src.fornecedor_id)::int AS value
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
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI title="Pedidos" format="number">
        <Query>
          SELECT
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
        </Query>
        <DataQuery yField="value" />
        <Config>
          {
            "valueStyle": {
              "fontSize": 22
            }
          }
        </Config>
      </KPI>
      <KPI title="Transações" format="number">
        <Query>
          SELECT
            COUNT(DISTINCT r.id)::int AS value
          FROM compras.recebimentos r
          JOIN compras.compras src ON src.id = r.compra_id
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
        </Query>
        <DataQuery yField="value" />
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Fornecedores" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Centros de Custo" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <SlicerCard fr={1} title="Filtro Centro de Custo">
        <Config>
          {
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
        </Config>
      </SlicerCard>
      <Chart type="bar" fr={1} title="Filiais" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Categorias" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Projetos" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Status (Qtd)" format="number" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
    </Div>
    <Chart type="pie" fr={1} title="Status (Pizza)" format="number" height={260}>
      <Query>
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
      </Query>
      <Fields x="label" y="value" key="key" />
      <Nivo innerRadius={0.35} />
      <Config>
        {
          "dataQuery": {
            "filters": {},
            "limit": 8
          }
        }
      </Config>
    </Chart>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Gasto por Mês" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Pedidos por Mês" format="number" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Ticket Médio por Mês" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <AISummary fr={1} title="Insights da IA">
        <Config>
          {
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
        </Config>
      </AISummary>
    </Div>
  </Theme>
</DashboardTemplate>`
