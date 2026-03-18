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
    <Header direction="row" justify="between" align="center">
      <Container direction="column" gap={4}>
        <Text text="Dashboard de Compras" />
        <Text text="Principais indicadores e cortes" />
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
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Gasto" />
            <KPI format="currency">
              <DataQuery model="compras.compras" measure="gasto_total" />
            </KPI>
          </Container>
          <Icon name="circle-dollar-sign" size={18} padding={10} radius={10} backgroundColor="#e8f0fe" color="#1d4ed8" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Fornecedores" />
            <KPI format="number">
              <DataQuery model="compras.compras" measure="fornecedores_unicos" />
            </KPI>
          </Container>
          <Icon name="users" size={18} padding={10} radius={10} backgroundColor="#ecfdf3" color="#047857" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Pedidos" />
            <KPI format="number">
              <DataQuery model="compras.compras" measure="pedidos" />
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
            <Text text="Transações" />
            <KPI format="number">
              <DataQuery model="compras.compras" measure="transacoes" />
            </KPI>
          </Container>
          <Icon name="activity" size={18} padding={10} radius={10} backgroundColor="#f3e8ff" color="#7c3aed" />
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Text text="Fornecedores" marginBottom={8} />
          <Chart type="bar" format="currency" height={240}>
            <DataQuery model="compras.compras" dimension="fornecedor" measure="gasto_total" limit={8}>
              <OrderBy field="measure" dir="desc" />
            </DataQuery>
            <Nivo layout="horizontal" />
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Centros de Custo" marginBottom={8} />
          <Chart type="bar" format="currency" height={240}>
            <DataQuery model="compras.compras" dimension="centro_custo" measure="gasto_total" limit={8}>
              <OrderBy field="measure" dir="desc" />
            </DataQuery>
            <Nivo layout="horizontal" />
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
          <Text text="Filiais" marginBottom={8} />
          <Chart type="bar" format="currency" height={240}>
            <DataQuery model="compras.compras" dimension="filial" measure="gasto_total" limit={8}>
              <OrderBy field="measure" dir="desc" />
            </DataQuery>
            <Nivo layout="horizontal" />
          </Chart>
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Text text="Categorias" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
            <DataQuery model="compras.compras" dimension="categoria_despesa" measure="gasto_total" limit={8}>
              <OrderBy field="measure" dir="desc" />
            </DataQuery>
            <Nivo layout="horizontal" />
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Projetos" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
            <DataQuery model="compras.compras" dimension="projeto" measure="gasto_total" limit={8}>
              <OrderBy field="measure" dir="desc" />
            </DataQuery>
            <Nivo layout="horizontal" />
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Status (Qtd)" marginBottom={8} />
          <Chart type="bar" format="number" height={220}>
            <DataQuery model="compras.compras" dimension="status" measure="pedidos" limit={8}>
              <OrderBy field="measure" dir="desc" />
            </DataQuery>
            <Nivo layout="horizontal" />
          </Chart>
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Text text="Status (Pizza)" marginBottom={8} />
          <Chart type="pie" format="number" height={260}>
            <DataQuery model="compras.compras" dimension="status" measure="pedidos" limit={8}>
              <OrderBy field="measure" dir="desc" />
            </DataQuery>
            <Nivo innerRadius={0.35} />
          </Chart>
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Text text="Gasto por Mês" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
            <DataQuery model="compras.compras" dimension="periodo" measure="gasto_total" limit={12}>
              <OrderBy field="dimension" dir="asc" />
            </DataQuery>
            <Nivo layout="vertical" />
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Pedidos por Mês" marginBottom={8} />
          <Chart type="bar" format="number" height={220}>
            <DataQuery model="compras.compras" dimension="periodo" measure="pedidos" limit={12}>
              <OrderBy field="dimension" dir="asc" />
            </DataQuery>
            <Nivo layout="vertical" />
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Ticket Médio por Mês" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
            <DataQuery model="compras.compras" dimension="periodo" measure="ticket_medio" limit={12}>
              <OrderBy field="dimension" dir="asc" />
            </DataQuery>
            <Nivo layout="vertical" />
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Insights da IA" marginBottom={8} />
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
