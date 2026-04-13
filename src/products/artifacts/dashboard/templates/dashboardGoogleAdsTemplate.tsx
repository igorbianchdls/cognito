'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const GOOGLEADS_VARIANT = {
  fileName: 'dashboard-googleads.tsx',
  name: 'dashboard_googleads',
  path: 'app/dashboard-googleads.tsx',
  title: 'Dashboard Google Ads',
}

function buildGoogleAdsDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('googleads')
  return `<Dashboard id="overview" title="${GOOGLEADS_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="orange">
        <Vertical gap={18} style={{ width: '100%', minHeight: '100%', padding: 32, backgroundColor: theme.pageBg }}>
          <Horizontal gap={18}>
              <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
                  <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Paid Search</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text variant="eyebrow">Google Ads para Search, Shopping e PMax</Text>
                    <Text as="h1" variant="page-title">Dashboard Google Ads</Text>
                  </div>
                  <Text variant="lead">Versao JSX do template legado com foco em volume, eficiencia e aquisicao, agora no formato novo do workspace sem DSL.</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
                  <DatePicker
                    label="Periodo de performance"
                    table="trafegopago.desempenho_diario"
                    field="data_ref"
                    presets={['7d', '14d', '30d', '90d']}
                    labelStyle={{ margin: 0, fontSize: 11, color: theme.headerDatePickerLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                    fieldStyle={{ minHeight: 38, padding: '0 10px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 14, fontWeight: 500 }}
                    iconStyle={{ color: theme.headerDatePickerIcon, fontSize: 14 }}
                    presetButtonStyle={{ height: 36, padding: '0 12px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 13, fontWeight: 500 }}
                    activePresetButtonStyle={{ backgroundColor: theme.headerDatePickerActiveBg, borderColor: theme.headerDatePickerActiveBorder, color: theme.headerDatePickerActiveText, fontWeight: 600 }}
                    separatorStyle={{ color: theme.headerDatePickerLabel, fontSize: 13, fontWeight: 500 }}
                  />
                </div>
              </header>
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="googleads-filters" span={8} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Text variant="eyebrow">Filters</Text>
                  <Text as="h2" variant="section-title">Conta e grupo</Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                  <Filter
                    label="Conta"
                    table="trafegopago.desempenho_diario"
                    field="conta_id"
                    mode="multiple"
                    search
                    clearable
                    width={220}
                    query={\`
                      SELECT DISTINCT
                        src.conta_id::text AS value,
                        COALESCE(src.conta_id::text, 'Sem conta') AS label
                      FROM trafegopago.desempenho_diario src
                      WHERE src.plataforma = 'google_ads'
                        AND src.nivel = 'campaign'
                        AND src.conta_id IS NOT NULL
                      ORDER BY 2 ASC
                    \`}
                  >
                    <Select />
                  </Filter>
                  <Filter
                    label="Grupo"
                    table="trafegopago.desempenho_diario"
                    field="grupo_id"
                    mode="multiple"
                    search
                    clearable
                    width={220}
                    query={\`
                      SELECT DISTINCT
                        src.grupo_id::text AS value,
                        COALESCE(src.grupo_id::text, 'Sem grupo') AS label
                      FROM trafegopago.desempenho_diario src
                      WHERE src.plataforma = 'google_ads'
                        AND src.nivel = 'campaign'
                        AND src.grupo_id IS NOT NULL
                      ORDER BY 2 ASC
                    \`}
                  >
                    <Select />
                  </Filter>
                </div>
              </Card>

            <Card id="googleads-reading" span={4} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Text variant="eyebrow">Leitura esperada</Text>
                <Text variant="body-muted">Comece por volume e retorno, depois confronte CTR, CVR e CPA para separar problema de demanda, criativo ou pagina.</Text>
              </Card>
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={16}>
            <Card id="googleads-kpi-gasto" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                <KPI
                  title="Gasto"
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(SUM(src.gasto), 0)::float AS value
                      FROM trafegopago.desempenho_diario src
                      WHERE src.plataforma = 'google_ads'
                        AND src.nivel = 'campaign'
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </Card>
            <Card id="googleads-kpi-receita" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                <KPI
                  title="Receita atribuida"
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(SUM(src.receita_atribuida), 0)::float AS value
                      FROM trafegopago.desempenho_diario src
                      WHERE src.plataforma = 'google_ads'
                        AND src.nivel = 'campaign'
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </Card>
            <Card id="googleads-kpi-roas" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                <KPI
                  title="ROAS"
                  dataQuery={{
                    query: \`
                      SELECT
                        CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
                      FROM trafegopago.desempenho_diario src
                      WHERE src.plataforma = 'google_ads'
                        AND src.nivel = 'campaign'
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="number"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </Card>
            <Card id="googleads-kpi-cpa" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                <KPI
                  title="CPA"
                  dataQuery={{
                    query: \`
                      SELECT
                        CASE WHEN COALESCE(SUM(src.conversoes), 0) = 0 THEN 0 ELSE (SUM(src.gasto) / SUM(src.conversoes))::float END AS value
                      FROM trafegopago.desempenho_diario src
                      WHERE src.plataforma = 'google_ads'
                        AND src.nivel = 'campaign'
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </Card>
          </Horizontal>

          <Tabs defaultValue="performance">
            <Vertical gap={18}>
              <Horizontal columns={12} rowHeight={18} gap={10}>
                <Card id="googleads-tabs" span={12} rows={2}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Tab value="performance">Performance</Tab>
                    <Tab value="acquisition">Aquisicao</Tab>
                    <Tab value="details">Detalhamento</Tab>
                  </div>
                </Card>
              </Horizontal>

              <TabPanel value="performance">
                <Vertical gap={18}>
                  <Horizontal columns={12} rowHeight={18} gap={18}>
                    <Card id="googleads-performance-spend" span={7} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Top spend</Text>
                          <Text as="h2" variant="section-title">Gasto por campanha</Text>
                        </div>
                        <Text variant="body-muted">Ajuda a isolar onde Search, Shopping ou PMax estao carregando o budget antes de abrir o funil de qualidade.</Text>
                        <Chart
                          type="bar"
                          height={320}
                          format="currency"
                          dataQuery={{
                            query: \`
                              SELECT
                                COALESCE(src.campanha_id::text, 'sem_campanha') AS key,
                                COALESCE(src.campanha_id::text, 'Sem campanha') AS label,
                                COALESCE(SUM(src.gasto), 0)::float AS value
                              FROM trafegopago.desempenho_diario src
                              WHERE src.plataforma = 'google_ads'
                                AND src.nivel = 'campaign'
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

                    <Card id="googleads-performance-ctr" span={5} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Rate quality</Text>
                          <Text as="h2" variant="section-title">CTR por conta</Text>
                        </div>
                        <Text variant="body-muted">Mistura de volume e relevancia para mostrar quais contas sustentam cliques qualificados e quais dependem de impressao sem resposta.</Text>
                        <Chart
                          type="bar"
                          height={320}
                          format="percent"
                          dataQuery={{
                            query: \`
                              SELECT
                                COALESCE(src.conta_id::text, 'sem_conta') AS key,
                                COALESCE(src.conta_id::text, 'Sem conta') AS label,
                                CASE WHEN COALESCE(SUM(src.impressoes), 0) = 0 THEN 0 ELSE (SUM(src.cliques) / SUM(src.impressoes))::float END AS value
                              FROM trafegopago.desempenho_diario src
                              WHERE src.plataforma = 'google_ads'
                                AND src.nivel = 'campaign'
                                {{filters}}
                              GROUP BY 1, 2
                              ORDER BY 3 DESC
                            \`,
                            limit: 6,
                          }}
                          xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                          series={[
                            { dataKey: 'value', label: 'CTR' },
                          ]}
                          yAxis={{ width: 86 }}
                        />
                      </Card>
                  </Horizontal>
                </Vertical>
              </TabPanel>

              <TabPanel value="acquisition">
                <Vertical gap={18}>
                  <Horizontal columns={12} rowHeight={18} gap={18}>
                    <Card id="googleads-acquisition-trend" span={7} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Trend</Text>
                          <Text as="h2" variant="section-title">Gasto por mes</Text>
                        </div>
                        <Text variant="body-muted">Serie para confrontar aceleracao de investimento com as mudancas de qualidade de trafego ao longo do periodo.</Text>
                        <Chart
                          type="line"
                          height={320}
                          format="currency"
                          dataQuery={{
                            query: \`
                              SELECT
                                TO_CHAR(DATE_TRUNC('month', src.data_ref), 'YYYY-MM') AS key,
                                TO_CHAR(DATE_TRUNC('month', src.data_ref), 'MM/YYYY') AS label,
                                COALESCE(SUM(src.gasto), 0)::float AS value
                              FROM trafegopago.desempenho_diario src
                              WHERE src.plataforma = 'google_ads'
                                AND src.nivel = 'campaign'
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

                    <Card id="googleads-acquisition-side" span={5} rows={12}>
                      <Vertical gap={18} style={{ height: '100%' }}>
                        <Card id="googleads-acquisition-cvr" grow={1} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <Text variant="eyebrow">Conversion quality</Text>
                              <Text as="h2" variant="section-title">CVR por mes</Text>
                            </div>
                            <Chart
                              type="bar"
                              height={220}
                              format="percent"
                              dataQuery={{
                                query: \`
                                  SELECT
                                    TO_CHAR(DATE_TRUNC('month', src.data_ref), 'YYYY-MM') AS key,
                                    TO_CHAR(DATE_TRUNC('month', src.data_ref), 'MM/YYYY') AS label,
                                    CASE WHEN COALESCE(SUM(src.cliques), 0) = 0 THEN 0 ELSE (SUM(src.conversoes) / SUM(src.cliques))::float END AS value
                                  FROM trafegopago.desempenho_diario src
                                  WHERE src.plataforma = 'google_ads'
                                    AND src.nivel = 'campaign'
                                    {{filters}}
                                  GROUP BY 1, 2
                                  ORDER BY 1 ASC
                                \`,
                                limit: 12,
                              }}
                              xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                              series={[
                                { dataKey: 'value', label: 'CVR' },
                              ]}
                            />
                          </Card>

                        <Card id="googleads-acquisition-insights" grow={1} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <Text as="h2" variant="section-title-sm">Leituras operacionais</Text>
                              <Text variant="small-muted">Perguntas para separar problema de volume, relevancia ou eficiencia de pagina.</Text>
                            </div>
                            <Insights
                              textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                              iconStyle={{ color: '#4285F4' }}
                              items={[
                                { text: 'Gasto subindo com CTR e CVR em queda costuma indicar keyword ou audiencia sem aderencia real.' },
                                { text: 'CPA estourando sem perda de CTR geralmente aponta para problema de pagina, oferta ou tracking de conversao.' },
                                { text: 'Contas com muito clique e pouca receita atribuida precisam ser lidas junto com conversao e valor medio do pedido.' },
                              ]}
                            />
                          </Card>
                      </Vertical>
                    </Card>
                  </Horizontal>
                </Vertical>
              </TabPanel>

              <TabPanel value="details">
                <Vertical gap={18}>
                  <Horizontal columns={12} rowHeight={18} gap={18}>
                    <Card id="googleads-details-table" span={8} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Table</Text>
                          <Text as="h2" variant="section-title">Campanhas no detalhe</Text>
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
                                COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                                COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                                COALESCE(SUM(src.cliques), 0)::float AS cliques,
                                COALESCE(SUM(src.conversoes), 0)::float AS conversoes,
                                CASE WHEN COALESCE(SUM(src.conversoes), 0) = 0 THEN 0 ELSE (SUM(src.gasto) / SUM(src.conversoes))::float END AS cpa,
                                CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS roas
                              FROM trafegopago.desempenho_diario src
                              WHERE src.plataforma = 'google_ads'
                                AND src.nivel = 'campaign'
                                {{filters}}
                              GROUP BY 1, 2
                              ORDER BY cliques DESC, campanha ASC
                            \`,
                            limit: 12,
                          }}
                          columns={[
                            { accessorKey: 'conta', header: 'Conta' },
                            { accessorKey: 'campanha', header: 'Campanha' },
                            { accessorKey: 'cliques', header: 'Cliques', format: 'number', align: 'right', headerAlign: 'right' },
                            { accessorKey: 'conversoes', header: 'Conversoes', format: 'number', align: 'right', headerAlign: 'right' },
                            { accessorKey: 'cpa', header: 'CPA', format: 'currency', align: 'right', headerAlign: 'right' },
                            { accessorKey: 'roas', header: 'ROAS', format: 'number', align: 'right', headerAlign: 'right' },
                          ]}
                        />
                      </Card>

                    <Card id="googleads-details-pivot" span={4} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Pivot</Text>
                          <Text as="h2" variant="section-title">Conta por campanha</Text>
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
                                COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                                COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                                COALESCE(src.gasto, 0)::float AS gasto
                              FROM trafegopago.desempenho_diario src
                              WHERE src.plataforma = 'google_ads'
                                AND src.nivel = 'campaign'
                                {{filters}}
                            \`,
                            limit: 300,
                          }}
                          rows={[{ field: 'conta', label: 'Conta' }]}
                          columns={[{ field: 'campanha', label: 'Campanha' }]}
                          values={[{ field: 'gasto', label: 'Gasto', aggregate: 'sum', format: 'currency' }]}
                        />
                      </Card>
                  </Horizontal>
                </Vertical>
              </TabPanel>
            </Vertical>
          </Tabs>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="googleads-footer" span={12} rows={3}>
              <footer style={{ height: '100%', display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
                <Text variant="small-muted">Template JSX para Google Ads com volume, retorno e eficiencia em um unico arquivo TSX no formato novo do dashboard.</Text>
                <Text variant="small-muted">Theme ativo: ${resolvedThemeName}</Text>
              </footer>
            </Card>
          </Horizontal>
        </Vertical>
    </Dashboard>`
}

export function buildGoogleAdsDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildGoogleAdsDashboardSource(themeName || ''),
    name: GOOGLEADS_VARIANT.fileName,
    path: GOOGLEADS_VARIANT.path,
  }
}
