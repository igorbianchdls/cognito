'use client'

import type * as React from 'react'
import { buildContainersDashboardTemplateVariant } from '@/products/artifacts/dashboard/templates/dashboardContainersTemplate'
import { buildLayoutTestDashboardTemplateVariant } from '@/products/artifacts/dashboard/templates/dashboardLayoutTestTemplate'
import { buildComprasDashboardTemplateVariant } from '@/products/artifacts/dashboard/templates/dashboardComprasTemplate'
import { buildFinanceiroDashboardTemplateVariant } from '@/products/artifacts/dashboard/templates/dashboardFinanceiroTemplate'
import { buildGoogleAdsDashboardTemplateVariant } from '@/products/artifacts/dashboard/templates/dashboardGoogleAdsTemplate'
import { buildMetaAdsDashboardTemplateVariant } from '@/products/artifacts/dashboard/templates/dashboardMetaAdsTemplate'
import { buildShopifyDashboardTemplateVariant } from '@/products/artifacts/dashboard/templates/dashboardShopifyTemplate'
import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'
import { resolveDashboardTemplateThemeTokens } from '@/products/artifacts/dashboard/templates/dashboardTemplateThemes'

export type DashboardTemplateVariant = {
  content: string
  name: string
  path: string
}

type StandaloneDashboardVariant = {
  fileName: string
  name: string
  path: string
  title: string
}

type DashboardThemeUi = {
  cardFrame: { variant: 'hud'; cornerSize: number; cornerWidth: number } | null
  chartScheme: string[]
  page: React.CSSProperties
  header: React.CSSProperties
  headerDatePickerLabel: React.CSSProperties
  headerDatePickerField: React.CSSProperties
  headerDatePickerIcon: React.CSSProperties
  headerDatePickerPreset: React.CSSProperties
  headerDatePickerPresetActive: React.CSSProperties
  headerDatePickerSeparator: React.CSSProperties
  tableHeaderStyle: React.CSSProperties
  tableRowStyle: React.CSSProperties
  tableCellStyle: React.CSSProperties
  tableFooterStyle: React.CSSProperties
  tableHeaderBackground: string
  tableHeaderTextColor: string
  tableBorderColor: string
  tableCellTextColor: string
  tableRowHoverColor: string
  tableRowAlternateBgColor: string
  tableFooterBackground: string
  tableFooterTextColor: string
  pivotContainerStyle: React.CSSProperties
  pivotHeaderStyle: React.CSSProperties
  pivotHeaderTotalStyle: React.CSSProperties
  pivotRowLabelStyle: React.CSSProperties
  pivotCellStyle: React.CSSProperties
  pivotRowTotalStyle: React.CSSProperties
  pivotFooterStyle: React.CSSProperties
  pivotEmptyStateStyle: React.CSSProperties
  pivotExpandButtonStyle: React.CSSProperties
  pivotBackgroundColor: string
  pivotHeaderBackground: string
  pivotHeaderTextColor: string
  pivotHeaderTotalBackground: string
  pivotHeaderTotalTextColor: string
  pivotCellTextColor: string
  pivotRowLabelColor: string
  pivotRowTotalBackground: string
  pivotRowTotalTextColor: string
  pivotFooterBackground: string
  pivotFooterTextColor: string
  pivotMutedTextColor: string
  pivotExpandButtonBackground: string
  pivotExpandButtonBorderColor: string
  pivotExpandButtonColor: string
  pivotExpandButtonHoverBackground: string
  badge: React.CSSProperties
  noteCard: React.CSSProperties
  metricCard: React.CSSProperties
  queryCard: React.CSSProperties
  panelCard: React.CSSProperties
  panelCardAlt: React.CSSProperties
  footer: React.CSSProperties
  eyebrow: React.CSSProperties
  title: React.CSSProperties
  subtitle: React.CSSProperties
  paragraph: React.CSSProperties
  metricLabel: React.CSSProperties
  metricValue: React.CSSProperties
  metricNote: React.CSSProperties
  kpiLabel: React.CSSProperties
  kpiValue: React.CSSProperties
  kpiDelta: React.CSSProperties
}

