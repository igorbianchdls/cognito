'use client'

import {
  buildDashboardThemeImportSource,
  getDashboardTemplateThemeName,
} from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const COMPRAS_VARIANT = {
  fileName: 'dashboard-compras.tsx',
  name: 'dashboard_compras',
  path: 'app/dashboard-compras.tsx',
  title: 'Dashboard de Compras',
}

function buildComprasDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('compras')
  return `${buildDashboardThemeImportSource()}

export function DashboardCompras() {
  const theme = resolveDashboardThemeTokens(${JSON.stringify(resolvedThemeName)})
  const isClassic = false
  const key = ${JSON.stringify(resolvedThemeName)}.toLowerCase()
  const cardFrame = ['midnight', 'metro', 'aero'].includes(key)
    ? { variant: 'hud' as const, cornerSize: 10, cornerWidth: 2 }
    : ['light', 'white', 'claro', 'branco', 'sand'].includes(key)
      ? { variant: 'hud' as const, cornerSize: 6, cornerWidth: 1 }
      : { variant: 'hud' as const, cornerSize: 8, cornerWidth: 1 }


  return (
    <DashboardTemplate name="${COMPRAS_VARIANT.name}" title="${COMPRAS_VARIANT.title}">
      <Theme name="${resolvedThemeName}" chartPalette="blue" />
      <Dashboard id="overview" title="${COMPRAS_VARIANT.title}">
        <section style={{ display: 'flex', flexDirection: 'column', gap: isClassic ? 20 : 24, minHeight: '100%', padding: isClassic ? 28 : 32, backgroundColor: theme.pageBg }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: isClassic ? 20 : 24, padding: isClassic ? '20px 24px' : 24, borderRadius: isClassic && cardFrame ? 0 : 24, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.headerBg, color: theme.headerText }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '58%' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Procurement Review</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compras, fornecedores e alocacao de gasto</p>
                <h1 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard de Compras</h1>
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: theme.textSecondary }}>Leitura em pagina unica com KPIs no topo, filtros dedicados, distribuicao de gasto, serie temporal e detalhamento operacional sem DSL.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
              <DatePicker
                label="Periodo do pedido"
                table="compras.compras"
                field="data_pedido"
                presets={['7d', '30d', '90d', 'month']}
                labelStyle={{ margin: 0, fontSize: 11, color: theme.headerDatePickerLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                fieldStyle={{ minHeight: 38, padding: '0 10px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 14, fontWeight: 500 }}
                iconStyle={{ color: theme.headerDatePickerIcon, fontSize: 14 }}
                presetButtonStyle={{ height: 36, padding: '0 12px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 13, fontWeight: 500 }}
                activePresetButtonStyle={{ backgroundColor: theme.headerDatePickerActiveBg, borderColor: theme.headerDatePickerActiveBorder, color: theme.headerDatePickerActiveText, fontWeight: 600 }}
                separatorStyle={{ color: theme.headerDatePickerLabel, fontSize: 13, fontWeight: 500 }}
              />
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro</p>
              <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Fornecedor</h2>
              <Filter
                label="Fornecedor"
                table="compras.compras"
                field="fornecedor_id"
                mode="multiple"
                search
                clearable
                width="100%"
                query={\`
                  SELECT DISTINCT
                    src.fornecedor_id::text AS value,
                    COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label
                  FROM compras.compras src
                  LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
                  WHERE src.fornecedor_id IS NOT NULL
                  ORDER BY 2 ASC
                \`}
              >
                <Select />
              </Filter>
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro</p>
              <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Centro de custo</h2>
              <Filter
                label="Centro de custo"
                table="compras.compras"
                field="centro_custo_id"
                mode="multiple"
                search
                clearable
                width="100%"
                query={\`
                  SELECT DISTINCT
                    src.centro_custo_id::text AS value,
                    COALESCE(cc.nome, 'Sem centro de custo') AS label
                  FROM compras.compras src
                  LEFT JOIN empresa.centros_custo cc ON cc.id = src.centro_custo_id
                  WHERE src.centro_custo_id IS NOT NULL
                  ORDER BY 2 ASC
                \`}
              >
                <Select />
              </Filter>
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro</p>
              <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Status</h2>
              <Filter
                label="Status"
                table="compras.compras"
                field="status"
                mode="multiple"
                search
                clearable
                width="100%"
                query={\`
                  SELECT DISTINCT
                    src.status::text AS value,
                    COALESCE(src.status, 'Sem status') AS label
                  FROM compras.compras src
                  WHERE COALESCE(src.status, '') <> ''
                  ORDER BY 2 ASC
                \`}
              >
                <Select />
              </Filter>
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(c.valor_total), 0)::float AS value FROM compras.compras c WHERE 1=1 {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gasto total</p>
                <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Valor comprado</h2>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(DISTINCT c.fornecedor_id)::float AS value FROM compras.compras c WHERE 1=1 {{filters}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base ativa</p>
                <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Fornecedores</h2>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(DISTINCT c.id)::float AS value FROM compras.compras c WHERE 1=1 {{filters}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</p>
                <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Pedidos</h2>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COALESCE(AVG(c.valor_total), 0)::float AS value FROM compras.compras c WHERE 1=1 {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eficiencia</p>
                <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Ticket medio</h2>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top spend</p>
                <h2 style={{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Gasto por fornecedor</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }}>Corte principal para identificar concentracao de compras e dependencia de poucos parceiros no periodo filtrado.</p>
              <Chart
                type="bar"
                height={320}
                format="currency"
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(src.fornecedor_id::text, '0') AS key,
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label,
                      COALESCE(SUM(src.valor_total), 0)::float AS value
                    FROM compras.compras src
                    LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
                    WHERE 1=1
                      {{filters}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  \`,
                  limit: 8,
                }}
                xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                series={[
                  { dataKey: 'value', label: 'Gasto' },
                ]}
                yAxis={{ width: 86 }}
              />
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allocation</p>
                <h2 style={{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Gasto por categoria</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }}>Mostra em qual categoria de despesa o volume de compras esta se acumulando no periodo.</p>
              <Chart
                type="pie"
                height={320}
                format="currency"
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(src.categoria_despesa_id::text, '0') AS key,
                      COALESCE(cd.nome, 'Sem categoria') AS label,
                      COALESCE(SUM(src.valor_total), 0)::float AS value
                    FROM compras.compras src
                    LEFT JOIN financeiro.categorias_despesa cd ON cd.id = src.categoria_despesa_id
                    WHERE 1=1
                      {{filters}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  \`,
                  limit: 6,
                }}
                categoryKey="label"
                legend={{ enabled: true, position: 'right' }}
                series={[
                  { dataKey: 'value', label: 'Gasto' },
                ]}
                recharts={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trend</p>
                <h2 style={{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Gasto por mes</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }}>Serie mensal para entender aceleracao ou desaceleracao de compras sem depender do motor DSL antigo.</p>
              <Chart
                type="line"
                height={320}
                format="currency"
                dataQuery={{
                  query: \`
                    SELECT
                      TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
                      TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'MM/YYYY') AS label,
                      COALESCE(SUM(src.valor_total), 0)::float AS value
                    FROM compras.compras src
                    WHERE 1=1
                      {{filters}}
                    GROUP BY 1, 2
                    ORDER BY 1 ASC
                  \`,
                  limit: 12,
                }}
                xAxis={{ dataKey: 'label' }}
                series={[
                  { dataKey: 'value', label: 'Gasto' },
                ]}
                yAxis={{ width: 86 }}
                recharts={{ showDots: false, singleSeriesGradient: true }}
              />
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status mix</p>
                <h2 style={{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Pedidos por status</h2>
              </div>
              <Chart
                type="bar"
                height={320}
                format="number"
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(src.status, 'sem_status') AS key,
                      COALESCE(src.status, 'Sem status') AS label,
                      COUNT(*)::float AS value
                    FROM compras.compras src
                    WHERE 1=1
                      {{filters}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  \`,
                  limit: 8,
                }}
                xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                series={[
                  { dataKey: 'value', label: 'Pedidos' },
                ]}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
                <h2 style={{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Pedidos de compra no detalhe</h2>
              </div>
              <Table
                bordered
                rounded
                stickyHeader
                borderColor={'#d7dbe3'}
                rowHoverColor={'#f8fafc'}
                headerStyle={{ backgroundColor: '#f8fafc', color: '#334155', fontSize: 14, fontWeight: 600, padding: '12px 14px' }}
                rowStyle={{ backgroundColor: '#ffffff' }}
                cellStyle={{ color: '#475569', fontSize: 14, fontWeight: 400, padding: '12px 14px' }}
                footerStyle={{ backgroundColor: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 600, padding: '12px 14px' }}
                enableExportCsv
                dataQuery={{
                  query: \`
                    SELECT
                      c.id::text AS compra_id,
                      COALESCE(c.numero_oc, CONCAT('OC-', c.id::text)) AS numero_oc,
                      TO_CHAR(c.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS fornecedor,
                      COALESCE(cc.nome, 'Sem centro de custo') AS centro_custo,
                      COALESCE(c.status, 'Sem status') AS status,
                      COALESCE(c.valor_total, 0)::float AS valor_total
                    FROM compras.compras c
                    LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
                    LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
                    WHERE 1=1
                      {{filters}}
                    ORDER BY c.data_pedido DESC NULLS LAST, c.id DESC
                  \`,
                  limit: 12,
                }}
                columns={[
                  { accessorKey: 'numero_oc', header: 'OC' },
                  { accessorKey: 'data_pedido', header: 'Data' },
                  { accessorKey: 'fornecedor', header: 'Fornecedor' },
                  { accessorKey: 'centro_custo', header: 'Centro custo' },
                  { accessorKey: 'status', header: 'Status', cell: 'badge' },
                  { accessorKey: 'valor_total', header: 'Valor', format: 'currency', align: 'right', headerAlign: 'right' },
                ]}
              />
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
                <h2 style={{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Categoria por status</h2>
              </div>
              <PivotTable
                bordered
                rounded
                stickyHeader
                borderColor={'#d7dbe3'}
                containerStyle={{ backgroundColor: '#ffffff' }}
                headerStyle={{ backgroundColor: '#f8fafc', color: '#334155', fontSize: 14, fontWeight: 600, padding: '9px 10px' }}
                headerTotalStyle={{ backgroundColor: '#f1f5f9', color: '#1e293b', fontSize: 14, fontWeight: 600, padding: '9px 10px' }}
                rowLabelStyle={{ backgroundColor: '#ffffff', color: '#1e293b', fontSize: 14, padding: '9px 10px' }}
                cellStyle={{ backgroundColor: '#ffffff', color: '#475569', fontSize: 14, padding: '9px 10px' }}
                rowTotalStyle={{ backgroundColor: '#f8fafc', color: '#1e293b', fontSize: 14, fontWeight: 500, padding: '9px 10px' }}
                footerStyle={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: 14, fontWeight: 600, padding: '9px 10px' }}
                emptyStateStyle={{ color: '#64748b', fontSize: 14, padding: '18px 12px' }}
                expandButtonStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#475569', hoverBackgroundColor: '#f8fafc' }}
                enableExportCsv
                defaultExpandedLevels={1}
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(cd.nome, 'Sem categoria') AS categoria,
                      COALESCE(c.status, 'Sem status') AS status,
                      COALESCE(c.valor_total, 0)::float AS valor_total
                    FROM compras.compras c
                    LEFT JOIN financeiro.categorias_despesa cd ON cd.id = c.categoria_despesa_id
                    WHERE 1=1
                      {{filters}}
                  \`,
                  limit: 400,
                }}
                rows={[{ field: 'categoria', label: 'Categoria' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_total', label: 'Valor', aggregate: 'sum', format: 'currency' }]}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insight</p>
              <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Concentracao em fornecedores</h2>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#2563EB' }}
                items={[
                  { text: 'Se poucos fornecedores concentram a maior parte do gasto, a negociacao fica mais sensivel a prazo, ruptura e dependencia comercial.' },
                ]}
              />
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insight</p>
              <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Pressao por centro de custo</h2>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#0F766E' }}
                items={[
                  { text: 'Centro de custo acima da media precisa ser lido junto com categoria para separar compra pontual de uma tendencia estrutural de gasto.' },
                ]}
              />
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insight</p>
              <h2 style={{ ...{ margin: 0, fontSize: isClassic ? 22 : 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Risco operacional</h2>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#EA580C' }}
                items={[
                  { text: 'Status com muito volume em analise ou parcial costuma indicar gargalo entre pedido, recebimento e pagamento.' },
                ]}
              />
            </Card>
          </section>

          <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: isClassic ? '16px 20px' : '18px 22px', borderRadius: isClassic && cardFrame ? 0 : 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
            <p style={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.6 }}>Template JSX de compras com filtros dedicados, queries SQL explicitas e leitura completa em uma unica pagina.</p>
            <p style={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: ${resolvedThemeName}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildComprasDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildComprasDashboardSource(themeName || ''),
    name: COMPRAS_VARIANT.fileName,
    path: COMPRAS_VARIANT.path,
  }
}
