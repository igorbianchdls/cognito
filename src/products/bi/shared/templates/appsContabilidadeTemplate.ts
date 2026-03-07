export const APPS_CONTABILIDADE_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_contabilidade_template_dsl">
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
    <Header title="Dashboard Contabilidade" subtitle="Razao contabil, saldos e distribuicoes por conta" direction="row" justify="between" align="center">
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
      <KPI title="Debitos no Periodo" format="currency">
        <Query>
          SELECT
            SUM(debito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI title="Creditos no Periodo" format="currency">
        <Query>
          SELECT
            SUM(credito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI title="Saldo (D-C)" format="currency">
        <Query>
          SELECT
            SUM(debito - credito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI title="Lancamentos" format="number">
        <Query>
          SELECT
            COUNT(DISTINCT lancamento_id) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI title="Linhas Contabeis" format="number">
        <Query>
          SELECT
            COUNT(*) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI title="Contas Movimentadas" format="number">
        <Query>
          SELECT
            COUNT(DISTINCT conta_id) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
      <Chart type="bar" fr={1} title="Debitos por Tipo de Conta" format="currency" height={240}>
        <Query>
          SELECT
                      COALESCE(src.tipo_conta::text, '-') AS key,
                      COALESCE(src.tipo_conta::text, '-') AS label,
                      SUM(debito) AS value
                    FROM contabilidade.lancamentos_contabeis_linhas src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
      <Chart type="bar" fr={1} title="Creditos por Tipo de Conta" format="currency" height={240}>
        <Query>
          SELECT
                      COALESCE(src.tipo_conta::text, '-') AS key,
                      COALESCE(src.tipo_conta::text, '-') AS label,
                      SUM(credito) AS value
                    FROM contabilidade.lancamentos_contabeis_linhas src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
                "icon": "brain",
                "text": "Lançamentos concentrados em poucas contas podem mascarar variações sazonais do período."
              },
              {
                "icon": "activity",
                "text": "Compare débitos e créditos por conta antes de analisar saldo consolidado mensal."
              },
              {
                "icon": "triangleAlert",
                "text": "Diferenças de classificação contábil costumam aparecer primeiro nas contas analíticas."
              }
            ]
          }
        </Config>
      </AISummary>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Top Contas (Debito)" format="currency" height={260}>
        <Query>
          SELECT
                      COALESCE(src.conta_id::text, '-') AS key,
                      COALESCE(src.conta_id::text, '-') AS label,
                      SUM(debito) AS value
                    FROM contabilidade.lancamentos_contabeis_linhas src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 10
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Top Contas (Credito)" format="currency" height={260}>
        <Query>
          SELECT
                      COALESCE(src.conta_id::text, '-') AS key,
                      COALESCE(src.conta_id::text, '-') AS label,
                      SUM(credito) AS value
                    FROM contabilidade.lancamentos_contabeis_linhas src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 10
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="line" fr={1} title="Debitos por Mes" format="currency" height={240}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_lancamento), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_lancamento), 'YYYY-MM'))::text AS label,
                      SUM(debito) AS value
                    FROM contabilidade.lancamentos_contabeis_linhas src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 24
            }
          }
        </Config>
      </Chart>
      <Chart type="line" fr={1} title="Creditos por Mes" format="currency" height={240}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_lancamento), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_lancamento), 'YYYY-MM'))::text AS label,
                      SUM(credito) AS value
                    FROM contabilidade.lancamentos_contabeis_linhas src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 24
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="pie" fr={1} title="Origem dos Lancamentos" format="number" height={260}>
        <Query>
          SELECT
                      COALESCE(src.origem::text, '-') AS key,
                      COALESCE(src.origem::text, '-') AS label,
                      COUNT(DISTINCT lancamento_id) AS value
                    FROM contabilidade.lancamentos_contabeis_linhas src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
      <Chart type="bar" fr={1} title="Saldo por Conta (D-C)" format="currency" height={260}>
        <Query>
          SELECT
                      COALESCE(src.conta_id::text, '-') AS key,
                      COALESCE(src.conta_id::text, '-') AS label,
                      SUM(debito - credito) AS value
                    FROM contabilidade.lancamentos_contabeis_linhas src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 10
            }
          }
        </Config>
      </Chart>
    </Div>
  </Theme>
</DashboardTemplate>`
