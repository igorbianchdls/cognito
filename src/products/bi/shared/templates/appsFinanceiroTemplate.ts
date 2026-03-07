export const APPS_FINANCEIRO_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_financeiro_template_dsl">
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
    <Header title="Dashboard Financeiro" subtitle="Contas a pagar, receber e fluxo do período" align="center" controlsPosition="right">
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
      <KPI title="Recebidos" valuePath="financeiro.kpis.recebidos_mes" format="currency">
      </KPI>
      <KPI title="Pagos" valuePath="financeiro.kpis.pagos_mes" format="currency">
      </KPI>
      <KPI title="Geração de Caixa" valuePath="financeiro.kpis.geracao_caixa" format="currency">
      </KPI>
      <KPI title="Títulos em AP" format="number">
        <Query>
          SELECT
            COUNT(*) AS value
          FROM financeiro.contas_pagar src
          WHERE
                ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
        </Query>
        <DataQuery yField="value" />
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="AP por Fornecedor" format="currency" height={240}>
        <Query>
          SELECT
                      COALESCE(src.fornecedor_id::text, '-') AS key,
                      COALESCE(src.fornecedor_id::text, '-') AS label,
                      SUM(valor) AS value
                    FROM financeiro.contas_pagar src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
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
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="AP por Categoria" format="currency" height={240}>
        <Query>
          SELECT
                      COALESCE(src.categoria_despesa_id::text, '-') AS key,
                      COALESCE(src.categoria_despesa_id::text, '-') AS label,
                      SUM(valor) AS value
                    FROM financeiro.contas_pagar src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
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
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="AR por Cliente" format="currency" height={240}>
        <Query>
          SELECT
                      COALESCE(src.cliente_id::text, '-') AS key,
                      COALESCE(src.cliente_id::text, '-') AS label,
                      SUM(valor) AS value
                    FROM financeiro.contas_receber src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
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
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="line" fr={1} title="Contas a Receber por Mês" format="currency" height={240}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_vencimento), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_vencimento), 'YYYY-MM'))::text AS label,
                      SUM(valor) AS value
                    FROM financeiro.contas_receber src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
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
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Status de AP" format="number" height={240}>
        <Query>
          SELECT
                      COALESCE(src.status::text, '-') AS key,
                      COALESCE(src.status::text, '-') AS label,
                      COUNT(*) AS value
                    FROM financeiro.contas_pagar src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
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
              "filters": {},
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <AISummary fr={1} title="Insights da IA">
        <Config>
          {
            "items": [
              {
                "icon": "circledollarsign",
                "text": "Compare recebimentos e pagamentos para antecipar pressão de caixa no período."
              },
              {
                "icon": "trendingUp",
                "text": "Distribuições por status e fornecedor ajudam a priorizar ações operacionais."
              },
              {
                "icon": "triangleAlert",
                "text": "Títulos vencidos ou concentrados por data podem distorcer a visão semanal."
              }
            ]
          }
        </Config>
      </AISummary>
    </Div>
  </Theme>
</DashboardTemplate>`
