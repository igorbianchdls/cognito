export const APPS_VENDAS2_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_vendas2_template_dsl">
  <Theme name="light" />
  <Container direction="row" gap={12} padding={16} align="stretch" minHeight="100%">
    <Sidebar width={260} minWidth={220} maxWidth={280} minHeight="100%" gap={10} padding={12}>
      <Card>
        <Title text="Tabs" marginBottom={8} />
        <Container direction="column" gap={8}>
          <Tab id="resumo" label="Resumo" />
          <Tab id="clientes" label="Clientes" />
          <Tab id="produtos" label="Produtos" />
        </Container>
      </Card>
    </Sidebar>

    <Container direction="column" gap={12} grow={1} minHeight="100%">
      <Container tab="resumo">
        <Header title="Resumo" subtitle="Tela de teste da tab Resumo" />
      </Container>

      <Container tab="clientes">
        <Header title="Clientes" subtitle="Tela de teste da tab Clientes" />
      </Container>

      <Container tab="produtos">
        <Header title="Produtos" subtitle="Tela de teste da tab Produtos" />
      </Container>
    </Container>
  </Container>
</DashboardTemplate>`
