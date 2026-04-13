# Dashboard Skill (JSX + Query-First)

Objetivo: gerar dashboard JSX valido e renderizavel, usando SQL puro em `dataQuery.query`.

## Escopo

Use este skill para:
- criar/editar/corrigir dashboard JSX
- montar dashboard persistido em JSX/TSX
- compor layout com `Vertical`, `Horizontal`, `Grid`, `Panel`, `Card`, `Text`, `Icon` e HTML/JSX local quando fizer sentido
- usar componentes especiais apenas quando houver dado ou comportamento real

Nao use este skill para inventar schema de negocio.
Para semantica de dados por dominio, usar:
- `vendasSkill.md`
- `comprasSkill.md`
- `financeiroSkill.md`
- `ecommerceSkill.md`
- `marketingSkill.md`

## Contrato Nao Negociavel

1. Output final: dashboard em JSX.
2. Para dashboard novo, a estrutura canonica comeca direto em `<Dashboard ...>`.
3. Para dashboard novo, nao usar `DashboardTemplate` nem `Theme` como raiz autoral.
4. Layout padrao: `Vertical`, `Horizontal`, `Grid`, `Panel`, `Card`, `Text`, `Icon` e HTML/JSX local (`div`, `section`, `article`, `header`, `footer`, `p`, `h1`, `h2`, etc.) quando isso deixar a estrutura mais clara.
5. Componentes especiais so quando houver dado ou comportamento:
   - `KPI`
   - `KPICompare`
   - `Chart`
   - `Query`
   - `Table`
   - `PivotTable`
   - `Filter`
   - `DatePicker`
   - `Tabs` (`Tabs`, `Tab`, `TabPanel`)
   - `Insights`
6. Todo componente de dado deve preferir `dataQuery`.
7. Padrao principal de dados: `dataQuery.query` (SQL puro).
8. Para `Chart`, usar aliases e props coerentes com o runtime atual.
9. Para `Query` em modo KPI-like, a query deve retornar coluna numerica com alias `value`.
10. So usar props suportadas no runtime atual.
11. Nao regressar para DSL string.
12. `Chart`, `Table` e `PivotTable` so devem usar sizing fluido para preencher card/painel quando a cadeia de altura do container estiver explicitamente resolvida.
13. Para dashboard persistido, usar `artifact_write` para criar/substituir source completo, `artifact_read` para inspecionar e `artifact_patch` para edicoes focadas.

## Componentes Permitidos

Base:
- `Dashboard`

Layout:
- `Vertical`
- `Horizontal`
- `Grid`
- `Panel`
- `Card`
- `Text`
- `Icon`
- tags HTML/JSX normais para estrutura local

Especiais:
- `KPI`
- `KPICompare`
- `Chart`
- `Query`
- `Table`
- `PivotTable`
- `Filter`
- `DatePicker`
- `Tabs`
- `Tab`
- `TabPanel`
- `Insights`

Compatibilidade legada:
- `DashboardTemplate`
- `Theme`
- outros componentes legados podem aparecer em arquivos antigos
- ao editar dashboard antigo, preserve a estrutura legada quando isso for mais seguro
- ao criar dashboard novo, nao use `DashboardTemplate` nem `Theme`

## Slide

Quando o pedido for para `slide`, usar JSX com:
- `SlideTemplate`
- `Theme`
- `Slide`

Componentes especiais permitidos:
- `Chart`
- `Query`
- `Table`
- `PivotTable`

Regras de composicao:
- um slide = uma mensagem principal
- titulo deve carregar a conclusao, nao apenas o assunto
- um exhibit principal por slide
- KPIs, quando existirem, em uma unica row horizontal
- charts/tables/pivots ocupando a area principal em largura
- cards de apoio somente abaixo do exhibit
- evitar layout em duas colunas competindo entre si
- usar HTML/JSX para todo o resto
- lembrar que slide tem altura fixa: controlar o numero de blocos verticais

Padrao visual preferido:
- deck de consultoria / McKinsey
- sobrio
- hierarquia forte
- pouco elemento decorativo
- takeaways curtos abaixo do exhibit

## Report

Quando o pedido for para `report`, usar JSX com:
- `ReportTemplate`
- `Theme`
- `Report`

Componentes especiais permitidos:
- `Chart`
- `Query`
- `Table`
- `PivotTable`

Regras de composicao:
- uma coluna de leitura por pagina
- charts/tables/pivots amplos, ocupando a largura principal
- narrativa entre blocos de dados
- texto explicativo antes e depois de exhibits quando isso ajudar a leitura
- usar negrito para destacar os pontos realmente importantes
- evitar cara de dashboard enquadrado dentro da pagina
- nao usar `Filter` ou `DatePicker` por padrao

Ritmo sugerido de pagina:
- header
- row de KPIs ou introducao curta
- texto explicativo
- exhibit principal
- texto/bullets de leitura
- row final de insights, se fizer sentido

## Contrato DataQuery (Padrao)

Query para metrica:

```ts
<Query
  dataQuery={{
    query: `
      SELECT COALESCE(SUM(src.valor_total), 0)::float AS value
      FROM vendas.pedidos src
      WHERE src.tenant_id = {{tenant_id}}::int
    `,
    limit: 1,
  }}
  format="currency"
/>
```

