export const APPS_CRM_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_crm_template_dsl">
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
    <Header title="Dashboard de CRM" subtitle="Pipeline, conversão e origem de leads" direction="row" justify="between" align="center">
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
      <KPI title="Pipeline (R$)" valuePath="crm.kpis.faturamento" format="currency">
      </KPI>
      <KPI title="Vendas" valuePath="crm.kpis.vendas" format="number">
      </KPI>
      <KPI title="Oportunidades" valuePath="crm.kpis.oportunidades" format="number">
      </KPI>
      <KPI title="Leads" valuePath="crm.kpis.totalLeads" format="number">
      </KPI>
      <KPI title="Conversão" valuePath="crm.kpis.taxaConversao" format="number" unit="%">
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={2} title="Pipeline por Vendedor" format="currency" height={240}>
        <Query>
          SELECT
                      COALESCE(src.vendedor_id::text, '-') AS key,
                      COALESCE(src.vendedor_id::text, '-') AS label,
                      SUM(valor_estimado) AS value
                    FROM crm.oportunidades src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <Chart type="bar" fr={2} title="Pipeline por Fase" format="currency" height={240}>
        <Query>
          SELECT
                      '-'::text AS key,
                      '-'::text AS label,
                      SUM(valor_estimado) AS value
                    FROM crm.oportunidades src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
                "icon": "trendingUp",
                "text": "Volume e taxa de conversão ficam mais claros quando segmentados por origem e fase do pipeline."
              },
              {
                "icon": "users",
                "text": "Distribuição por vendedor ajuda a identificar gargalos de follow-up e cobertura comercial."
              },
              {
                "icon": "lightbulb",
                "text": "Leads com recorrência em fases iniciais podem indicar ajuste de qualificação."
              }
            ]
          }
        </Config>
      </AISummary>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="pie" fr={1} title="Leads por Origem" format="number" height={260}>
        <Query>
          SELECT
                      COALESCE(src.origem_id::text, '-') AS key,
                      COALESCE(src.origem_id::text, '-') AS label,
                      COUNT(*) AS value
                    FROM crm.leads src
                    WHERE
                          ({{de}}::date IS NULL OR src.criado_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.criado_em::date <= {{ate}}::date)
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
      <Chart type="line" fr={2} title="Pipeline Mensal" format="currency" height={260}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_prevista), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_prevista), 'YYYY-MM'))::text AS label,
                      SUM(valor_estimado) AS value
                    FROM crm.oportunidades src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Oportunidades por Status" format="number" height={230}>
        <Query>
          SELECT
                      COALESCE(src.status::text, '-') AS key,
                      COALESCE(src.status::text, '-') AS label,
                      COUNT(*) AS value
                    FROM crm.oportunidades src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <Chart type="bar" fr={1} title="Leads por Responsável" format="number" height={230}>
        <Query>
          SELECT
                      COALESCE(src.responsavel_id::text, '-') AS key,
                      COALESCE(src.responsavel_id::text, '-') AS label,
                      COUNT(*) AS value
                    FROM crm.leads src
                    WHERE
                          ({{de}}::date IS NULL OR src.criado_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.criado_em::date <= {{ate}}::date)
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
      <Chart type="bar" fr={1} title="Pipeline por Conta" format="currency" height={230}>
        <Query>
          SELECT
                      COALESCE(src.conta_id::text, '-') AS key,
                      COALESCE(src.conta_id::text, '-') AS label,
                      SUM(valor_estimado) AS value
                    FROM crm.oportunidades src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <Chart type="bar" fr={1} title="Ticket Estimado por Vendedor" format="currency" height={230}>
        <Query>
          SELECT
                      COALESCE(src.vendedor_id::text, '-') AS key,
                      COALESCE(src.vendedor_id::text, '-') AS label,
                      AVG(valor_estimado) AS value
                    FROM crm.oportunidades src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <Chart type="line" fr={2} title="Leads por Mês" format="number" height={230}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', criado_em), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', criado_em), 'YYYY-MM'))::text AS label,
                      COUNT(*) AS value
                    FROM crm.leads src
                    WHERE
                          ({{de}}::date IS NULL OR src.criado_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.criado_em::date <= {{ate}}::date)
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
      <Chart type="pie" fr={1} title="Pipeline por Origem" format="currency" height={230}>
        <Query>
          SELECT
                      COALESCE(src.origem_id::text, '-') AS key,
                      COALESCE(src.origem_id::text, '-') AS label,
                      SUM(valor_estimado) AS value
                    FROM crm.oportunidades src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
    </Div>
  </Theme>
</DashboardTemplate>`
