export const APPS_METAADS_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_metaads_template_dsl">
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
              "#1877F2",
              "#00B2FF",
              "#34D399",
              "#F59E0B",
              "#EF4444"
            ]
          }
        }
      }
    </Config>

    <Header direction="row" justify="between" align="center">
      <Container direction="column" gap={4}>
        <Text text="Dashboard Meta Ads" />
        <Text text="Lumi Skin • Performance DTC (campanhas, grupos e anúncios)" />
      </Container>
      <DatePicker visible mode="range" storePath="filters.dateRange" presets={["7d","14d","30d"]}>
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
                "storePath": "filters.conta_id",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "trafegopago.desempenho_diario",
                  "field": "conta_id",
                  "limit": 50
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Filtro de Campanhas">
        <Config>
          {
            "fields": [
              {
                "label": "Campanha",
                "type": "list",
                "storePath": "filters.campanha_id",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "trafegopago.desempenho_diario",
                  "field": "campanha_id",
                  "limit": 100,
                  "dependsOn": ["filters.conta_id"]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Filtro de Grupos">
        <Config>
          {
            "fields": [
              {
                "label": "Grupo",
                "type": "list",
                "storePath": "filters.grupo_id",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "trafegopago.desempenho_diario",
                  "field": "grupo_id",
                  "limit": 100,
                  "dependsOn": ["filters.conta_id", "filters.campanha_id"]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Filtro de Anúncios">
        <Config>
          {
            "fields": [
              {
                "label": "Anúncio",
                "type": "list",
                "storePath": "filters.anuncio_id",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "trafegopago.desempenho_diario",
                  "field": "anuncio_id",
                  "limit": 100,
                  "dependsOn": ["filters.conta_id", "filters.campanha_id", "filters.grupo_id"]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
    </Container>

    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Gasto" />
            <KPI format="currency" resultPath="kpis.gasto" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT COALESCE(SUM(src.gasto), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                ),
                anterior AS (
                  SELECT COALESCE(SUM(src.gasto), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND src.data_ref::date >= {{compare_de}}::date
                    AND src.data_ref::date <= {{compare_ate}}::date
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                )
                SELECT
                  atual.value AS value,
                  anterior.value AS previous_value,
                  CASE WHEN anterior.value = 0 THEN 0 ELSE (((atual.value - anterior.value) / anterior.value) * 100)::float END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.gasto" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#1877F2" fillColor="rgba(24, 119, 242, 0.14)">
              <Query>
                SELECT
                  TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                  COALESCE(SUM(src.gasto), 0)::float AS value
                FROM trafegopago.desempenho_diario src
                WHERE src.tenant_id = {{tenant_id}}
                  AND src.plataforma = 'meta_ads'
                  AND src.nivel = 'campaign'
                  AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                  AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                  AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                  AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                  AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="circle-dollar-sign" size={18} padding={10} radius={10} backgroundColor="#e8f0fe" color="#1d4ed8" />
        </Card>
      </Container>

      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Receita Atribuída" />
            <KPI format="currency" resultPath="kpis.receita" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT COALESCE(SUM(src.receita_atribuida), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                ),
                anterior AS (
                  SELECT COALESCE(SUM(src.receita_atribuida), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND src.data_ref::date >= {{compare_de}}::date
                    AND src.data_ref::date <= {{compare_ate}}::date
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                )
                SELECT
                  atual.value AS value,
                  anterior.value AS previous_value,
                  CASE WHEN anterior.value = 0 THEN 0 ELSE (((atual.value - anterior.value) / anterior.value) * 100)::float END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.receita" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#00B2FF" fillColor="rgba(0, 178, 255, 0.14)">
              <Query>
                SELECT
                  TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                  COALESCE(SUM(src.receita_atribuida), 0)::float AS value
                FROM trafegopago.desempenho_diario src
                WHERE src.tenant_id = {{tenant_id}}
                  AND src.plataforma = 'meta_ads'
                  AND src.nivel = 'campaign'
                  AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                  AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                  AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                  AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                  AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="badge-check" size={18} padding={10} radius={10} backgroundColor="#e6fffb" color="#0f766e" />
        </Card>
      </Container>

      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="ROAS" />
            <KPI format="number" resultPath="kpis.roas" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT
                    COALESCE(SUM(src.gasto), 0)::float AS gasto,
                    COALESCE(SUM(src.receita_atribuida), 0)::float AS receita
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                ),
                anterior AS (
                  SELECT
                    COALESCE(SUM(src.gasto), 0)::float AS gasto,
                    COALESCE(SUM(src.receita_atribuida), 0)::float AS receita
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND src.data_ref::date >= {{compare_de}}::date
                    AND src.data_ref::date <= {{compare_ate}}::date
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                )
                SELECT
                  CASE WHEN atual.gasto = 0 THEN 0 ELSE (atual.receita / atual.gasto)::float END AS value,
                  CASE WHEN anterior.gasto = 0 THEN 0 ELSE (anterior.receita / anterior.gasto)::float END AS previous_value,
                  CASE
                    WHEN (CASE WHEN anterior.gasto = 0 THEN 0 ELSE (anterior.receita / anterior.gasto)::float END) = 0 THEN 0
                    ELSE ((
                      (
                        CASE WHEN atual.gasto = 0 THEN 0 ELSE (atual.receita / atual.gasto)::float END
                      ) - (
                        CASE WHEN anterior.gasto = 0 THEN 0 ELSE (anterior.receita / anterior.gasto)::float END
                      )
                    ) / (
                      CASE WHEN anterior.gasto = 0 THEN 0 ELSE (anterior.receita / anterior.gasto)::float END
                    ) * 100)::float
                  END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.roas" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="number" strokeColor="#34D399" fillColor="rgba(52, 211, 153, 0.16)">
              <Query>
                SELECT
                  TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                  CASE WHEN SUM(src.gasto) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
                FROM trafegopago.desempenho_diario src
                WHERE src.tenant_id = {{tenant_id}}
                  AND src.plataforma = 'meta_ads'
                  AND src.nivel = 'campaign'
                  AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                  AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                  AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                  AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                  AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="activity" size={18} padding={10} radius={10} backgroundColor="#ecfdf3" color="#047857" />
        </Card>
      </Container>

      <Container grow={1}>
        <Card>
          <Text text="Meta de ROAS" />
          <Gauge
            format="number"
            target={4}
            min={0}
            max={4}
            width={220}
            height={128}
            thickness={16}
            valueField="value"
            segments={[
              { from: 0, to: 40, color: '#dc2626' },
              { from: 40, to: 80, color: '#f59e0b' },
              { from: 80, to: 100, color: '#16a34a' }
            ]}
          >
            <Query>
              SELECT
                CASE WHEN SUM(src.gasto) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
              FROM trafegopago.desempenho_diario src
              WHERE src.tenant_id = {{tenant_id}}
                AND src.plataforma = 'meta_ads'
                AND src.nivel = 'campaign'
                AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
            </Query>
          </Gauge>
        </Card>
      </Container>
    </Container>

    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Conversões" />
            <KPI format="number" resultPath="kpis.conversoes" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT COALESCE(SUM(src.conversoes), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                ),
                anterior AS (
                  SELECT COALESCE(SUM(src.conversoes), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND src.data_ref::date >= {{compare_de}}::date
                    AND src.data_ref::date <= {{compare_ate}}::date
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                )
                SELECT
                  atual.value AS value,
                  anterior.value AS previous_value,
                  CASE WHEN anterior.value = 0 THEN 0 ELSE (((atual.value - anterior.value) / anterior.value) * 100)::float END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.conversoes" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="number" strokeColor="#4f46e5" fillColor="rgba(79, 70, 229, 0.14)">
              <Query>
                SELECT
                  TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                  COALESCE(SUM(src.conversoes), 0)::float AS value
                FROM trafegopago.desempenho_diario src
                WHERE src.tenant_id = {{tenant_id}}
                  AND src.plataforma = 'meta_ads'
                  AND src.nivel = 'campaign'
                  AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                  AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                  AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                  AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                  AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="badge-check" size={18} padding={10} radius={10} backgroundColor="#eef2ff" color="#4338ca" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Leads" />
            <KPI format="number" resultPath="kpis.leads" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT COALESCE(SUM(src.leads), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                ),
                anterior AS (
                  SELECT COALESCE(SUM(src.leads), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND src.data_ref::date >= {{compare_de}}::date
                    AND src.data_ref::date <= {{compare_ate}}::date
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                )
                SELECT
                  atual.value AS value,
                  anterior.value AS previous_value,
                  CASE WHEN anterior.value = 0 THEN 0 ELSE (((atual.value - anterior.value) / anterior.value) * 100)::float END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.leads" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="number" strokeColor="#1d4ed8" fillColor="rgba(29, 78, 216, 0.14)">
              <Query>
                SELECT
                  TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                  COALESCE(SUM(src.leads), 0)::float AS value
                FROM trafegopago.desempenho_diario src
                WHERE src.tenant_id = {{tenant_id}}
                  AND src.plataforma = 'meta_ads'
                  AND src.nivel = 'campaign'
                  AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                  AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                  AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                  AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                  AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="shopping-cart" size={18} padding={10} radius={10} backgroundColor="#eff6ff" color="#1d4ed8" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="CTR" />
            <KPI format="percent" resultPath="kpis.ctr" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT
                    COALESCE(SUM(src.cliques), 0)::float AS cliques,
                    COALESCE(SUM(src.impressoes), 0)::float AS impressoes
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                ),
                anterior AS (
                  SELECT
                    COALESCE(SUM(src.cliques), 0)::float AS cliques,
                    COALESCE(SUM(src.impressoes), 0)::float AS impressoes
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND src.data_ref::date >= {{compare_de}}::date
                    AND src.data_ref::date <= {{compare_ate}}::date
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                )
                SELECT
                  CASE WHEN atual.impressoes = 0 THEN 0 ELSE (atual.cliques / atual.impressoes)::float END AS value,
                  CASE WHEN anterior.impressoes = 0 THEN 0 ELSE (anterior.cliques / anterior.impressoes)::float END AS previous_value,
                  CASE
                    WHEN (CASE WHEN anterior.impressoes = 0 THEN 0 ELSE (anterior.cliques / anterior.impressoes)::float END) = 0 THEN 0
                    ELSE ((
                      (
                        CASE WHEN atual.impressoes = 0 THEN 0 ELSE (atual.cliques / atual.impressoes)::float END
                      ) - (
                        CASE WHEN anterior.impressoes = 0 THEN 0 ELSE (anterior.cliques / anterior.impressoes)::float END
                      )
                    ) / (
                      CASE WHEN anterior.impressoes = 0 THEN 0 ELSE (anterior.cliques / anterior.impressoes)::float END
                    ) * 100)::float
                  END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.ctr" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="percent" strokeColor="#c2410c" fillColor="rgba(194, 65, 12, 0.14)">
              <Query>
                SELECT
                  TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                  CASE WHEN SUM(src.impressoes) = 0 THEN 0 ELSE (SUM(src.cliques) / SUM(src.impressoes))::float END AS value
                FROM trafegopago.desempenho_diario src
                WHERE src.tenant_id = {{tenant_id}}
                  AND src.plataforma = 'meta_ads'
                  AND src.nivel = 'campaign'
                  AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                  AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                  AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                  AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                  AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="activity" size={18} padding={10} radius={10} backgroundColor="#fff7ed" color="#c2410c" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="CPA" />
            <KPI format="currency" resultPath="kpis.cpa" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT
                    COALESCE(SUM(src.gasto), 0)::float AS gasto,
                    COALESCE(SUM(src.conversoes), 0)::float AS conversoes
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                ),
                anterior AS (
                  SELECT
                    COALESCE(SUM(src.gasto), 0)::float AS gasto,
                    COALESCE(SUM(src.conversoes), 0)::float AS conversoes
                  FROM trafegopago.desempenho_diario src
                  WHERE src.tenant_id = {{tenant_id}}
                    AND src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND src.data_ref::date >= {{compare_de}}::date
                    AND src.data_ref::date <= {{compare_ate}}::date
                    AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                    AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                    AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                    AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                )
                SELECT
                  CASE WHEN atual.conversoes = 0 THEN 0 ELSE (atual.gasto / atual.conversoes)::float END AS value,
                  CASE WHEN anterior.conversoes = 0 THEN 0 ELSE (anterior.gasto / anterior.conversoes)::float END AS previous_value,
                  CASE
                    WHEN (CASE WHEN anterior.conversoes = 0 THEN 0 ELSE (anterior.gasto / anterior.conversoes)::float END) = 0 THEN 0
                    ELSE ((
                      (
                        CASE WHEN atual.conversoes = 0 THEN 0 ELSE (atual.gasto / atual.conversoes)::float END
                      ) - (
                        CASE WHEN anterior.conversoes = 0 THEN 0 ELSE (anterior.gasto / anterior.conversoes)::float END
                      )
                    ) / (
                      CASE WHEN anterior.conversoes = 0 THEN 0 ELSE (anterior.gasto / anterior.conversoes)::float END
                    ) * 100)::float
                  END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.cpa" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#dc2626" fillColor="rgba(220, 38, 38, 0.12)">
              <Query>
                SELECT
                  TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                  CASE WHEN SUM(src.conversoes) = 0 THEN 0 ELSE (SUM(src.gasto) / SUM(src.conversoes))::float END AS value
                FROM trafegopago.desempenho_diario src
                WHERE src.tenant_id = {{tenant_id}}
                  AND src.plataforma = 'meta_ads'
                  AND src.nivel = 'campaign'
                  AND ({{de}} IS NULL OR src.data_ref::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR src.data_ref::date <= {{ate}}::date)
                  AND ({{conta_id}}::text[] IS NULL OR src.conta_id::text = ANY({{conta_id}}::text[]))
                  AND ({{campanha_id}}::text[] IS NULL OR src.campanha_id::text = ANY({{campanha_id}}::text[]))
                  AND ({{grupo_id}}::text[] IS NULL OR src.grupo_id::text = ANY({{grupo_id}}::text[]))
                  AND ({{anuncio_id}}::text[] IS NULL OR src.anuncio_id::text = ANY({{anuncio_id}}::text[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="circle-dollar-sign" size={18} padding={10} radius={10} backgroundColor="#fef2f2" color="#dc2626" />
        </Card>
      </Container>
    </Container>

    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Text text="Gasto por Mês" marginBottom={8} />
          <Chart type="line" format="currency" height={250}>
            <Interaction clickAsFilter={false} />
            <Nivo curve="monotoneX" area />
            <Config>
              {
                "dataQuery": {
                  "model": "trafegopago.desempenho_diario",
                  "measure": "SUM(gasto)",
                  "filters": {
                    "tenant_id": 1,
                    "plataforma": "meta_ads",
                    "nivel": "campaign"
                  },
                  "dimension": "mes",
                  "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                  "orderBy": {
                    "field": "dimension",
                    "dir": "asc"
                  },
                  "limit": 12
                }
              }
            </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Receita por Mês" marginBottom={8} />
          <Chart type="line" format="currency" height={250}>
            <Interaction clickAsFilter={false} />
            <Nivo curve="monotoneX" area />
            <Config>
              {
                "dataQuery": {
                  "model": "trafegopago.desempenho_diario",
                  "measure": "SUM(receita_atribuida)",
                  "filters": {
                    "tenant_id": 1,
                    "plataforma": "meta_ads",
                    "nivel": "campaign"
                  },
                  "dimension": "mes",
                  "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                  "orderBy": {
                    "field": "dimension",
                    "dir": "asc"
                  },
                  "limit": 12
                }
              }
            </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Lead Rate por Mês" marginBottom={8} />
          <Chart type="bar" format="percent" height={250}>
            <Interaction clickAsFilter={false} />
            <Nivo layout="vertical" />
            <Config>
              {
                "dataQuery": {
                  "model": "trafegopago.desempenho_diario",
                  "measure": "CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(leads)/SUM(cliques) END",
                  "filters": {
                    "tenant_id": 1,
                    "plataforma": "meta_ads",
                    "nivel": "campaign"
                  },
                  "dimension": "mes",
                  "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                  "orderBy": {
                    "field": "dimension",
                    "dir": "asc"
                  },
                  "limit": 12
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
          <Text text="Participação de Gasto por Conta" marginBottom={8} />
          <Chart type="pie" format="currency" height={260}>
            <Interaction clickAsFilter filterField="conta_id" storePath="filters.conta_id" />
            <Nivo innerRadius={0.45} />
            <Config>
              {
                "dataQuery": {
                  "model": "trafegopago.desempenho_diario",
                  "measure": "SUM(gasto)",
                  "filters": {
                    "tenant_id": 1,
                    "plataforma": "meta_ads",
                    "nivel": "campaign"
                  },
                  "dimension": "conta_id",
                  "orderBy": {
                    "field": "measure",
                    "dir": "desc"
                  },
                  "limit": 8
                }
              }
            </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Top Campanhas por Gasto" marginBottom={8} />
          <Chart type="bar" format="currency" height={260}>
            <Interaction clickAsFilter filterField="campanha_id" storePath="filters.campanha_id" clearOnSecondClick />
            <Nivo layout="horizontal" />
            <Config>
              {
                "dataQuery": {
                  "model": "trafegopago.desempenho_diario",
                  "measure": "SUM(gasto)",
                  "filters": {
                    "tenant_id": 1,
                    "plataforma": "meta_ads",
                    "nivel": "campaign"
                  },
                  "dimension": "campanha_id",
                  "orderBy": {
                    "field": "measure",
                    "dir": "desc"
                  },
                  "limit": 8
                }
              }
            </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Top Campanhas por ROAS" marginBottom={8} />
          <Chart type="bar" format="number" height={260}>
            <Interaction clickAsFilter filterField="campanha_id" storePath="filters.campanha_id" clearOnSecondClick />
            <Nivo layout="horizontal" />
            <Config>
              {
                "dataQuery": {
                  "model": "trafegopago.desempenho_diario",
                  "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
                  "filters": {
                    "tenant_id": 1,
                    "plataforma": "meta_ads",
                    "nivel": "campaign"
                  },
                  "dimension": "campanha_id",
                  "orderBy": {
                    "field": "measure",
                    "dir": "desc"
                  },
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
          <Text text="Leituras e alertas" marginBottom={8} />
          <AISummary>
            <Config>
              {
                "items": [
                  {
                    "icon": "trendingUp",
                    "text": "Cruze gasto, receita e ROAS juntos para identificar escalas saudáveis sem mascarar piora de eficiência." 
                  },
                  {
                    "icon": "brain",
                    "text": "Use os filtros por conta, campanha, grupo e anúncio para validar se o desempenho está concentrado em poucos criativos." 
                  },
                  {
                    "icon": "triangleAlert",
                    "text": "Compare CPA, lead rate e conversões no mesmo período para evitar decisões baseadas apenas em volume." 
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