function buildDashboardThemeUi(themeName: string, variant: 'default' | 'classic' = 'default'): DashboardThemeUi {
  const theme = resolveDashboardTemplateThemeTokens(themeName)
  const chartScheme = [theme.primary, theme.accentBorder, theme.textSecondary, theme.surfaceBorder, theme.headerSubtitle]

  const pageBg = theme.pageBg
  const surfaceBg = theme.surfaceBg
  const borderColor = theme.surfaceBorder
  const textPrimary = theme.textPrimary
  const textSecondary = theme.textSecondary
  const titleColor = theme.titleColor
  const headerBg = theme.headerBg
  const headerText = theme.headerText
  const headerSubtitle = theme.headerSubtitle
  const headerDpBg = theme.headerDatePickerBg
  const headerDpColor = theme.headerDatePickerColor
  const headerDpBorder = theme.headerDatePickerBorder
  const headerDpIcon = theme.headerDatePickerIcon
  const headerDpLabel = theme.headerDatePickerLabel
  const accentSurface = theme.accentSurface
  const accentBorder = theme.accentBorder
  const accentText = theme.accentText
  const headerDpActiveBg = theme.headerDatePickerActiveBg
  const headerDpActiveBorder = theme.headerDatePickerActiveBorder
  const headerDpActiveColor = theme.headerDatePickerActiveText
  const tableHeaderBackground = '#f8fafc'
  const tableHeaderTextColor = '#334155'
  const tableBorderColor = '#d7dbe3'
  const tableCellTextColor = '#475569'
  const tableRowHoverColor = '#f8fafc'
  const tableRowAlternateBgColor = '#ffffff'
  const tableFooterBackground = '#f8fafc'
  const tableFooterTextColor = '#0f172a'
  const pivotBackgroundColor = '#ffffff'
  const pivotHeaderBackground = '#f8fafc'
  const pivotHeaderTextColor = '#334155'
  const pivotHeaderTotalBackground = '#f1f5f9'
  const pivotHeaderTotalTextColor = '#1e293b'
  const pivotCellTextColor = '#475569'
  const pivotRowLabelColor = '#1e293b'
  const pivotRowTotalBackground = '#f8fafc'
  const pivotRowTotalTextColor = '#1e293b'
  const pivotFooterBackground = '#f1f5f9'
  const pivotFooterTextColor = '#0f172a'
  const pivotMutedTextColor = '#64748b'
  const pivotExpandButtonBackground = '#ffffff'
  const pivotExpandButtonBorderColor = '#e5e7eb'
  const pivotExpandButtonColor = '#475569'
  const pivotExpandButtonHoverBackground = '#f8fafc'
  return {
    cardFrame: variant === 'classic' ? theme.cardFrame : null,
    chartScheme,
    page: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minHeight: '100%',
      padding: 28,
      backgroundColor: pageBg,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 20,
      padding: '20px 24px',
      borderRadius: 24,
      border: `1px solid ${borderColor}`,
      backgroundColor: headerBg,
      color: headerText,
    },
    headerDatePickerLabel: {
      margin: 0,
      fontSize: 11,
      color: headerDpLabel,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    headerDatePickerField: {
      minHeight: 38,
      padding: '0 10px',
      border: `1px solid ${headerDpBorder}`,
      borderRadius: 10,
      backgroundColor: headerDpBg,
      color: headerDpColor,
      fontSize: 14,
      fontWeight: 500,
    },
    headerDatePickerIcon: {
      color: headerDpIcon,
      fontSize: 14,
    },
    headerDatePickerPreset: {
      height: 36,
      padding: '0 12px',
      border: `1px solid ${headerDpBorder}`,
      borderRadius: 10,
      backgroundColor: headerDpBg,
      color: headerDpColor,
      fontSize: 13,
      fontWeight: 500,
    },
    headerDatePickerPresetActive: {
      backgroundColor: headerDpActiveBg,
      borderColor: headerDpActiveBorder,
      color: headerDpActiveColor,
      fontWeight: 600,
    },
    headerDatePickerSeparator: {
      color: headerDpLabel,
      fontSize: 13,
      fontWeight: 500,
    },
    tableHeaderStyle: {
      backgroundColor: tableHeaderBackground,
      color: tableHeaderTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    tableRowStyle: {
      backgroundColor: '#ffffff',
    },
    tableCellStyle: {
      color: tableCellTextColor,
      fontSize: 14,
      fontWeight: 400,
      padding: '12px 14px',
    },
    tableFooterStyle: {
      backgroundColor: tableFooterBackground,
      color: tableFooterTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    pivotContainerStyle: {
      backgroundColor: pivotBackgroundColor,
    },
    pivotHeaderStyle: {
      backgroundColor: pivotHeaderBackground,
      color: pivotHeaderTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotHeaderTotalStyle: {
      backgroundColor: pivotHeaderTotalBackground,
      color: pivotHeaderTotalTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotRowLabelStyle: {
      backgroundColor: pivotBackgroundColor,
      color: pivotRowLabelColor,
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotCellStyle: {
      backgroundColor: pivotBackgroundColor,
      color: pivotCellTextColor,
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotRowTotalStyle: {
      backgroundColor: pivotRowTotalBackground,
      color: pivotRowTotalTextColor,
      fontSize: 14,
      fontWeight: 500,
      padding: '9px 10px',
    },
    pivotFooterStyle: {
      backgroundColor: pivotFooterBackground,
      color: pivotFooterTextColor,
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotEmptyStateStyle: {
      color: pivotMutedTextColor,
      fontSize: 14,
      padding: '18px 12px',
    },
    pivotExpandButtonStyle: {
      backgroundColor: pivotExpandButtonBackground,
      borderColor: pivotExpandButtonBorderColor,
      color: pivotExpandButtonColor,
      hoverBackgroundColor: pivotExpandButtonHoverBackground,
    } as React.CSSProperties,
    tableHeaderBackground,
    tableHeaderTextColor,
    tableBorderColor,
    tableCellTextColor,
    tableRowHoverColor,
    tableRowAlternateBgColor,
    tableFooterBackground,
    tableFooterTextColor,
    pivotBackgroundColor,
    pivotHeaderBackground,
    pivotHeaderTextColor,
    pivotHeaderTotalBackground,
    pivotHeaderTotalTextColor,
    pivotCellTextColor,
    pivotRowLabelColor,
    pivotRowTotalBackground,
    pivotRowTotalTextColor,
    pivotFooterBackground,
    pivotFooterTextColor,
    pivotMutedTextColor,
    pivotExpandButtonBackground,
    pivotExpandButtonBorderColor,
    pivotExpandButtonColor,
    pivotExpandButtonHoverBackground,
    badge: {
      display: 'inline-flex',
      width: 'fit-content',
      alignItems: 'center',
      borderRadius: 999,
      border: `1px solid ${accentBorder}`,
      backgroundColor: accentSurface,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: accentText,
    },
    noteCard: {
      width: '28%',
      padding: 22,
      borderRadius: theme.cardFrame ? 0 : 24,
      backgroundColor: accentSurface,
      border: `1px solid ${accentBorder}`,
    },
    metricCard: {
      padding: 20,
      borderRadius: theme.cardFrame ? 0 : 22,
      border: `1px solid ${borderColor}`,
      backgroundColor: surfaceBg,
    },
    queryCard: {
      padding: 18,
      borderRadius: theme.cardFrame ? 0 : 20,
      border: `1px solid ${borderColor}`,
      backgroundColor: surfaceBg,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    panelCard: {
      padding: 22,
      borderRadius: theme.cardFrame ? 0 : 24,
      backgroundColor: surfaceBg,
      border: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    panelCardAlt: {
      padding: 22,
      borderRadius: theme.cardFrame ? 0 : 24,
      backgroundColor: surfaceBg,
      border: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 18,
      padding: '18px 22px',
      borderRadius: 22,
      backgroundColor: surfaceBg,
      border: `1px solid ${borderColor}`,
    },
    eyebrow: {
      margin: 0,
      fontSize: 11,
      color: headerSubtitle,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    title: {
      margin: 0,
      fontSize: 24,
      fontWeight: 600,
      color: titleColor,
      letterSpacing: '-0.03em',
    },
    subtitle: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.7,
      color: textSecondary,
    },
    paragraph: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.75,
      color: textSecondary,
    },
    metricLabel: {
      margin: 0,
      fontSize: 12,
      color: textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    metricValue: {
      margin: '10px 0 8px 0',
      fontSize: 32,
      fontWeight: 700,
      color: titleColor,
      letterSpacing: '-0.04em',
    },
    metricNote: {
      margin: 0,
      fontSize: 13,
      lineHeight: 1.6,
      color: textSecondary,
    },
    kpiLabel: {
      margin: 0,
      fontSize: 12,
      color: textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    kpiValue: {
      margin: 0,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      color: theme.kpiValueColor,
    },
    kpiDelta: {
      margin: 0,
      fontSize: 13,
      color: textSecondary,
    },
  }
}

const CLASSIC_DASHBOARD_VARIANT: StandaloneDashboardVariant = {
  fileName: 'dashboard-classico.tsx',
  name: 'dashboard_classico',
  path: 'app/dashboard-classico.tsx',
  title: 'Dashboard Classico',
}

const CLASSIC_GRID_DASHBOARD_VARIANT: StandaloneDashboardVariant = {
  fileName: 'dashboard-classico-grid.tsx',
  name: 'dashboard_classico_grid',
  path: 'app/dashboard-classico-grid.tsx',
  title: 'Dashboard Classico Grid',
}

function buildClassicDashboardTemplateSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('classic')
  return `<Dashboard id="overview" title="${CLASSIC_DASHBOARD_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="teal">
        <Vertical gap={20} dropTarget={false} style={{ width: '1600px', minHeight: '100%', backgroundColor: theme.pageBg }}>
          <Grid columns={12} gap={0} rowHeight={32} style={{ padding: 0 }}>
            <header id="classic-header" span={12} rows={5} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, padding: '20px 24px', borderRadius: theme.cardFrame ? 0 : 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
              <Vertical gap={8}>
                <Text variant="eyebrow-strong">Executive dashboard</Text>
                <Text as="h1" variant="page-title-sm">Performance overview with the classic BI layout</Text>
                <Text variant="body-muted" style={{ maxWidth: 720 }}>
                  Header with global period control, KPI strip on top and analysis rows below. The runtime stays JSX-first, but the surface looks closer to the previous dashboard model.
                </Text>
              </Vertical>

              <Vertical gap={10} style={{ alignItems: 'flex-end', minWidth: 240 }}>
                <Text variant="eyebrow">Global period</Text>
                <DatePicker
                  label="Periodo do pedido"
                  table="vendas.pedidos"
                  field="data_pedido"
                  presets={['7d', '30d', 'month', 'quarter']}
                  labelStyle={{ margin: 0, fontSize: 11, color: theme.headerDatePickerLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                  fieldStyle={{ minHeight: 38, padding: '0 10px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 14, fontWeight: 500 }}
                  iconStyle={{ color: theme.headerDatePickerIcon, fontSize: 14 }}
                  presetButtonStyle={{ height: 36, padding: '0 12px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 13, fontWeight: 500 }}
                  activePresetButtonStyle={{ backgroundColor: theme.headerDatePickerActiveBg, borderColor: theme.headerDatePickerActiveBorder, color: theme.headerDatePickerActiveText, fontWeight: 600 }}
                  separatorStyle={{ color: theme.headerDatePickerLabel, fontSize: 13, fontWeight: 500 }}
                />
              </Vertical>
            </header>
          </Grid>

          <Vertical gap={20} style={{ padding: '0 28px 28px' }}>
          <Horizontal gap={14} columns={20} rowHeight={32}>
            <Card id="classic-kpi-receita" span={4} rows={4} variant="kpi" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon
                    name="DollarSign"
                    size={18}
                    padding={10}
                    color="#1D4ED8"
                    backgroundColor="#DBEAFE"
                    borderColor="#BFDBFE"
                  />
                  <Text variant="eyebrow">Receita</Text>
                </div>
                <KPI
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                  style={{ flex: 1 }}
                >
                  <KPICompare />
                </KPI>
            </Card>

            <Card id="classic-kpi-pedidos" span={4} rows={4} variant="kpi" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon
                    name="ShoppingCart"
                    size={18}
                    padding={10}
                    color="#15803D"
                    backgroundColor="#DCFCE7"
                    borderColor="#BBF7D0"
                  />
                  <Text variant="eyebrow">Pedidos</Text>
                </div>
                <KPI
                  dataQuery={{
                    query: \`
                      SELECT COUNT(*)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="number"
                  comparisonMode="previous_period"
                  style={{ flex: 1 }}
                >
                  <KPICompare />
                </KPI>
            </Card>

            <Card id="classic-kpi-ticket" span={4} rows={4} variant="kpi" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon
                    name="Ticket"
                    size={18}
                    padding={10}
                    color="#C2410C"
                    backgroundColor="#FFEDD5"
                    borderColor="#FED7AA"
                  />
                  <Text variant="eyebrow">Ticket medio</Text>
                </div>
                <KPI
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                  style={{ flex: 1 }}
                >
                  <KPICompare />
                </KPI>
            </Card>

            <Card id="classic-kpi-canais" span={4} rows={4} variant="kpi" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon
                    name="Network"
                    size={18}
                    padding={10}
                    color="#7C3AED"
                    backgroundColor="#F3E8FF"
                    borderColor="#DDD6FE"
                  />
                  <Text variant="eyebrow">Canais ativos</Text>
                </div>
                <KPI
                  dataQuery={{
                    query: \`
                      SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="number"
                  comparisonMode="previous_period"
                  style={{ flex: 1 }}
                >
                  <KPICompare />
                </KPI>
            </Card>

            <Card id="classic-kpi-aprovacao" span={4} rows={4} variant="kpi" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon
                    name="ShieldCheck"
                    size={18}
                    padding={10}
                    color="#0F766E"
                    backgroundColor="#CCFBF1"
                    borderColor="#99F6E4"
                  />
                  <Text variant="eyebrow">Aprovacao</Text>
                </div>
                <KPI
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(AVG(CASE WHEN COALESCE(p.status, '') = 'aprovado' THEN 1 ELSE 0 END), 0)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="percent"
                  comparisonMode="previous_period"
                  style={{ flex: 1 }}
                >
                  <KPICompare />
                </KPI>
            </Card>
          </Horizontal>

          <Horizontal gap={18} columns={12} rowHeight={32}>
            <Card id="classic-insight-aceleracao" span={4} rows={10} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text as="h2" variant="section-title-sm">Aceleracao recente</Text>
                <Text variant="small-muted">Leituras sobre os vetores que estao puxando o crescimento do periodo.</Text>
              </div>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#2563EB' }}
                items={[
                  { title: 'Receita acima da media recente', text: 'Receita ganhou tracao nos canais proprios e manteve crescimento acima da media recente.' },
                  { title: 'Volume mais regular no periodo', text: 'O volume diario segue acima da media das ultimas semanas, com melhor distribuicao ao longo do periodo.' },
                  { title: 'Melhor retorno sem mais desconto', text: 'Os canais com melhor retorno continuam puxando o resultado total sem depender de descontos mais agressivos.' },
                ]}
              />
            </Card>
            <Card id="classic-insight-concentracao" span={4} rows={10} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text as="h2" variant="section-title-sm">Concentracao de receita</Text>
                <Text variant="small-muted">Pontos de atencao sobre dependencia de canais e distribuicao do faturamento.</Text>
              </div>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#F59E0B' }}
                items={[
                  { text: 'O mix segue concentrado em poucos canais, o que aumenta dependencia operacional.' },
                  { text: 'Uma variacao pequena nos principais canais ainda tem impacto relevante na receita consolidada.' },
                  { text: 'A pulverizacao do faturamento continua baixa, o que reduz margem de seguranca para os proximos ciclos.' },
                ]}
              />
            </Card>
            <Card id="classic-insight-conversao" span={4} rows={10} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text as="h2" variant="section-title-sm">Conversao e qualidade</Text>
                <Text variant="small-muted">Sinais de eficiencia comercial sem pressao adicional sobre o ticket medio.</Text>
              </div>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#10B981' }}
                items={[
                  { text: 'A aprovacao continua estavel, com espaco para melhorar conversao sem pressionar o ticket medio.' },
                  { text: 'Existe espaco para elevar a taxa final com ajustes pontuais no topo do funil comercial.' },
                  { text: 'O ticket medio nao mostra deterioracao, o que permite buscar ganho de eficiencia sem comprometer valor.' },
                ]}
              />
            </Card>
          </Horizontal>

          <Horizontal gap={18} columns={12} rowHeight={32}>
            <Card id="classic-chart-mix" span={6} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text variant="eyebrow">Receita por canal</Text>
                <Text as="h2" variant="section-title-md">Mix comercial</Text>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Chart
                  type="bar"
                  height="100%"
                  format="currency"
                  dataQuery={{
                    query: \`
                      SELECT
                        COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key,
                        COALESCE(cv.nome, '-') AS label,
                        COALESCE(SUM(pi.subtotal), 0)::float AS value
                      FROM vendas.pedidos p
                      JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                      LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                      WHERE 1=1
                        {{filters}}
                      GROUP BY 1, 2
                      ORDER BY 3 DESC
                    \`,
                    limit: 6,
                  }}
                  interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                  xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                  series={[
                    { dataKey: 'value', label: 'Receita' },
                  ]}
                  yAxis={{ width: 72 }}
                />
              </div>
            </Card>

            <Card id="classic-chart-share" span={6} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text variant="eyebrow">Participacao</Text>
                <Text as="h2" variant="section-title-md">Share por canal</Text>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Chart
                  type="pie"
                  height="100%"
                  format="currency"
                  dataQuery={{
                    query: \`
                      SELECT
                        COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key,
                        COALESCE(cv.nome, '-') AS label,
                        COALESCE(SUM(pi.subtotal), 0)::float AS value
                      FROM vendas.pedidos p
                      JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                      LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                      WHERE 1=1
                        {{filters}}
                      GROUP BY 1, 2
                      ORDER BY 3 DESC
                    \`,
                    limit: 6,
                  }}
                  interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                  categoryKey="label"
                  legend={{ enabled: true, position: 'right' }}
                  series={[
                    { dataKey: 'value', label: 'Receita' },
                  ]}
                  recharts={{ innerRadius: 56, outerRadius: 96, showLabels: false }}
                />
              </div>
            </Card>
          </Horizontal>

          <Horizontal gap={18} columns={12} rowHeight={32}>
            <Card
              id="classic-chart-tendencia"
              span={6}
              rows={14}
              style={{
                padding: 22,
                borderRadius: theme.cardFrame ? 0 : 24,
                backgroundColor: theme.surfaceBg,
                border: '1px solid ' + theme.surfaceBorder,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                minHeight: '100%',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text variant="eyebrow">Tendencia diaria</Text>
                <Text as="h2" variant="section-title-md">Receita ao longo do periodo</Text>
              </div>
              <div style={{ flex: 1, minHeight: 300 }}>
                <Chart
                  type="line"
                  height="100%"
                  format="currency"
                  dataQuery={{
                    query: \`
                      SELECT
                        TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                        TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                        COALESCE(SUM(p.valor_total), 0)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters}}
                      GROUP BY 1, 2
                      ORDER BY 1 ASC
                    \`,
                    limit: 31,
                  }}
                  xAxis={{ dataKey: 'label' }}
                  series={[
                    { dataKey: 'value', label: 'Receita' },
                  ]}
                  yAxis={{ width: 72 }}
                  recharts={{ showDots: false, singleSeriesGradient: true }}
                />
              </div>
            </Card>

            <Card id="classic-table-pedidos" span={6} rows={14} variant="table" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text variant="eyebrow">Detalhamento</Text>
                <Text as="h2" variant="section-title-md">Pedidos filtrados</Text>
              </div>
              <Table
                bordered
                rounded
                radius={12}
                stickyHeader
                striped={false}
                borderColor={'#d7dbe3'}
                rowHoverColor={'#f8fafc'}
                headerStyle={{ backgroundColor: '#f8fafc', color: '#334155', fontSize: 14, fontWeight: 600, padding: '12px 14px' }}
                rowStyle={{ backgroundColor: '#ffffff' }}
                cellStyle={{ color: '#475569', fontSize: 14, fontWeight: 400, padding: '12px 14px' }}
                footerStyle={{ backgroundColor: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 600, padding: '12px 14px' }}
                dataQuery={{
                  query: \`
                    SELECT
                      p.id::text AS pedido_id,
                      TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
                      COALESCE(cv.nome, '-') AS canal,
                      COALESCE(p.status, 'Sem status') AS status,
                      COALESCE(p.valor_total, 0)::float AS valor_total
                    FROM vendas.pedidos p
                    LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                    WHERE 1=1
                      {{filters}}
                    ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC
                  \`,
                  limit: 12,
                }}
                columns={[
                  { accessorKey: 'pedido_id', header: 'Pedido' },
                  { accessorKey: 'data_pedido', header: 'Data' },
                  { accessorKey: 'canal', header: 'Canal' },
                  { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                  { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
                ]}
                enableExportCsv
              />
            </Card>
          </Horizontal>

          <Horizontal gap={18} columns={12} rowHeight={32}>
            <Card id="classic-chart-status" span={6} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text variant="eyebrow">Status mix</Text>
                <Text as="h2" variant="section-title-md">Volume por status</Text>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Chart
                  type="horizontal-bar"
                  height="100%"
                  format="number"
                  dataQuery={{
                    query: \`
                      SELECT
                        COALESCE(p.status, 'Sem status') AS label,
                        COUNT(*)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters}}
                      GROUP BY 1
                      ORDER BY 2 DESC
                    \`,
                    limit: 8,
                  }}
                  xAxis={{ dataKey: 'label' }}
                  series={[
                    { dataKey: 'value', label: 'Pedidos' },
                  ]}
                />
              </div>
            </Card>

            <Card id="classic-pivot-canal-status" span={6} rows={12} variant="pivot" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text variant="eyebrow">Cruzamento</Text>
                <Text as="h2" variant="section-title-md">Receita por canal e status</Text>
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
                      COALESCE(cv.nome, '-') AS canal,
                      COALESCE(p.status, 'Sem status') AS status,
                      COALESCE(p.valor_total, 0)::float AS valor_total
                    FROM vendas.pedidos p
                    LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                    WHERE 1=1
                      {{filters}}
                  \`,
                  limit: 400,
                }}
                rows={[{ field: 'canal', label: 'Canal' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
              />
            </Card>
          </Horizontal>

          <Horizontal gap={18} columns={12} rowHeight={32}>
            <Card id="classic-filter-canal" span={4} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Text variant="eyebrow">Filtro</Text>
              <Text as="h2" variant="section-title-sm">Canal</Text>
              <Filter
                label="Canal"
                table="vendas.pedidos"
                field="canal_venda_id"
                variant="checklist"
                mode="multiple"
                search
                searchBar={false}
                clearable
                width="100%"
                query={\`
                  SELECT
                    cv.id::text AS value,
                    COALESCE(cv.nome, '-') AS label
                  FROM vendas.canais_venda cv
                  ORDER BY 2 ASC
                \`}
              />
            </Card>

            <Card id="classic-filter-cliente" span={4} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Text variant="eyebrow">Filtro</Text>
              <Text as="h2" variant="section-title-sm">Cliente</Text>
              <Filter
                label="Cliente"
                table="vendas.pedidos"
                field="cliente_id"
                variant="checklist"
                mode="multiple"
                search
                searchBar={false}
                clearable
                width="100%"
                query={\`
                  SELECT
                    c.id::text AS value,
                    COALESCE(c.nome_fantasia, '-') AS label
                  FROM entidades.clientes c
                  ORDER BY 2 ASC
                \`}
              />
            </Card>

            <Card id="classic-filter-status" span={4} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Text variant="eyebrow">Filtro</Text>
              <Text as="h2" variant="section-title-sm">Status</Text>
              <Filter
                label="Status"
                table="vendas.pedidos"
                field="status"
                variant="dropdown"
                mode="multiple"
                search
                clearable
                width="100%"
                query={\`
                  SELECT DISTINCT
                    LOWER(src.status)::text AS value,
                    COALESCE(src.status, 'Sem status') AS label
                  FROM vendas.pedidos src
                  WHERE COALESCE(src.status, '') <> ''
                  ORDER BY 2 ASC
                \`}
              />
            </Card>
          </Horizontal>
          </Vertical>
        </Vertical>
</Dashboard>`
}

export function buildClassicDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildClassicDashboardTemplateSource(themeName || ''),
    name: CLASSIC_DASHBOARD_VARIANT.fileName,
    path: CLASSIC_DASHBOARD_VARIANT.path,
  }
}

function buildClassicGridDashboardTemplateSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('classicgrid')
  return buildClassicDashboardTemplateSource(resolvedThemeName)
    .replace(
      `title="${CLASSIC_DASHBOARD_VARIANT.title}"`,
      `title="${CLASSIC_GRID_DASHBOARD_VARIANT.title}"`,
    )
    .replace(
      `<Vertical gap={20} style={{ padding: '0 28px 28px' }}>`,
      `<Grid columns={24} gap={18} rowHeight={16} style={{ padding: '0 28px 28px' }}>`,
    )
    .replace(`<Horizontal gap={14} columns={20} rowHeight={32}>`, '')
    .replace(`</Horizontal>\n\n          <Horizontal gap={18} columns={12} rowHeight={32}>`, '')
    .replace(`</Horizontal>\n\n          <Horizontal gap={18} columns={12} rowHeight={32}>`, '')
    .replace(`</Horizontal>\n\n          <Horizontal gap={18} columns={12} rowHeight={32}>`, '')
    .replace(`</Horizontal>\n\n          <Horizontal gap={18} columns={12} rowHeight={32}>`, '')
    .replace(`</Horizontal>\n\n          <Horizontal gap={18} columns={12} rowHeight={32}>`, '')
    .replace(`</Horizontal>\n          </Vertical>`, `</Grid>`)
    .replace(`id="classic-kpi-receita" span={4}`, `id="classic-kpi-receita" span={5}`)
    .replace(`id="classic-kpi-pedidos" span={4}`, `id="classic-kpi-pedidos" span={5}`)
    .replace(`id="classic-kpi-ticket" span={4}`, `id="classic-kpi-ticket" span={5}`)
    .replace(`id="classic-kpi-canais" span={4}`, `id="classic-kpi-canais" span={5}`)
    .replace(`id="classic-kpi-aprovacao" span={4}`, `id="classic-kpi-aprovacao" span={4}`)
    .replace(`id="classic-insight-aceleracao" span={4}`, `id="classic-insight-aceleracao" span={8}`)
    .replace(`id="classic-insight-concentracao" span={4}`, `id="classic-insight-concentracao" span={8}`)
    .replace(`id="classic-insight-conversao" span={4}`, `id="classic-insight-conversao" span={8}`)
    .replace(`id="classic-chart-mix" span={6}`, `id="classic-chart-mix" span={12}`)
    .replace(`id="classic-chart-share" span={6}`, `id="classic-chart-share" span={12}`)
    .replace(`id="classic-chart-tendencia"\n              span={6}`, `id="classic-chart-tendencia"\n              span={12}`)
    .replace(`id="classic-table-pedidos" span={6}`, `id="classic-table-pedidos" span={12}`)
    .replace(`id="classic-chart-status" span={6}`, `id="classic-chart-status" span={12}`)
    .replace(`id="classic-pivot-canal-status" span={6}`, `id="classic-pivot-canal-status" span={12}`)
    .replace(`id="classic-filter-canal" span={4}`, `id="classic-filter-canal" span={8}`)
    .replace(`id="classic-filter-cliente" span={4}`, `id="classic-filter-cliente" span={8}`)
    .replace(`id="classic-filter-status" span={4}`, `id="classic-filter-status" span={8}`)
}

export function buildClassicGridDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildClassicGridDashboardTemplateSource(themeName || ''),
    name: CLASSIC_GRID_DASHBOARD_VARIANT.fileName,
    path: CLASSIC_GRID_DASHBOARD_VARIANT.path,
  }
}

export function buildDashboardTemplateVariants(themeName: string): DashboardTemplateVariant[] {
  const variants: DashboardTemplateVariant[] = []

  variants.push(buildClassicDashboardTemplateVariant())
  variants.push(buildClassicGridDashboardTemplateVariant())
  variants.push(buildContainersDashboardTemplateVariant())
  variants.push(buildLayoutTestDashboardTemplateVariant())

  variants.push(buildComprasDashboardTemplateVariant())
  variants.push(buildFinanceiroDashboardTemplateVariant())
  variants.push(buildMetaAdsDashboardTemplateVariant())
  variants.push(buildGoogleAdsDashboardTemplateVariant())
  variants.push(buildShopifyDashboardTemplateVariant())

  return variants
}
