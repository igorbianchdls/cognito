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
    <Header title="Dashboard de Compras" subtitle="Principais indicadores e cortes" direction="row" justify="between" align="center">
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
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Title text="Gasto" />
            <KPI format="currency">
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
          </Container>
          <Icon name="circle-dollar-sign" size={18} padding={10} radius={10} backgroundColor="#e8f0fe" color="#1d4ed8" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Title text="Fornecedores" />
            <KPI format="number">
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
          </Container>
          <Icon name="users" size={18} padding={10} radius={10} backgroundColor="#ecfdf3" color="#047857" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Title text="Pedidos" />
            <KPI format="number">
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
          </Container>
          <Icon name="shopping-cart" size={18} padding={10} radius={10} backgroundColor="#fff7ed" color="#c2410c" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Title text="Transações" />
            <KPI format="number">
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
          </Container>
          <Icon name="activity" size={18} padding={10} radius={10} backgroundColor="#f3e8ff" color="#7c3aed" />
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Title text="Fornecedores" marginBottom={8} />
          <Chart type="bar" format="currency" height={240}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Centros de Custo" marginBottom={8} />
          <Chart type="bar" format="currency" height={240}>
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
        </Card>
      </Container>
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
      <Container grow={1}>
        <Card>
          <Title text="Filiais" marginBottom={8} />
          <Chart type="bar" format="currency" height={240}>
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
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Title text="Categorias" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Projetos" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Status (Qtd)" marginBottom={8} />
          <Chart type="bar" format="number" height={220}>
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
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Title text="Status (Pizza)" marginBottom={8} />
          <Chart type="pie" format="number" height={260}>
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
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Title text="Gasto por Mês" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Pedidos por Mês" marginBottom={8} />
          <Chart type="bar" format="number" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Ticket Médio por Mês" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Insights da IA" marginBottom={8} />
          <AISummary>
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
        </Card>
      </Container>
    </Container>
  </Theme>
</DashboardTemplate>`
