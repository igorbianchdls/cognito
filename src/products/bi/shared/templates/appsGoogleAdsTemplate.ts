export const APPS_GOOGLEADS_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_googleads_template">
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
              "#4285F4",
              "#34A853",
              "#FBBC05",
              "#EA4335",
              "#1A73E8"
            ]
          }
        }
      }
    </Config>
    <Header title="Dashboard Google Ads" subtitle="Lumi Skin • Search, Shopping e PMax (visão DTC)" align="center" controlsPosition="right">
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
    <Div direction="row" gap={12} padding={16} wrap childGrow justify="start" align="start">
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
                  "dependsOn": [
                    "filters.conta_id"
                  ]
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
                  "dependsOn": [
                    "filters.conta_id",
                    "filters.campanha_id"
                  ]
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
                  "dependsOn": [
                    "filters.conta_id",
                    "filters.campanha_id",
                    "filters.grupo_id"
                  ]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
    </Div>
    <Div direction="row" gap={12} padding={16} wrap childGrow>
      <KPI fr={1} title="Gasto (Campanhas)" format="currency" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="SUM(gasto)">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Receita Atribuída" format="currency" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="SUM(receita_atribuida)">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="ROAS" format="number" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Cliques" format="number" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="SUM(cliques)">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Impressões" format="number" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="SUM(impressoes)">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="Conversões" format="number" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="SUM(conversoes)">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} wrap childGrow>
      <KPI fr={1} title="Leads" format="number" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="SUM(leads)">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="CTR" format="percent" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="CPC" format="currency" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(gasto)/SUM(cliques) END">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="CPM" format="currency" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="CASE WHEN SUM(impressoes)=0 THEN 0 ELSE (SUM(gasto)*1000.0)/SUM(impressoes) END">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="CPA" format="currency" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
      <KPI fr={1} title="CVR" format="percent" borderless>
        <DataQuery model="trafegopago.desempenho_diario" measure="CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END">
          <Filters>
            {
              "tenant_id": 1,
              "plataforma": "google_ads",
              "nivel": "campaign"
            }
          </Filters>
        </DataQuery>
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} wrap childGrow>
      <Chart type="line" fr={1} title="Gasto por Mês" format="currency" height={250}>
        <Interaction clickAsFilter={false} />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(gasto)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="line" fr={1} title="Receita por Mês" format="currency" height={250}>
        <Interaction clickAsFilter={false} />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(receita_atribuida)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="ROAS por Mês" format="number" height={250}>
        <Interaction clickAsFilter={false} />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="CPA por Mês" format="currency" height={250}>
        <Interaction clickAsFilter={false} />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
    </Div>
    <Div direction="row" gap={12} padding={16} wrap childGrow>
      <Chart type="line" fr={1} title="Impressões por Mês" format="number" height={250}>
        <Interaction clickAsFilter={false} />
        <Nivo curve="monotoneX" area={false} />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(impressoes)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="line" fr={1} title="Cliques por Mês" format="number" height={250}>
        <Interaction clickAsFilter={false} />
        <Nivo curve="monotoneX" area={false} />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(cliques)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="CTR por Mês" format="percent" height={250}>
        <Interaction clickAsFilter={false} />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="CVR por Mês" format="percent" height={250}>
        <Interaction clickAsFilter={false} />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
    </Div>
    <Div direction="row" gap={12} padding={16} wrap childGrow>
      <AISummary fr={1} title="Leituras e alertas">
        <Config>
          {
            "colorScheme": [
              "#4285F4",
              "#34A853",
              "#FBBC05",
              "#EA4335",
              "#1A73E8"
            ],
            "itemTextStyle": {
              "padding": "0 8px"
            },
            "containerStyle": {
              "padding": "12px 12px 16px 12px"
            },
            "items": [
              {
                "icon": "badgecheck",
                "text": "Compare ROAS, CTR e CVR em conjunto para separar ganho de tráfego de ganho de intenção/qualidade."
              },
              {
                "icon": "trendingUp",
                "text": "Use filtros por conta/campanha para identificar concentração de gasto em Search, Shopping ou PMax."
              },
              {
                "icon": "triangleAlert",
                "text": "Revise campanhas com alto gasto e ROAS baixo usando a faixa de gasto para priorizar o que realmente pesa no orçamento."
              }
            ]
          }
        </Config>
      </AISummary>
      <Chart type="pie" fr={1} title="Participação de Gasto por Conta (Top 8)" format="currency" height={260}>
        <Interaction clickAsFilter filterField="conta_id" storePath="filters.conta_id" />
        <Nivo innerRadius={0.45} />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(gasto)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="Top Campanhas por Leads" format="number" height={260}>
        <Interaction clickAsFilter filterField="campanha_id" storePath="filters.campanha_id" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(leads)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="Lead Rate por Mês" format="percent" height={260}>
        <Interaction clickAsFilter={false} />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(leads)/SUM(cliques) END",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
    </Div>
    <Div direction="row" gap={12} padding={16} wrap childGrow>
      <Chart type="bar" fr={1} title="Top Campanhas por Gasto" format="currency" height={260}>
        <Interaction clickAsFilter filterField="campanha_id" storePath="filters.campanha_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(gasto)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="Top Campanhas por Cliques" format="number" height={260}>
        <Interaction clickAsFilter filterField="campanha_id" storePath="filters.campanha_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(cliques)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="Top Campanhas por ROAS" format="number" height={260}>
        <Interaction clickAsFilter filterField="campanha_id" storePath="filters.campanha_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
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
      <Chart type="bar" fr={1} title="Piores Campanhas por ROAS" format="number" height={260}>
        <Interaction clickAsFilter filterField="campanha_id" storePath="filters.campanha_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
                "nivel": "campaign"
              },
              "dimension": "campanha_id",
              "orderBy": {
                "field": "measure",
                "dir": "asc"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} wrap childGrow>
      <Chart type="bar" fr={1} title="Top Grupos por Gasto" format="currency" height={260}>
        <Interaction clickAsFilter filterField="grupo_id" storePath="filters.grupo_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(gasto)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
                "nivel": "ad_group"
              },
              "dimension": "grupo_id",
              "orderBy": {
                "field": "measure",
                "dir": "desc"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Top Grupos por ROAS" format="number" height={260}>
        <Interaction clickAsFilter filterField="grupo_id" storePath="filters.grupo_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
                "nivel": "ad_group"
              },
              "dimension": "grupo_id",
              "orderBy": {
                "field": "measure",
                "dir": "desc"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Top Anúncios por Receita" format="currency" height={260}>
        <Interaction clickAsFilter filterField="anuncio_id" storePath="filters.anuncio_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(receita_atribuida)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
                "nivel": "ad"
              },
              "dimension": "anuncio_id",
              "orderBy": {
                "field": "measure",
                "dir": "desc"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Top Anúncios por Conversões" format="number" height={260}>
        <Interaction clickAsFilter filterField="anuncio_id" storePath="filters.anuncio_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "model": "trafegopago.desempenho_diario",
              "measure": "SUM(conversoes)",
              "filters": {
                "tenant_id": 1,
                "plataforma": "google_ads",
                "nivel": "ad"
              },
              "dimension": "anuncio_id",
              "orderBy": {
                "field": "measure",
                "dir": "desc"
              },
              "limit": 8
            }
          }
        </Config>
      </Chart>
    </Div>
  </Theme>
</DashboardTemplate>`