Chart:

```ts
<Chart
  type="bar"
  dataQuery={{
    query: `
      SELECT
        cv.id::text AS key,
        COALESCE(cv.nome, '-') AS label,
        COALESCE(SUM(pi.subtotal), 0)::float AS value
      FROM vendas.pedidos src
      JOIN vendas.pedidos_itens pi ON pi.pedido_id = src.id
      LEFT JOIN vendas.canais_venda cv ON cv.id = src.canal_venda_id
      WHERE src.tenant_id = {{tenant_id}}::int
      GROUP BY 1, 2
      ORDER BY 3 DESC
    `,
    limit: 10,
  }}
  xAxis={{ dataKey: 'label' }}
  series={[{ dataKey: 'value', label: 'Receita' }]}
  format="currency"
  height={320}
/>
```

Chart responsivo dentro de card redimensionavel:

```tsx
<Card style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
  <Text as="h2">Receita por canal</Text>
  <div style={{ flex: 1, minHeight: 0 }}>
    <Chart
      type="bar"
      height="100%"
      dataQuery={{
        query: `
          SELECT
            cv.id::text AS key,
            COALESCE(cv.nome, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos src
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = src.id
          LEFT JOIN vendas.canais_venda cv ON cv.id = src.canal_venda_id
          WHERE src.tenant_id = {{tenant_id}}::int
          GROUP BY 1, 2
          ORDER BY 3 DESC
        `,
        limit: 10,
      }}
      xAxis={{ dataKey: 'label' }}
      series={[{ dataKey: 'value', label: 'Receita' }]}
      format="currency"
    />
  </div>
</Card>
```

Regra pratica de sizing:
- se houver duvida sobre a cadeia de altura, prefira `height={320}` no `Chart`
- so use `height="100%"` quando o card tiver `height: '100%'` e o wrapper interno tiver `flex: 1` com `minHeight: 0`
- aplicar a mesma logica para `Table` e `PivotTable` quando precisarem ocupar a area restante do card

Compatibilidade:
- Sem fallback legado para DSL.
- Sempre usar query pura em `dataQuery.query`.

## Regras de Qualidade SQL

- Tipar placeholders (`::date`, `::int`, `::text`) para evitar erro de tipo no Postgres.
- Nao usar `to_jsonb(src)->>'campo'` quando coluna real existe.
- Evitar joins sem uso.
- Garantir alias coerentes:
  - `Query` de metrica = `value`
  - `Chart` = `key/label/value` quando aplicavel
- Usar somente nomes fisicos (schema/tabela/campo) que existam na skill de dominio e no template oficial.
- Nunca inferir nome fisico a partir de rotulo semantico (cliente/vendedor/canal/etc.).
- `dataQuery.query` é armazenado no JSX e executado no runtime do dashboard; para teste ad-hoc de SQL, usar `sql_execution`.

## Template Minimo Valido

```tsx
<Dashboard id="overview" title="Dashboard de Vendas" theme="light" chartPalette="teal">
  <Vertical gap={24} padding={24} width="100%">
    <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Text variant="eyebrow">Revenue overview</Text>
      <Text as="h1" variant="page-title">Dashboard de vendas</Text>
    </header>

    <Grid columns={12} rowHeight={16} gap={18}>
      <Card id="kpi-receita" span={4} rows={8} variant="kpi">
        <Vertical gap={12}>
          <Icon
            name="DollarSign"
            size={18}
            padding={10}
            color="#1D4ED8"
            backgroundColor="#DBEAFE"
            borderColor="#BFDBFE"
          />
          <KPI
            title="Receita"
            dataQuery={{
              query: `
                SELECT COALESCE(SUM(src.valor_total), 0)::float AS value
                FROM vendas.pedidos src
                WHERE src.tenant_id = {{tenant_id}}::int
              `,
              limit: 1,
            }}
            format="currency"
          >
            <KPICompare />
          </KPI>
        </Vertical>
      </Card>

      <Card id="chart-canal" span={8} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Text variant="section-title">Receita por canal</Text>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Chart
            type="bar"
            height="100%"
            dataQuery={{
              query: `
                SELECT
                  cv.id::text AS key,
                  COALESCE(cv.nome, '-') AS label,
                  COALESCE(SUM(pi.subtotal), 0)::float AS value
                FROM vendas.pedidos src
                JOIN vendas.pedidos_itens pi ON pi.pedido_id = src.id
                LEFT JOIN vendas.canais_venda cv ON cv.id = src.canal_venda_id
                WHERE src.tenant_id = {{tenant_id}}::int
                GROUP BY 1, 2
                ORDER BY 3 DESC
              `,
              limit: 10,
            }}
            xAxis={{ dataKey: 'label' }}
            series={[{ dataKey: 'value', label: 'Receita' }]}
            format="currency"
          />
        </div>
      </Card>
    </Grid>
  </Vertical>
</Dashboard>
```

## Checklist Antes de Entregar

- JSX valido.
- Estrutura raiz correta.
- Componentes suportados pelo runtime.
- SQL valido para o dominio escolhido.
- `Query` de metrica retorna alias `value`.
- `Chart` usa aliases/props coerentes com `xAxis`, `series` e o shape do resultado.
- Sem caminho errado de arquivo.
- Sem regressao para DSL string.
