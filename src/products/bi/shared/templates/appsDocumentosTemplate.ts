export const APPS_DOCUMENTOS_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_documentos_template_dsl">
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
    <Header title="Dashboard de Documentos" subtitle="Templates, versões e documentos gerados" align="center">
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
      <AISummary fr={2} title="Insights da IA">
        <Config>
          {
            "items": [
              {
                "icon": "badgeCheck",
                "text": "Monitorar templates e documentos gerados evita retrabalho em operações recorrentes."
              },
              {
                "icon": "sparkles",
                "text": "Picos de geração podem indicar campanhas, faturamento ou períodos de renovação."
              },
              {
                "icon": "triangleAlert",
                "text": "Documentos pendentes de envio/assinatura devem ser acompanhados por status."
              }
            ]
          }
        </Config>
      </AISummary>
      <KPI fr={1} title="Últimos 30 dias" valuePath="documentos.kpis.ultimos_30_dias" format="number">
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <KPI title="Templates Ativos" valuePath="documentos.kpis.templates_ativos" format="number">
      </KPI>
      <KPI title="Versões Publicadas" valuePath="documentos.kpis.versoes_publicadas" format="number">
      </KPI>
      <KPI title="Documentos Gerados" valuePath="documentos.kpis.documentos_gerados" format="number">
      </KPI>
      <KPI title="Documentos Enviados" valuePath="documentos.kpis.documentos_enviados" format="number">
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <KPI title="Pendentes de Geração" valuePath="documentos.kpis.pendentes_geracao" format="number">
      </KPI>
      <KPI title="Com Erro" valuePath="documentos.kpis.com_erro" format="number">
      </KPI>
      <KPI title="Assinados" valuePath="documentos.kpis.assinados" format="number">
      </KPI>
    </Div>
  </Theme>
</DashboardTemplate>`
