export const APPS_ESTOQUE_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_estoque_template_dsl">
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
    <Header title="Dashboard de Estoque" subtitle="Nível de estoque, movimentações e valor imobilizado" direction="row" justify="between" align="center">
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
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <KPI title="Valor em Estoque" valuePath="estoque.kpis.valor_total_estoque" format="currency">
      </KPI>
      <KPI title="Quantidade Total" valuePath="estoque.kpis.quantidade_total" format="number">
      </KPI>
      <KPI title="Produtos Ativos" valuePath="estoque.kpis.produtos_ativos" format="number">
      </KPI>
      <KPI title="Movimentações" valuePath="estoque.kpis.movimentacoes_periodo" format="number">
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Estoque por Almoxarifado" format="number" height={240}>
        <Query>
          SELECT
                      COALESCE(src.almoxarifado_id::text, '-') AS key,
                      COALESCE(src.almoxarifado_id::text, '-') AS label,
                      SUM(quantidade) AS value
                    FROM estoque.estoques_atual src
                    WHERE
                          ({{de}}::date IS NULL OR src.atualizado_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.atualizado_em::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY value DESC
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
      <Chart type="bar" fr={2} title="Top Produtos por Quantidade" format="number" height={240}>
        <Query>
          SELECT
                      COALESCE(src.produto_id::text, '-') AS key,
                      COALESCE(src.produto_id::text, '-') AS label,
                      SUM(quantidade) AS value
                    FROM estoque.estoques_atual src
                    WHERE
                          ({{de}}::date IS NULL OR src.atualizado_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.atualizado_em::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 10
            }
          }
        </Config>
      </Chart>
      <AISummary fr={1} title="Insights da IA">
        <Config>
          {
            "items": [
              {
                "icon": "package",
                "text": "Itens com maior valor imobilizado merecem monitoramento de giro e cobertura por almoxarifado."
              },
              {
                "icon": "activity",
                "text": "Movimentações por tipo ajudam a separar consumo real de ajustes operacionais."
              },
              {
                "icon": "triangleAlert",
                "text": "Rupturas e excesso costumam aparecer em pontos específicos antes do consolidado."
              }
            ]
          }
        </Config>
      </AISummary>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="pie" fr={1} title="Movimentações por Tipo" format="number" height={260}>
        <Query>
          SELECT
                      COALESCE(src.tipo_movimento::text, '-') AS key,
                      COALESCE(src.tipo_movimento::text, '-') AS label,
                      SUM(quantidade) AS value
                    FROM estoque.movimentacoes src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY value DESC
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
      <Chart type="line" fr={2} title="Valor Movimentado por Mês" format="currency" height={260}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM'))::text AS label,
                      SUM(valor_total) AS value
                    FROM estoque.movimentacoes src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY label ASC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Valor em Estoque por Almoxarifado" format="currency" height={230}>
        <Query>
          SELECT
                      COALESCE(src.almoxarifado_id::text, '-') AS key,
                      COALESCE(src.almoxarifado_id::text, '-') AS label,
                      SUM(valor_total) AS value
                    FROM estoque.estoques_atual src
                    WHERE
                          ({{de}}::date IS NULL OR src.atualizado_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.atualizado_em::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY value DESC
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
      <Chart type="pie" fr={1} title="Movimentações por Natureza" format="number" height={230}>
        <Query>
          SELECT
                      '-'::text AS key,
                      '-'::text AS label,
                      SUM(quantidade) AS value
                    FROM estoque.movimentacoes src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY value DESC
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
      <Chart type="bar" fr={1} title="Movimentos por Almoxarifado" format="number" height={230}>
        <Query>
          SELECT
                      COALESCE(src.almoxarifado_id::text, '-') AS key,
                      COALESCE(src.almoxarifado_id::text, '-') AS label,
                      COUNT(*) AS value
                    FROM estoque.movimentacoes src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY value DESC
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
      <Chart type="bar" fr={2} title="Top Produtos por Valor Movimentado" format="currency" height={230}>
        <Query>
          SELECT
                      COALESCE(src.produto_id::text, '-') AS key,
                      COALESCE(src.produto_id::text, '-') AS label,
                      SUM(valor_total) AS value
                    FROM estoque.movimentacoes src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 10
            }
          }
        </Config>
      </Chart>
      <Chart type="line" fr={2} title="Quantidade Movimentada por Mês" format="number" height={230}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM'))::text AS label,
                      SUM(quantidade) AS value
                    FROM estoque.movimentacoes src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY label ASC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="SKUs por Almoxarifado" format="number" height={230}>
        <Query>
          SELECT
                      COALESCE(src.almoxarifado_id::text, '-') AS key,
                      COALESCE(src.almoxarifado_id::text, '-') AS label,
                      COUNT(*) AS value
                    FROM estoque.estoques_atual src
                    WHERE
                          ({{de}}::date IS NULL OR src.atualizado_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.atualizado_em::date <= {{ate}}::date)
                    GROUP BY 1, 2
                    ORDER BY value DESC
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
  </Theme>
</DashboardTemplate>`
