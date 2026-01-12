'use client'

import { atom } from 'nanostores'
import { ConfigParser } from '@/components/visual-builder/ConfigParser'
import type { Widget, GridConfig, ParseResult } from '@/components/visual-builder/ConfigParser'

// Re-export types for use in other components
export type { Widget, GridConfig } from '@/components/visual-builder/ConfigParser'

// Tipos para filtros globais
export type DateRangeType =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_14_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'current_month'
  | 'last_month'
  | 'custom'

export interface DateRangeFilter {
  type: DateRangeType
  startDate?: string
  endDate?: string
}

export interface GlobalFilters {
  dateRange: DateRangeFilter
}

// Helper to coerce parser-provided globalFilters (string types) into our typed GlobalFilters
const coerceGlobalFilters = (gf: ParseResult['globalFilters'] | undefined): GlobalFilters | undefined => {
  if (!gf || !gf.dateRange) return undefined
  const t = gf.dateRange.type
  const allowed: DateRangeType[] = ['today','yesterday','last_7_days','last_14_days','last_30_days','last_90_days','current_month','last_month','custom']
  if (!allowed.includes(t as DateRangeType)) return undefined
  if (t === 'custom') {
    return {
      dateRange: {
        type: 'custom',
        startDate: gf.dateRange.startDate,
        endDate: gf.dateRange.endDate,
      }
    }
  }
  return { dateRange: { type: t as DateRangeType } }
}

// Estado da store
interface VisualBuilderState {
  widgets: Widget[]
  gridConfig: GridConfig
  code: string
  parseErrors: ParseResult['errors']
  isValid: boolean
  globalFilters: GlobalFilters
  dashboardTitle?: string
  dashboardSubtitle?: string
  headerConfig?: import('@/components/visual-builder/ConfigParser').HeaderConfig
  // Controls when widgets should explicitly refetch (only when bumped)
  reloadTicks?: Record<string, number>
}

// Helper: compact specific sections inside a JSON string to one line
const compactJsonSections = (code: string): string => {
  const collapse = (match: string) =>
    match
      .replace(/\n\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\{\s+/g, '{ ')
      .replace(/\s+\}/g, ' }')
      .replace(/,\s+/g, ', ')

  return code
    .replace(/("config"\s*:\s*\{[\s\S]*?\})/g, collapse)
    .replace(/("dataSource"\s*:\s*\{[\s\S]*?\})/g, collapse)
    .replace(/("span"\s*:\s*\{[\s\S]*?\})/g, collapse)
    .replace(/("styling"\s*:\s*\{[\s\S]*?\})/g, collapse)
}

// Helper: compact layoutRows block to a single line (legacy JSON only)
const compactLayoutRows = (code: string): string => {
  try {
    const parsed: unknown = JSON.parse(code)
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as { layoutRows?: unknown }).layoutRows &&
      typeof (parsed as { layoutRows?: unknown }).layoutRows === 'object'
    ) {
      const pretty = JSON.stringify(parsed, null, 2)
      const start = pretty.indexOf('"layoutRows"')
      if (start === -1) return code
      const braceStart = pretty.indexOf('{', start)
      if (braceStart === -1) return code
      let i = braceStart
      let depth = 0
      for (; i < pretty.length; i++) {
        const ch = pretty[i]
        if (ch === '{') depth++
        else if (ch === '}') {
          depth--
          if (depth === 0) break
        }
      }
      if (depth !== 0) return code
      const end = i
      const inline = `"layoutRows": ${JSON.stringify((parsed as { layoutRows: unknown }).layoutRows)}`
      return pretty.slice(0, start) + inline + pretty.slice(end + 1)
    }
    return code
  } catch {
    return code
  }
}

// Helper: reorder widget keys so id,type,row,span,heightPx come first (JSON only)
const reorderWidgetKeysInCode = (code: string): string => {
  try {
    const parsed: unknown = JSON.parse(code)
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { widgets?: unknown }).widgets)
    ) {
      const root = parsed as { widgets: Array<Record<string, unknown>>; [k: string]: unknown }
      const desired = ['id', 'type', 'row', 'span', 'heightPx'] as const
      root.widgets = root.widgets.map((w) => {
        if (!w || typeof w !== 'object') return w
        const newW: Record<string, unknown> = {}
        for (const key of desired) {
          if (Object.prototype.hasOwnProperty.call(w, key)) newW[key] = (w as Record<string, unknown>)[key]
        }
        for (const key of Object.keys(w)) {
          if (!desired.includes(key as (typeof desired)[number])) {
            newW[key] = (w as Record<string, unknown>)[key]
          }
        }
        return newW
      })
      return JSON.stringify(root, null, 2)
    }
    return code
  } catch {
    return code
  }
}

// Helper: compact widget header lines (id, type, row, span, heightPx) into one line (JSON only)
const compactWidgetHeaders = (code: string): string => {
  return code.replace(
    /\{\s*\n\s*"id": [^,\n]+,\s*\n\s*"type": [^,\n]+,\s*\n\s*"row": [^,\n]+,\s*\n\s*"span": \{[\s\S]*?\},\s*\n\s*"heightPx": [^,\n]+,/g,
    (m) => m.replace(/\n\s*/g, ' ')
  )
}

// Initial Liquid template (HTML-like)
export const initialLiquidGrid = `<dashboard render="html" theme="branco">
  <style>
    :root {
      --vb-font-family: var(--font-barlow), Barlow, -apple-system, BlinkMacSystemFont, sans-serif;
      --vb-letter-spacing: -0.02em;
      --vb-title-size: 18px;
      --vb-chart-font-family: var(--font-geist), Geist, -apple-system, BlinkMacSystemFont, sans-serif;
      --vb-chart-text-color: #6b7280;
    }

    .vb-container {
      font-family: var(--vb-font-family);
      letter-spacing: var(--vb-letter-spacing);
    }

    .vb-header p,
    .vb-header h1,
    .vb-header h2 {
      font-family: var(--vb-font-family);
    }

    /* Gráficos montados por LiquidParser */
    [data-liquid-chart] {
      font-family: var(--vb-chart-font-family);
      color: var(--vb-chart-text-color);
    }

    /* Título do cabeçalho usa tamanho base */
    .vb-header p:first-of-type {
      font-size: var(--vb-title-size);
    }
  </style>
  <div class="vb-container" style="padding: 16px;">
    <header class="vb-header" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:12px; margin:-16px -16px 16px -16px;">
      <p style="margin:0 0 4px; font-family:Inter, system-ui, sans-serif; font-size:20px; font-weight:700; color:#111827;">Dashboard de Indicadores</p>
      <p style="margin:0; font-family:Inter, system-ui, sans-serif; font-size:14px; font-weight:400; color:#6b7280;">Visão geral</p>
    </header>

    <section id="kpis" class="row kpis" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="kpi_vendas" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#fff7ed; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas</p>
        <div class="kpi-value" style="font-size:28px; font-weight:700; letter-spacing:-0.02em;">R$ 124.500</div>
      </article>
      <article id="kpi_pedidos" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ecfeff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Pedidos</p>
        <div class="kpi-value" style="font-size:28px; font-weight:700; letter-spacing:-0.02em;">830</div>
      </article>
      <article id="kpi_clientes" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#f0fdf4; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Clientes</p>
        <div class="kpi-value" style="font-size:28px; font-weight:700; letter-spacing:-0.02em;">214</div>
      </article>
      <article id="kpi_ticket_medio" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#eef2ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Ticket Médio</p>
        <div class="kpi-value" style="font-size:28px; font-weight:700; letter-spacing:-0.02em;">R$ 150,00</div>
      </article>
    </section>

    <section id="charts" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="chart_top_categorias_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#fefce8; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Categorias (Despesas)</p>
        <Chart id="top_categorias_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
          <query schema="financeiro" table="contas_pagar" dimension="categoria" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
          <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
        </Chart>
      </article>
      <article id="chart_top_departamentos_ap" class="card" data-role="chart" style="--fr:2; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#f0f9ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Departamentos (Despesas)</p>
        <Chart id="top_departamentos_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
          <query schema="financeiro" table="contas_pagar" dimension="departamento" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
          <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
        </Chart>
      </article>
      <article id="chart_top_centros_lucro_ar" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#fdf2f8; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Centros de Lucro (Receitas)</p>
        <Chart id="top_centros_lucro_ar" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
          <query schema="financeiro" table="contas_receber" dimension="centro_lucro" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
          <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
        </Chart>
      </article>
    </section>

    <section id="charts2" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="chart_top_fornecedores_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ecfeff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Fornecedores (Despesas)</p>
        <Chart id="top_fornecedores_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
          <query schema="financeiro" table="contas_pagar" dimension="fornecedor" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
          <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
        </Chart>
      </article>
      <article id="chart_top_cc_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#f0f9ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Centros de Custo (Despesas)</p>
        <Chart id="top_cc_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
          <query schema="financeiro" table="contas_pagar" dimension="centro_custo" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
          <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
        </Chart>
      </article>
      <article id="chart_top_clientes_ar" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#fdf2f8; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Clientes (Receitas)</p>
        <Chart id="top_clientes_ar" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
          <query schema="financeiro" table="contas_receber" dimension="cliente" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
          <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
        </Chart>
      </article>
    </section>

    <section id="charts3" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="chart_top_filial_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#f0fdf4; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Filiais (Despesas)</p>
        <Chart id="top_filial_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
          <query schema="financeiro" table="contas_pagar" dimension="filial" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
          <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
        </Chart>
      </article>
      <article id="chart_top_unidade_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#eef2ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Unidades de Negócio (Despesas)</p>
        <Chart id="top_unidade_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
          <query schema="financeiro" table="contas_pagar" dimension="unidade_negocio" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
          <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
        </Chart>
      </article>
      <article id="chart_top_categorias_receita_ar" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#fff7ed; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Categorias (Receita)</p>
        <Chart id="top_categorias_receita_ar" type="bar" height="320">
          <query schema="financeiro" table="contas_receber" dimension="categoria" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
            <where>
              <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
            </where>
          </query>
        </Chart>
      </article>
    </section>
  </div>
</dashboard>`
export const initialDsl = `<dashboard theme="branco" title="Dashboard de Vendas" subtitle="Análise de desempenho comercial" layout-mode="grid-per-row" date-type="last_30_days">
  <!-- KPIs (6 em uma linha) - Foco: Novembro/2025 via filtros globais -->
  <row id="kpis" cols-d="6" cols-t="3" cols-m="2" gap-x="12" gap-y="12">
    <kpi id="kpi_meta" order="1" span-d="1" span-t="1" span-m="1" height="150" title="Meta de Vendas">
      <datasource schema="comercial" table="vw_vendas_metas" measure="SUM(meta_faturamento_territorio)" />
      <styling tw="kpi:viz:card kpi:unit:R$" />
    </kpi>
    <kpi id="kpi_vendas" order="2" span-d="1" span-t="1" span-m="1" height="150" title="Vendas">
      <datasource schema="comercial" table="vendas_vw" measure="SUM(item_subtotal)" />
      <styling tw="kpi:viz:card kpi:unit:R$" />
    </kpi>
    <kpi id="kpi_percent_meta" order="3" span-d="1" span-t="1" span-m="1" height="150" title="% da Meta">
      <datasource schema="comercial" table="vw_vendas_metas" measure="(SUM(subtotal)/NULLIF(SUM(meta_faturamento_territorio),0))*100" />
      <styling tw="kpi:viz:card" />
    </kpi>
    <kpi id="kpi_ticket_medio" order="4" span-d="1" span-t="1" span-m="1" height="150" title="Ticket Médio">
      <datasource schema="comercial" table="vendas_vw" measure="SUM(item_subtotal)/COUNT_DISTINCT(pedido_id)" />
      <styling tw="kpi:viz:card kpi:unit:R$" />
    </kpi>
    <kpi id="kpi_pedidos" order="5" span-d="1" span-t="1" span-m="1" height="150" title="Pedidos">
      <datasource schema="comercial" table="vendas_vw" measure="COUNT_DISTINCT(pedido_id)" />
      <styling tw="kpi:viz:card" />
    </kpi>
    <kpi id="kpi_clientes" order="6" span-d="1" span-t="1" span-m="1" height="150" title="Clientes">
      <datasource schema="comercial" table="vendas_vw" measure="COUNT_DISTINCT(cliente_id)" />
      <styling tw="kpi:viz:card" />
    </kpi>
  </row>

  <!-- Mais exemplos do relatório financeiro (gráficos) -->
  <section id="charts2" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
    <article id="chart_top_fornecedores_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ecfeff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
      <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Fornecedores (Despesas)</p>
      <Chart id="top_fornecedores_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
        <query schema="financeiro" table="contas_pagar" dimension="fornecedor" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
          <where>
            <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
          </where>
        </query>
        <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
      </Chart>
    </article>
    <article id="chart_top_cc_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#f0f9ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
      <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Centros de Custo (Despesas)</p>
      <Chart id="top_cc_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
        <query schema="financeiro" table="contas_pagar" dimension="centro_custo" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
          <where>
            <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
          </where>
        </query>
        <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
      </Chart>
    </article>
    <article id="chart_top_clientes_ar" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#fdf2f8; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
      <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Clientes (Receitas)</p>
      <Chart id="top_clientes_ar" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
        <query schema="financeiro" table="contas_receber" dimension="cliente" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
          <where>
            <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
          </where>
        </query>
        <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
      </Chart>
    </article>
  </section>

  <section id="charts3" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
    <article id="chart_top_titulos_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#fff7ed; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
      <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Títulos (A Pagar)</p>
      <Chart id="top_titulos_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
        <query schema="financeiro" table="contas_pagar" dimension="titulo" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
          <where>
            <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
          </where>
        </query>
        <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
      </Chart>
    </article>
    <article id="chart_top_projetos_ap" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#eef2ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
      <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Projetos (Despesas)</p>
      <Chart id="top_projetos_ap" type="bar" height="320" layout="vertical" axisBottomTickRotation="-25" enableGridY="true" showLegend="false" colors="#2563eb">
        <query schema="financeiro" table="contas_pagar" dimension="projeto" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
          <where>
            <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
          </where>
        </query>
        <nivo axisLeftLegend="Valor (R$)" axisLeftLegendOffset="-60" axisBottomLegend="Categoria" axisBottomLegendOffset="36" axisBottomLegendPosition="middle" groupMode="grouped" padding="0.25" innerPadding="2" enableLabel="false" animate="true" motionConfig="gentle" gridColor="#e5e7eb" gridStrokeWidth="1" />
      </Chart>
    </article>
  </section>
  <!-- Metas x Realizado — Vendedor (Faturamento, Ticket, Novos Clientes) -->
  <row id="metas_vendedor" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <chart id="meta_fat_vendedor" type="groupedbar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Meta x Faturamento por Vendedor">
      <datasource schema="comercial" table="vw_vendas_metas"
        dimension="vendedor_nome"
        measureGoal="MAX(meta_faturamento_vendedor)"
        measureActual="SUM(subtotal)"
        limit="12" />
      <styling tw="legend:on grid:on mb:32" />
    </chart>

    <chart id="meta_ticket_vendedor" type="groupedbar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Meta x Ticket Médio por Vendedor">
      <datasource schema="comercial" table="vw_vendas_metas"
        dimension="vendedor_nome"
        measureGoal="MAX(meta_ticket_vendedor)"
        measureActual="SUM(subtotal)/COUNT_DISTINCT(pedido_id)"
        limit="12" />
      <styling tw="legend:on grid:on mb:32" />
    </chart>

    <chart id="meta_novos_vendedor" type="groupedbar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="Meta x Novos Clientes por Vendedor">
      <datasource schema="comercial" table="vw_vendas_metas"
        dimension="vendedor_nome"
        measureGoal="MAX(meta_novos_clientes_vendedor)"
        measureActual="COUNT_DISTINCT(cliente_id)"
        limit="12" />
      <styling tw="legend:on grid:on mb:32" />
    </chart>
  </row>

  <!-- Metas x Realizado — Território (Faturamento, Ticket, Novos Clientes) -->
  <row id="metas_territorio" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <chart id="meta_fat_territorio" type="groupedbar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Meta x Faturamento por Território"> 
      <datasource schema="comercial" table="vw_vendas_metas"
        dimension="territorio_nome"
        measureGoal="MAX(meta_faturamento_territorio)"
        measureActual="SUM(subtotal)"
        limit="12" />
      <styling tw="legend:on grid:on mb:32" />
    </chart>

    <chart id="meta_ticket_territorio" type="groupedbar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Meta x Ticket Médio por Território"> 
      <datasource schema="comercial" table="vw_vendas_metas"
        dimension="territorio_nome"
        measureGoal="MAX(meta_ticket_territorio)"
        measureActual="SUM(subtotal)/COUNT_DISTINCT(pedido_id)"
        limit="12" />
      <styling tw="legend:on grid:on mb:32" />
    </chart>

    <chart id="meta_novos_territorio" type="groupedbar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="Meta x Novos Clientes por Território"> 
      <datasource schema="comercial" table="vw_vendas_metas"
        dimension="territorio_nome"
        measureGoal="MAX(meta_novos_clientes_territorio)"
        measureActual="COUNT_DISTINCT(cliente_id)"
        limit="12" />
      <styling tw="legend:on grid:on mb:32" />
    </chart>
  </row>

  

  <!-- Agregados: Serviços e Categorias (3 por linha) -->
  <row id="agg_1" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <chart id="top_categorias_receita_ar" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Top 5 Categorias (Receita)">
      <datasource schema="financeiro" table="contas_receber" />
      <styling tw="legend:off grid:on mb:32" />
      <query schema="financeiro" table="contas_receber" dimension="categoria" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
        <where>
          <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
        </where>
      </query>
    </chart>
    <chart id="top_unidade_ap" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Top 5 Unidades de Negócio (Despesas)">
      <datasource schema="financeiro" table="contas_pagar" />
      <styling tw="legend:off grid:on mb:32" />
      <query schema="financeiro" table="contas_pagar" dimension="unidade_negocio" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
        <where>
          <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
        </where>
      </query>
    </chart>
    <chart id="top_filial_ap" type="bar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="Top 5 Filiais (Despesas)">
      <datasource schema="financeiro" table="contas_pagar" />
      <styling tw="legend:off grid:on mb:32" />
      <query schema="financeiro" table="contas_pagar" dimension="filial" measure="SUM(valor_liquido)" timeDimension="data_vencimento" from="2025-10-01" to="2026-01-31" limit="5" order="value DESC">
        <where>
          <rule col="status" op="in" vals="aberto,pendente,em_aberto,em aberto" />
        </where>
      </query>
    </chart>
  </row>

  <!-- Agregados: Categorias e Canais -->
  <row id="agg_2" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <chart id="pedidos_categoria" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Pedidos por Categoria de Serviço">
      <datasource schema="comercial" table="vendas_vw" dimension="categoria_servico_nome" measure="COUNT_DISTINCT(pedido_id)" />
      <styling tw="legend:off grid:on mb:32" />
    </chart>
    <chart id="vendas_canal" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Vendas por Canal">
      <datasource schema="comercial" table="vendas_vw" dimension="canal_venda_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </chart>
    <chart id="fat_canal_distrib" type="bar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="Faturamento por Canal de Distribuição">
      <datasource schema="comercial" table="vendas_vw" dimension="canal_distribuicao_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </chart>
  </row>

  <!-- Agregados: Canais de Distribuição e Territórios -->
  <row id="agg_3" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <chart id="ticket_canal_distrib" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Ticket Médio por Canal de Distribuição">
      <datasource schema="comercial" table="vendas_vw" dimension="canal_distribuicao_nome" measure="SUM(item_subtotal)/COUNT_DISTINCT(pedido_id)" />
      <styling tw="legend:off grid:on mb:32" />
    </chart>
    <chart id="pedidos_canal_distrib" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Pedidos por Canal de Distribuição">
      <datasource schema="comercial" table="vendas_vw" dimension="canal_distribuicao_nome" measure="COUNT_DISTINCT(pedido_id)" />
      <styling tw="legend:off grid:on mb:32" />
    </chart>
    <chart id="vendas_territorio" type="bar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="Vendas por Território">
      <datasource schema="comercial" table="vendas_vw" dimension="territorio_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </chart>
  </row>

  <!-- Agregados: Clientes e Filial -->
  <row id="agg_4" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <chart id="top_clientes" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Top Clientes">
      <datasource schema="comercial" table="vendas_vw" dimension="cliente_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </chart>
    <chart id="fat_filial" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Faturamento por Filial">
      <datasource schema="comercial" table="vendas_vw" dimension="filial_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </chart>
  </row>

  <!-- Novos Exemplos: Treemap, Scatter e Funnel (todos na mesma linha) -->
  <row id="extra_viz" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <chart id="tm_categoria_servico" type="treemap" order="1" span-d="1" span-t="1" span-m="1" height="400" title="Treemap • Categoria > Serviço">
      <datasource schema="comercial" table="vendas_vw" dimension1="categoria_servico_nome" dimension2="servico_nome" measure="SUM(item_subtotal)" />
      <styling tw="mb:32" />
    </chart>
    <chart id="sc_vend_fat_vs_pedidos" type="scatter" order="2" span-d="1" span-t="1" span-m="1" height="400" title="Scatter • Faturamento vs Pedidos por Vendedor">
      <datasource schema="comercial" table="vendas_vw" dimension="vendedor_nome" xMeasure="SUM(item_subtotal)" yMeasure="COUNT_DISTINCT(pedido_id)" />
      <styling tw="gridx:on gridy:on mb:32" />
    </chart>
    <chart id="fnl_canal_venda" type="funnel" order="3" span-d="1" span-t="1" span-m="1" height="400" title="Funil • Vendas por Canal (Top 5)">
      <datasource schema="comercial" table="vendas_vw" dimension1="canal_venda_nome" measure="SUM(item_subtotal)" limit="5" />
      <styling tw="bg:#ffffff border:width:1 border:color:#e5e7eb radius:12 mb:32" />
    </chart>
  </row>

  
</dashboard>`

// Example in grid-per-column mode (Liquid)

// Parse do código inicial para ter widgets desde o início
const initialParseResult = ConfigParser.parse(initialLiquidGrid)

// Use a compact view when code is JSON; keep as-is for Liquid
const isLiquidCode = (code: string) => code.trim().startsWith('<')
const compactInitialCode = isLiquidCode(initialLiquidGrid)
  ? initialLiquidGrid
  : compactWidgetHeaders(compactJsonSections(compactLayoutRows(reorderWidgetKeysInCode(initialLiquidGrid))))

const initialState: VisualBuilderState = {
  widgets: initialParseResult.widgets,
  gridConfig: initialParseResult.gridConfig,
  code: compactInitialCode,
  parseErrors: initialParseResult.errors,
  isValid: initialParseResult.isValid,
  dashboardTitle: initialParseResult.dashboardTitle,
  dashboardSubtitle: initialParseResult.dashboardSubtitle,
  headerConfig: initialParseResult.headerConfig,
  globalFilters: coerceGlobalFilters(initialParseResult.globalFilters) || { dateRange: { type: 'last_30_days' } },
  reloadTicks: {}
}

const STORAGE_KEY = 'cognito_visual_builder_state'

// Função para carregar do localStorage
const loadFromStorage = (): VisualBuilderState | null => {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as VisualBuilderState
      return parsed
    }
  } catch {
    // ignore
  }
  return null
}

// Função para salvar no localStorage
const saveToStorage = (state: VisualBuilderState) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

// Inicializar store com dados do localStorage ou estado inicial
const savedState = loadFromStorage()
export const $visualBuilderState = atom<VisualBuilderState>(savedState || initialState)

// Subscribe para sincronização automática com localStorage
$visualBuilderState.subscribe((state) => {
  saveToStorage(state)
})

// Actions
export const visualBuilderActions = {
  // Atualizar widgets (vem do GridCanvas)
  updateWidgets: (widgets: Widget[]) => {
    const currentState = $visualBuilderState.get()

    // Extrair tema e config do código atual para preservá-los
    let currentTheme: string | null = null
    let currentConfig: GridConfig | null = null
    let dashboardTitle: string | undefined
    let dashboardSubtitle: string | undefined
    try {
      const parsedUnknown: unknown = JSON.parse(currentState.code)
      if (parsedUnknown && typeof parsedUnknown === 'object') {
        const obj = parsedUnknown as { theme?: unknown; config?: unknown; dashboardTitle?: unknown; dashboardSubtitle?: unknown }
        currentTheme = typeof obj.theme === 'string' ? obj.theme : null
        currentConfig = (obj.config && typeof obj.config === 'object') ? (obj.config as GridConfig) : null
        dashboardTitle = typeof obj.dashboardTitle === 'string' ? obj.dashboardTitle : undefined
        dashboardSubtitle = typeof obj.dashboardSubtitle === 'string' ? obj.dashboardSubtitle : undefined
      }
    } catch {
      currentConfig = currentState.gridConfig
    }

    const newCodeRaw = JSON.stringify(
      {
        ...(currentTheme && { theme: currentTheme }),
        config: currentConfig || currentState.gridConfig,
        ...(dashboardTitle ? { dashboardTitle } : {}),
        ...(dashboardSubtitle ? { dashboardSubtitle } : {}),
        widgets
      },
      null,
      2
    )

    const newCode = isLiquidCode(currentState.code)
      ? (() => {
          // Serialize DSL: update order and (in per-column mode) column (col-d)
          let dsl = currentState.code
          const isPerColumn = /layout-mode\s*=\s*"grid-per-column"/.test(dsl)
          const isGrid = /layout-mode\s*=\s*"grid"/.test(dsl)

          const escapeId = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const setAttrOnNode = (source: string, id: string, name: string, value: string): string => {
            const re = new RegExp(`(<(kpi|chart)\\b[^>]*\\bid=\"${escapeId(id)}\"[^>]*)(\\/?>)`, 'gi')
            return source.replace(re, (match, attrs: string, end: string) => {
              const attrRe = new RegExp(`\\b${name}\\=\"[^\"]*\"`)
              let newAttrs = attrs
              if (attrRe.test(attrs)) {
                newAttrs = attrs.replace(attrRe, `${name}="${value}"`)
              } else {
                newAttrs = `${attrs} ${name}="${value}` + `"`
              }
              return newAttrs + end
            })
          }

          const escapeHtml = (s: string) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
          const setAttrOnDatasource = (source: string, id: string, attrs: Record<string, string | undefined>): string => {
            const idRe = new RegExp(`(<(kpi|chart)\\b([^>]*)\\bid=\"${escapeId(id)}\"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'i')
            return source.replace(idRe, (match: string, _open: string, _tag: string, _attrs: string, inner: string) => {
              const dsRe = /<datasource\b([^>]*)\/>/i
              const dsMatch = inner.match(dsRe)
              if (!dsMatch) {
                // No datasource; nothing to update
                return match
              }
              const dsAttrs = dsMatch[1] || ''
              const setAttr = (attrString: string, name: string, value: string | undefined) => {
                if (value === undefined || value === '') return attrString
                const re = new RegExp(`(\\b${name}\\=\")[^\"]*(\")`, 'i')
                if (re.test(attrString)) {
                  return attrString.replace(re, `$1${escapeHtml(value)}$2`)
                }
                return `${attrString} ${name}=\"${escapeHtml(value)}\"`
              }
              let nextDsAttrs = dsAttrs
              for (const [k, v] of Object.entries(attrs)) {
                nextDsAttrs = setAttr(nextDsAttrs, k, v)
              }
              const updatedInner = inner.replace(dsRe, `<datasource${nextDsAttrs ? ' ' + nextDsAttrs : ''} />`)
              return match.replace(inner, updatedInner)
            })
          }

          const buildMeasureExpr = (metric?: string, agg?: string): string | undefined => {
            const m = (metric || '').trim()
            const a = (agg || '').trim().toUpperCase()
            if (!m) return undefined
            if (!a) return `SUM(${m})`
            if (["SUM","COUNT","AVG","MIN","MAX"].includes(a)) return `${a}(${m})`
            return `SUM(${m})`
          }

          const normalizeSchemaTable = (schema?: string, table?: string): { schema?: string; table?: string } => {
            const s = (schema || '').trim()
            const tbl = (table || '').trim()
            if (tbl.includes('.')) {
              const i = tbl.indexOf('.')
              const s2 = tbl.slice(0, i)
              const t2 = tbl.slice(i + 1)
              return { schema: s || s2, table: t2 }
            }
            return { schema: s || undefined, table: tbl || undefined }
          }

          // Insert or update <config>{...}</config> for a widget id
          const setConfigOnNode = (source: string, id: string, updater: (cfg: Record<string, unknown>) => Record<string, unknown>): string => {
            const reNode = new RegExp(`(<(kpi|chart)\\b[^>]*\\bid=\"${escapeId(id)}\"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'i')
            return source.replace(reNode, (match: string, open: string, inner: string, close: string) => {
              const cfgRe = /<config\b[^>]*>([\s\S]*?)<\/config>/i
              const cfgMatch = inner.match(cfgRe)
              let current: Record<string, unknown> = {}
              if (cfgMatch && cfgMatch[1]) {
                try {
                  current = JSON.parse(cfgMatch[1].trim()) as Record<string, unknown>
                } catch {
                  current = {}
                }
              }
              const nextCfg = updater(current)
              const json = JSON.stringify(nextCfg, null, 2)
              if (cfgMatch) {
                inner = inner.replace(cfgRe, `<config>\n${json}\n</config>`)
              } else {
                inner = `<config>\n${json}\n</config>\n` + inner
              }
              return open + inner + close
            })
          }

          // Apply updates
          widgets.forEach(w => {
            if (w.id) {
              if (typeof w.order === 'number') {
                dsl = setAttrOnNode(dsl, w.id, 'order', String(w.order))
              }
              if (isPerColumn || isGrid) {
                const col = w.gridStart?.desktop
                if (typeof col === 'number' && col >= 1) {
                  dsl = setAttrOnNode(dsl, w.id, 'col-d', String(col))
                }
              }
              // Update common widget attrs
              if (typeof w.heightPx === 'number') {
                dsl = setAttrOnNode(dsl, w.id, 'height', String(w.heightPx))
              }
              if (typeof w.title === 'string' && w.title.length > 0) {
                dsl = setAttrOnNode(dsl, w.id, 'title', w.title)
              }
              if (typeof w.type === 'string' && w.type.length > 0 && w.type !== 'kpi') {
                dsl = setAttrOnNode(dsl, w.id, 'type', w.type)
              }
              // Update fractional width when provided (group sizing="fr")
              const wfr = (w as any).widthFr as { desktop?: string } | undefined
              if (wfr && typeof wfr.desktop === 'string' && wfr.desktop.trim().length > 0) {
                dsl = setAttrOnNode(dsl, w.id, 'width', wfr.desktop.trim())
              }
              // Update datasource for simple charts and KPI
              const t = w.type
              if (w.dataSource) {
                const ds = w.dataSource as NonNullable<Widget['dataSource']>
                const norm = normalizeSchemaTable(ds.schema as string | undefined, ds.table as string | undefined)
                const xDim = (ds.dimension as string | undefined) ?? (ds.x as string | undefined) ?? ''
                const yMetric = (ds.measure as string | undefined) ?? (ds.y as string | undefined) ?? ''
                const agg = (ds.aggregation as ("SUM"|"COUNT"|"AVG"|"MIN"|"MAX") | undefined) ?? ''
                const measureExpr = ds.measure ? String(ds.measure) : buildMeasureExpr(yMetric, String(agg))
                const dsAttrs: Record<string, string | undefined> = {
                  schema: norm.schema,
                  table: norm.table,
                }
                if (['bar','line','pie','area'].includes(t)) {
                  dsAttrs['dimension'] = xDim || undefined
                  dsAttrs['measure'] = measureExpr
                } else if (t === 'kpi') {
                  dsAttrs['measure'] = measureExpr
                } else if (['stackedbar','groupedbar','stackedlines','radialstacked','pivotbar','treemap','funnel'].includes(t)) {
                  const dim1 = (ds.dimension1 as string | undefined) ?? xDim ?? ''
                  const dim2 = (ds.dimension2 as string | undefined) ?? ''
                  dsAttrs['dimension1'] = dim1 || undefined
                  dsAttrs['dimension2'] = dim2 || undefined
                  dsAttrs['measure'] = measureExpr
                } else if (t === 'scatter') {
                  const dOpt = (ds.dimension as string | undefined) ?? ''
                  if (dOpt) dsAttrs['dimension'] = dOpt
                  dsAttrs['xMeasure'] = (ds.xMeasure as string | undefined) || ''
                  dsAttrs['yMeasure'] = (ds.yMeasure as string | undefined) || ''
                }
              dsl = setAttrOnDatasource(dsl, w.id, dsAttrs)

              // Persist styling colors and margin.left into <config> (supports simple and groupedbar)
              const updateChartConfig = (key: 'barConfig'|'lineConfig'|'pieConfig'|'areaConfig'|'groupedBarConfig'|'stackedBarConfig', colors?: string[], marginLeft?: number, marginTop?: number, marginBottom?: number, layout?: 'vertical'|'horizontal') => {
                if ((!colors || colors.length === 0) && (marginLeft === undefined) && (marginTop === undefined) && (marginBottom === undefined)) return
                dsl = setConfigOnNode(dsl, w.id, (cfg) => {
                  const prev = (cfg[key] as Record<string, unknown>) || {}
                  const prevStyling = (prev['styling'] as Record<string, unknown>) || {}
                  const prevMargin = (prev['margin'] as { top?: number; right?: number; bottom?: number; left?: number } | undefined) || {}
                  const nextStyling = { ...prevStyling, ...(colors && colors.length ? { colors } : {}), ...(layout ? { layout } : {}) }
                  const baseMargin = {
                    top: typeof prevMargin.top === 'number' ? prevMargin.top : 20,
                    right: typeof prevMargin.right === 'number' ? prevMargin.right : 20,
                    bottom: typeof prevMargin.bottom === 'number' ? prevMargin.bottom : 40,
                    left: typeof prevMargin.left === 'number' ? prevMargin.left : 40,
                  }
                  const nextMargin = {
                    ...baseMargin,
                    ...(typeof marginLeft === 'number' ? { left: marginLeft } : {}),
                    ...(typeof marginTop === 'number' ? { top: marginTop } : {}),
                    ...(typeof marginBottom === 'number' ? { bottom: marginBottom } : {}),
                  }
                  return {
                    ...cfg,
                    [key]: {
                      ...prev,
                      ...(Object.keys(nextStyling).length ? { styling: nextStyling } : {}),
                      margin: nextMargin,
                    }
                  }
                })
              }

              // Read colors and margin from widget object (already updated by modal)
              if (t === 'bar') {
                const colors = w.barConfig?.styling?.colors as string[] | undefined
                const m = w.barConfig?.margin as { left?: number; top?: number; bottom?: number } | undefined
                updateChartConfig('barConfig', colors, m?.left, m?.top, m?.bottom)
              } else if (t === 'line') {
                const colors = w.lineConfig?.styling?.colors as string[] | undefined
                const m = w.lineConfig?.margin as { left?: number; top?: number; bottom?: number } | undefined
                updateChartConfig('lineConfig', colors, m?.left, m?.top, m?.bottom)
              } else if (t === 'pie') {
                const colors = w.pieConfig?.styling?.colors as string[] | undefined
                const m = w.pieConfig?.margin as { left?: number; top?: number; bottom?: number } | undefined
                updateChartConfig('pieConfig', colors, m?.left, m?.top, m?.bottom)
              } else if (t === 'area') {
                const colors = w.areaConfig?.styling?.colors as string[] | undefined
                const m = w.areaConfig?.margin as { left?: number; top?: number; bottom?: number } | undefined
                updateChartConfig('areaConfig', colors, m?.left, m?.top, m?.bottom)
              } else if (t === 'groupedbar') {
                const g = (w as unknown as { groupedBarConfig?: { styling?: { colors?: string[] }, margin?: { left?: number; top?: number; bottom?: number } } }).groupedBarConfig
                updateChartConfig('groupedBarConfig', g?.styling?.colors as string[] | undefined, g?.margin?.left, g?.margin?.top, g?.margin?.bottom)
              } else if (t === 'stackedbar') {
                const s = (w as unknown as { stackedBarConfig?: { styling?: { colors?: string[] }, margin?: { left?: number; top?: number; bottom?: number } } }).stackedBarConfig
                updateChartConfig('stackedBarConfig', s?.styling?.colors as string[] | undefined, s?.margin?.left, s?.margin?.top, s?.margin?.bottom)
              }
              }
            }
          })

          // Remove deleted widgets from DSL
          try {
            const prevIds = new Set((currentState.widgets || []).map(w => w.id))
            const nextIds = new Set(widgets.map(w => w.id))
            const deletedIds: string[] = []
            prevIds.forEach(id => { if (!nextIds.has(id)) deletedIds.push(id) })
            const removeById = (source: string, id: string): string => {
              const idEsc = escapeId(id)
              // Remove paired tags first <kpi|chart ... id="...">...</kpi|chart>
              const rePair = new RegExp(`<(?:(kpi|chart))\\b([^>]*)\\bid=\"${idEsc}\"[\s\S]*?>[\s\S]*?<\\/\\1>`, 'gi')
              let out = source.replace(rePair, '')
              // Remove self-closing <kpi|chart ... id="..." />
              const reSelf = new RegExp(`<(?:(kpi|chart))\\b([^>]*)\\bid=\"${idEsc}\"[^>]*?\/?>`, 'gi')
              out = out.replace(reSelf, '')
              // Collapse excessive blank lines
              out = out.replace(/[\r\n]{3,}/g, '\n\n')
              return out
            }
            for (const id of deletedIds) {
              dsl = removeById(dsl, id)
            }
          } catch {
            // ignore
          }
          return dsl
        })()
      : compactWidgetHeaders(compactJsonSections(compactLayoutRows(reorderWidgetKeysInCode(newCodeRaw))))

    $visualBuilderState.set({
      ...currentState,
      widgets,
      code: newCode
    })
  },

  // Atualizar especificação de uma Row (columns/gaps por breakpoint)
  updateRowSpec: (rowId: string, spec: { desktop: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number }, tablet: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number }, mobile: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number } }) => {
    const current = $visualBuilderState.get();
    const code = current.code || '';
    const isDsl = code.trim().startsWith('<');
    if (isDsl) {
      // Atualiza atributos do <row id="..."> no DSL
      const rx = new RegExp(`<row\\b([^>]*)\\bid=\\"${rowId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\"[^>]*>`, 'i');
      const m = code.match(rx);
      if (!m) return; // Row não encontrada
      const openTag = m[0];
      // Helper para set atributo/atualizar
      const setAttr = (tag: string, name: string, value?: string | number) => {
        if (value === undefined || value === null) return tag;
        const v = String(value);
        const re = new RegExp(`(\\b${name}\\=\\")[^\\"]*(\\")`, 'i');
        if (re.test(tag)) return tag.replace(re, `$1${v}$2`);
        const idx = tag.indexOf('>');
        return tag.slice(0, idx) + ` ${name}="${v}"` + tag.slice(idx);
      };
      let newOpen = openTag;
      newOpen = setAttr(newOpen, 'cols-d', spec.desktop.columns);
      newOpen = setAttr(newOpen, 'cols-t', spec.tablet.columns);
      newOpen = setAttr(newOpen, 'cols-m', spec.mobile.columns);
      // Gaps preferem valor por breakpoint; como DSL de row tem único gap-x/gap-y, usamos desktop como fonte
      newOpen = setAttr(newOpen, 'gap-x', spec.desktop.gapX ?? 16);
      newOpen = setAttr(newOpen, 'gap-y', spec.desktop.gapY ?? 0);
      if (spec.desktop.autoRowHeight !== undefined) newOpen = setAttr(newOpen, 'auto-row-height', spec.desktop.autoRowHeight);
      const newCode = code.replace(openTag, newOpen);
      visualBuilderActions.updateCode(newCode);
      return;
    }
    // JSON mode: atualiza config.layout.rows
    try {
      const root = JSON.parse(code) as { config?: import('@/components/visual-builder/ConfigParser').GridConfig; [k: string]: unknown };
      const cfg = (root.config || current.gridConfig || {}) as import('@/components/visual-builder/ConfigParser').GridConfig;
      // Ensure layout exists (use 'any' to avoid excessive generic gymnastics)
      const layoutAny = (cfg.layout || (cfg.layout = { mode: 'grid-per-row', rows: {} })) as any;
      layoutAny.rows = layoutAny.rows || {};
      layoutAny.rows[rowId] = {
        desktop: { columns: Math.max(1, spec.desktop.columns), gapX: spec.desktop.gapX, gapY: spec.desktop.gapY, autoRowHeight: spec.desktop.autoRowHeight },
        tablet: { columns: Math.max(1, spec.tablet.columns), gapX: spec.tablet.gapX, gapY: spec.tablet.gapY, autoRowHeight: spec.tablet.autoRowHeight },
        mobile: { columns: Math.max(1, spec.mobile.columns), gapX: spec.mobile.gapX, gapY: spec.mobile.gapY, autoRowHeight: spec.mobile.autoRowHeight },
      } as any;
      const nextCode = JSON.stringify({ ...root, config: cfg, widgets: current.widgets }, null, 2);
      visualBuilderActions.updateCode(nextCode);
    } catch {
      // ignore
    }
  },

  // Atualizar atributos de <group id="..."> no DSL (grid mode)
  updateGroupSpec: (groupId: string, spec: { title?: string; subtitle?: string; backgroundColor?: string; borderColor?: string; borderWidth?: number; titleFontFamily?: string; titleFontSize?: number; titleFontWeight?: string | number; titleColor?: string; titleMarginTop?: number; titleMarginRight?: number; titleMarginBottom?: number; titleMarginLeft?: number; subtitleFontFamily?: string; subtitleFontSize?: number; subtitleFontWeight?: string | number; subtitleColor?: string; subtitleMarginTop?: number; subtitleMarginRight?: number; subtitleMarginBottom?: number; subtitleMarginLeft?: number; containerMarginTop?: number; containerMarginRight?: number; containerMarginBottom?: number; containerMarginLeft?: number }) => {
    const current = $visualBuilderState.get();
    const code = current.code || '';
    if (!isLiquidCode(code)) return;

    const tagRe = /<group\b([^>]*)>([\s\S]*?)<\/group>/gi;
    const parseAttrs = (s: string): Record<string, string> => {
      const map: Record<string, string> = {};
      const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;
      for (const m of s.matchAll(attrRegex)) map[m[1]] = m[2];
      return map;
    };
    const buildAttrs = (attrs: Record<string, string>): string => {
      return Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    };

    let replaced = false;
    let nextCode = code;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(code)) !== null) {
      const openAttrsStr = m[1] || '';
      const inner = m[2] || '';
      const whole = m[0];
      const attrs = parseAttrs(openAttrsStr);
      if ((attrs['id'] || '') !== groupId) continue;

      // Update title attribute while preserving others
      if (spec.title !== undefined) attrs['title'] = spec.title;
      // Ensure id preserved
      attrs['id'] = attrs['id'] || groupId;
      const newOpen = `<group ${buildAttrs(attrs)}>`;

      // Update style JSON inside group
      const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/i;
      const sMatch = inner.match(styleRe);
      let styleObj: Record<string, unknown> = {};
      if (sMatch && sMatch[1]) {
        try { styleObj = JSON.parse(sMatch[1].trim()); } catch {}
      }
      const set = (k: string, v: unknown) => { if (v !== undefined && v !== '') styleObj[k] = v; };
      set('subtitle', spec.subtitle);
      set('backgroundColor', spec.backgroundColor);
      set('borderColor', spec.borderColor);
      if (typeof spec.borderWidth === 'number') styleObj['borderWidth'] = spec.borderWidth;
      set('titleFontFamily', spec.titleFontFamily);
      if (typeof spec.titleFontSize === 'number') styleObj['titleFontSize'] = spec.titleFontSize;
      set('titleFontWeight', spec.titleFontWeight as any);
      set('titleColor', spec.titleColor);
      if (typeof spec.titleMarginTop === 'number') styleObj['titleMarginTop'] = spec.titleMarginTop;
      if (typeof spec.titleMarginRight === 'number') styleObj['titleMarginRight'] = spec.titleMarginRight;
      if (typeof spec.titleMarginBottom === 'number') styleObj['titleMarginBottom'] = spec.titleMarginBottom;
      if (typeof spec.titleMarginLeft === 'number') styleObj['titleMarginLeft'] = spec.titleMarginLeft;
      set('subtitleFontFamily', spec.subtitleFontFamily);
      if (typeof spec.subtitleFontSize === 'number') styleObj['subtitleFontSize'] = spec.subtitleFontSize;
      set('subtitleFontWeight', spec.subtitleFontWeight as any);
      set('subtitleColor', spec.subtitleColor);
      if (typeof spec.subtitleMarginTop === 'number') styleObj['subtitleMarginTop'] = spec.subtitleMarginTop;
      if (typeof spec.subtitleMarginRight === 'number') styleObj['subtitleMarginRight'] = spec.subtitleMarginRight;
      if (typeof spec.subtitleMarginBottom === 'number') styleObj['subtitleMarginBottom'] = spec.subtitleMarginBottom;
      if (typeof spec.subtitleMarginLeft === 'number') styleObj['subtitleMarginLeft'] = spec.subtitleMarginLeft;
      if (typeof spec.containerMarginTop === 'number') styleObj['marginTop'] = spec.containerMarginTop;
      if (typeof spec.containerMarginRight === 'number') styleObj['marginRight'] = spec.containerMarginRight;
      if (typeof spec.containerMarginBottom === 'number') styleObj['marginBottom'] = spec.containerMarginBottom;
      if (typeof spec.containerMarginLeft === 'number') styleObj['marginLeft'] = spec.containerMarginLeft;
      const styleJson = JSON.stringify(styleObj);
      let newInner = inner;
      if (sMatch) newInner = inner.replace(styleRe, `<style>${styleJson}</style>`);
      else newInner = `\n  <style>${styleJson}</style>` + inner;

      const newBlock = newOpen + newInner + `</group>`;
      nextCode = nextCode.replace(whole, newBlock);
      replaced = true;
      break;
    }
    if (replaced) visualBuilderActions.updateCode(nextCode);
  },

  // Atualizar código (vem do Monaco Editor)
  updateCode: (code: string) => {
    const parseResult = ConfigParser.parse(code)
    const currentState = $visualBuilderState.get()

  $visualBuilderState.set({
    widgets: parseResult.widgets,
    gridConfig: parseResult.gridConfig,
    code,
    parseErrors: parseResult.errors,
    isValid: parseResult.isValid,
    dashboardTitle: parseResult.dashboardTitle,
    dashboardSubtitle: parseResult.dashboardSubtitle,
    headerConfig: parseResult.headerConfig,
    globalFilters: coerceGlobalFilters(parseResult.globalFilters) || currentState.globalFilters,
    reloadTicks: currentState.reloadTicks || {}
  })
  },

  // Inicializar store com código padrão
  initialize: () => {
    const currentState = $visualBuilderState.get()
    if (currentState.widgets.length > 0) {
      return
    }
    // Modo HTML puro (sem parser de layout). Reutiliza o template padrão único (com header).
    const defaultCode = initialLiquidGrid

    const parseResult = ConfigParser.parse(defaultCode)

    $visualBuilderState.set({
      widgets: parseResult.widgets,
      gridConfig: parseResult.gridConfig,
      code: defaultCode,
      parseErrors: parseResult.errors,
      isValid: parseResult.isValid,
      dashboardTitle: parseResult.dashboardTitle,
      dashboardSubtitle: parseResult.dashboardSubtitle,
      headerConfig: parseResult.headerConfig,
      globalFilters: coerceGlobalFilters(parseResult.globalFilters) || { dateRange: { type: 'last_30_days' } },
      reloadTicks: {}
    })
  },

  // Resetar para estado inicial
  reset: () => {
    $visualBuilderState.set(initialState)
  },

  // Limpar localStorage e resetar
  clearStorage: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    visualBuilderActions.reset()
  },

  // Adicionar novos widgets à store
  addWidgets: (newWidgets: Widget[]) => {
    const currentState = $visualBuilderState.get()
    const updatedWidgets = [...currentState.widgets, ...newWidgets]

    // Extrair tema atual do código
    let currentTheme = 'branco'
    try {
      const parsedUnknown: unknown = JSON.parse(currentState.code)
      if (parsedUnknown && typeof parsedUnknown === 'object') {
        const obj = parsedUnknown as { theme?: unknown }
        if (typeof obj.theme === 'string') currentTheme = obj.theme
      }
    } catch {
      // ignore
    }

    const newCodeRaw = JSON.stringify(
      {
        theme: currentTheme,
        config: currentState.gridConfig,
        widgets: updatedWidgets
      },
      null,
      2
    )
    const newCode = isLiquidCode(currentState.code)
      ? currentState.code
      : compactWidgetHeaders(compactJsonSections(compactLayoutRows(reorderWidgetKeysInCode(newCodeRaw))))

    $visualBuilderState.set({
      ...currentState,
      widgets: updatedWidgets,
      code: newCode,
      reloadTicks: currentState.reloadTicks || {}
    })
  },

  // Atualizar filtros globais
  updateGlobalFilters: (filters: GlobalFilters) => {
    const currentState = $visualBuilderState.get()
    $visualBuilderState.set({
      ...currentState,
      globalFilters: filters
    })
  },

  // Atualizar data no DSL (<dashboard ... date-type=... date-start=... date-end=...>) e refletir na store
  updateGlobalDateInCode: (filters: GlobalFilters) => {
    const currentState = $visualBuilderState.get()
    const code = currentState.code || ''
    if (!isLiquidCode(code)) {
      // Fallback: apenas atualiza os filtros na store
      visualBuilderActions.updateGlobalFilters(filters)
      return
    }
    const m = code.match(/<dashboard\b[^>]*>/i)
    if (!m) {
      visualBuilderActions.updateGlobalFilters(filters)
      return
    }
    const openTag = m[0]
    const attrsStr = openTag.slice('<dashboard'.length, openTag.length - 1)
    // Parse attrs
    const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/g
    const attrs: Record<string, string> = {}
    for (const match of attrsStr.matchAll(attrRegex)) {
      attrs[match[1]] = match[2]
    }
    // Apply new date attrs
    if (filters.dateRange.type === 'custom') {
      attrs['date-type'] = 'custom'
      if (filters.dateRange.startDate) attrs['date-start'] = filters.dateRange.startDate
      if (filters.dateRange.endDate) attrs['date-end'] = filters.dateRange.endDate
    } else {
      attrs['date-type'] = filters.dateRange.type
      delete attrs['date-start']
      delete attrs['date-end']
    }
    // Rebuild tag
    const kv = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')
    const newOpenTag = `<dashboard ${kv}>`
    const newCode = code.replace(openTag, newOpenTag)
    // Update via updateCode (to reparse widgets and globalFilters consistently)
    visualBuilderActions.updateCode(newCode)
  },

  // Upsert <header> in DSL or set dashboardTitle/Subitle + headerConfig in JSON
  updateHeaderInCode: (data: {
    title?: string;
    subtitle?: string;
    titleFontFamily?: string;
    titleFontSize?: number;
    titleFontWeight?: string | number;
    titleColor?: string;
    titleLetterSpacing?: number;
    titleLineHeight?: number | string;
    titleMarginTop?: number; titleMarginRight?: number; titleMarginBottom?: number; titleMarginLeft?: number;
    titleTextTransform?: string; titleTextAlign?: string;
    subtitleFontFamily?: string;
    subtitleFontSize?: number;
    subtitleFontWeight?: string | number;
    subtitleColor?: string;
    subtitleLetterSpacing?: number;
    subtitleLineHeight?: number | string;
    subtitleMarginTop?: number; subtitleMarginRight?: number; subtitleMarginBottom?: number; subtitleMarginLeft?: number;
    subtitleTextTransform?: string; subtitleTextAlign?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | string;
    showDatePicker?: boolean;
    // Datepicker options
    datePickerType?: string;
    datePickerStart?: string;
    datePickerEnd?: string;
    datePickerAlign?: 'left' | 'right' | string;
    datePickerVariant?: 'button' | 'inline' | string;
    datePickerSize?: 'sm' | 'md' | 'lg' | string;
    datePickerMonths?: number;
    datePickerQuickPresets?: boolean;
    datePickerLocale?: string;
    datePickerFormat?: string;
    // Header blocks order (wrappers inside header)
    blocksOrder?: string[];
    // Titles order inside header-titles
    titlesOrder?: Array<'h1'|'h2'>;
  }) => {
    const currentState = $visualBuilderState.get()
    const code = currentState.code || ''
    const safe = (s?: string | number) => (s == null ? '' : String(s))
    const escapeHtml = (s: string) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

    if (isLiquidCode(code)) {
      // Fast path: only reorder existing header blocks if blocksOrder provided
      if (data?.blocksOrder && Array.isArray(data.blocksOrder) && data.blocksOrder.length) {
        const reHdr = /<header\b([^>]*)>([\s\S]*?)<\/header>/i
        const mHdr = code.match(reHdr)
        if (mHdr) {
          const openAttrs = mHdr[1] || ''
          const inner = mHdr[2] || ''
          const reTitles = /<div\b([^>]*)\bid=\"header-titles\"[^>]*>([\s\S]*?)<\/div>/i
          const reActions = /<div\b([^>]*)\bid=\"header-actions\"[^>]*>([\s\S]*?)<\/div>/i
          const mTitles = inner.match(reTitles)
          const mActions = inner.match(reActions)
          const titlesBlk = mTitles ? mTitles[0] : ''
          const actionsBlk = mActions ? mActions[0] : ''
          const blocks: Record<string,string> = { 'header-titles': titlesBlk, 'header-actions': actionsBlk }
          const newInner = data.blocksOrder.map(k => blocks[k]).filter(Boolean).join('\n')
          if (newInner) {
            const newTag = `<header ${openAttrs}>\n${newInner}\n</header>`
            visualBuilderActions.updateCode(code.replace(reHdr, newTag))
            return
          }
        }
      }
      // Fast path: only reorder existing title/subtitle tags inside header-titles
      if (data?.titlesOrder && Array.isArray(data.titlesOrder) && data.titlesOrder.length) {
        const reHdr = /<header\b([^>]*)>([\s\S]*?)<\/header>/i
        const mHdr = code.match(reHdr)
        if (mHdr) {
          const openAttrs = mHdr[1] || ''
          const inner = mHdr[2] || ''
          const reTitlesDiv = /(<div\b([^>]*)\bid=\"header-titles\"[^>]*>)([\s\S]*?)(<\/div>)/i
          const m = inner.match(reTitlesDiv)
          if (m) {
            const openDiv = m[1]
            const titlesInner = m[3] || ''
            const closeDiv = m[4]
            const h1Match = titlesInner.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)
            const h2Match = titlesInner.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/i)
            const map: Record<string,string> = { h1: h1Match ? h1Match[0] : '', h2: h2Match ? h2Match[0] : '' }
            const newTitlesInner = data.titlesOrder.map(k => map[k]).filter(Boolean).join('\n')
            if (newTitlesInner) {
              const newTitlesBlock = openDiv + newTitlesInner + closeDiv
              const replacedInner = inner.replace(reTitlesDiv, newTitlesBlock)
              const newHeader = `<header ${openAttrs}>\n${replacedInner}\n</header>`
              visualBuilderActions.updateCode(code.replace(reHdr, newHeader))
              return
            }
          }
        }
      }

      // 1) Build <header> with inner <h1>/<h2> and kebab-case attrs
      const rePair = /<header\b[^>]*>[\s\S]*?<\/header>/i
      const reSelf = /<header\b[^>]*\/>/i

      const t = safe(data?.title).trim()
      const s = safe(data?.subtitle).trim()
      const headerAttrs: string[] = []
      const h1Attrs: string[] = []
      const h2Attrs: string[] = []
      // Container (header) kebab-case
      if (data?.backgroundColor) headerAttrs.push(`background-color=\"${escapeHtml(safe(data.backgroundColor))}\"`)
      headerAttrs.push(`class=\"w-full grid grid-cols-2\"`)
      if (data?.borderColor) headerAttrs.push(`border-color=\"${escapeHtml(safe(data.borderColor))}\"`)
      if (data?.borderWidth !== undefined) headerAttrs.push(`border-width=\"${escapeHtml(safe(data.borderWidth))}\"`)
      if (data?.borderStyle) headerAttrs.push(`border-style=\"${escapeHtml(safe(data.borderStyle))}\"`)
      if (typeof data?.showDatePicker === 'boolean') headerAttrs.push(`show-date-picker=\"${data.showDatePicker ? 'true' : 'false'}\"`)
      // Title style on <h1>
      if (data?.titleFontFamily) h1Attrs.push(`font-family=\"${escapeHtml(safe(data.titleFontFamily))}\"`)
      if (data?.titleFontSize !== undefined) h1Attrs.push(`font-size=\"${escapeHtml(safe(data.titleFontSize))}\"`)
      if (data?.titleFontWeight !== undefined) h1Attrs.push(`font-weight=\"${escapeHtml(safe(data.titleFontWeight))}\"`)
      if (data?.titleColor) h1Attrs.push(`color=\"${escapeHtml(safe(data.titleColor))}\"`)
      if (data?.titleLetterSpacing !== undefined) h1Attrs.push(`letter-spacing=\"${escapeHtml(safe(data.titleLetterSpacing))}\"`)
      if (data?.titleLineHeight !== undefined) h1Attrs.push(`line-height=\"${escapeHtml(safe(data.titleLineHeight))}\"`)
      if (data?.titleTextAlign) h1Attrs.push(`text-align=\"${escapeHtml(safe(data.titleTextAlign))}\"`)
      if (data?.titleTextTransform) h1Attrs.push(`text-transform=\"${escapeHtml(safe(data.titleTextTransform))}\"`)
      if (data?.titleMarginTop !== undefined) h1Attrs.push(`margin-top=\"${escapeHtml(safe(data.titleMarginTop))}\"`)
      if (data?.titleMarginRight !== undefined) h1Attrs.push(`margin-right=\"${escapeHtml(safe(data.titleMarginRight))}\"`)
      if (data?.titleMarginBottom !== undefined) h1Attrs.push(`margin-bottom=\"${escapeHtml(safe(data.titleMarginBottom))}\"`)
      if (data?.titleMarginLeft !== undefined) h1Attrs.push(`margin-left=\"${escapeHtml(safe(data.titleMarginLeft))}\"`)
      // Subtitle style on <h2>
      if (data?.subtitleFontFamily) h2Attrs.push(`font-family=\"${escapeHtml(safe(data.subtitleFontFamily))}\"`)
      if (data?.subtitleFontSize !== undefined) h2Attrs.push(`font-size=\"${escapeHtml(safe(data.subtitleFontSize))}\"`)
      if (data?.subtitleFontWeight !== undefined) h2Attrs.push(`font-weight=\"${escapeHtml(safe(data.subtitleFontWeight))}\"`)
      if (data?.subtitleColor) h2Attrs.push(`color=\"${escapeHtml(safe(data.subtitleColor))}\"`)
      if (data?.subtitleLetterSpacing !== undefined) h2Attrs.push(`letter-spacing=\"${escapeHtml(safe(data.subtitleLetterSpacing))}\"`)
      if (data?.subtitleLineHeight !== undefined) h2Attrs.push(`line-height=\"${escapeHtml(safe(data.subtitleLineHeight))}\"`)
      if (data?.subtitleTextAlign) h2Attrs.push(`text-align=\"${escapeHtml(safe(data.subtitleTextAlign))}\"`)
      if (data?.subtitleTextTransform) h2Attrs.push(`text-transform=\"${escapeHtml(safe(data.subtitleTextTransform))}\"`)
      if (data?.subtitleMarginTop !== undefined) h2Attrs.push(`margin-top=\"${escapeHtml(safe(data.subtitleMarginTop))}\"`)
      if (data?.subtitleMarginRight !== undefined) h2Attrs.push(`margin-right=\"${escapeHtml(safe(data.subtitleMarginRight))}\"`)
      if (data?.subtitleMarginBottom !== undefined) h2Attrs.push(`margin-bottom=\"${escapeHtml(safe(data.subtitleMarginBottom))}\"`)
      if (data?.subtitleMarginLeft !== undefined) h2Attrs.push(`margin-left=\"${escapeHtml(safe(data.subtitleMarginLeft))}\"`)

      const titleLines: string[] = []
      if (t) titleLines.push(`    <h1${h1Attrs.length ? ' ' + h1Attrs.join(' ') : ''}>${escapeHtml(t)}</h1>`)
      if (s) titleLines.push(`    <h2${h2Attrs.length ? ' ' + h2Attrs.join(' ') : ''}>${escapeHtml(s)}</h2>`)

      // Datepicker tag
      const shouldAddDatepicker = (typeof data?.showDatePicker === 'boolean' ? data.showDatePicker : false)
        || Boolean((data as any).datePickerType || (data as any).datePickerAlign || (data as any).datePickerVariant || (data as any).datePickerSize || (data as any).datePickerMonths || (data as any).datePickerLocale || (data as any).datePickerFormat)
      let datepickerBlock = ''
      if (shouldAddDatepicker) {
        const dp: string[] = []
        const push = (k: string, v: unknown) => { if (v !== undefined && v !== '') dp.push(`${k}=\"${escapeHtml(String(v))}\"`) }
        push('type', (data as any).datePickerType)
        push('start', (data as any).datePickerStart)
        push('end', (data as any).datePickerEnd)
        push('align', (data as any).datePickerAlign)
        push('variant', (data as any).datePickerVariant)
        push('size', (data as any).datePickerSize)
        if (typeof (data as any).datePickerMonths === 'number') push('number-of-months', (data as any).datePickerMonths)
        if (typeof (data as any).datePickerQuickPresets === 'boolean') push('quick-presets', (data as any).datePickerQuickPresets ? 'true' : 'false')
        push('locale', (data as any).datePickerLocale)
        push('format', (data as any).datePickerFormat)
        datepickerBlock = `  <div id=\"header-actions\" class=\"vb-block header-actions p-2 hover:ring-2 hover:ring-blue-400 rounded-md\">\n    <datepicker${dp.length ? ' ' + dp.join(' ') : ''}></datepicker>\n  </div>`
      }

      const titlesBlock = titleLines.length
        ? `  <div id=\"header-titles\" class=\"vb-block header-titles min-w-0 p-2 hover:ring-2 hover:ring-blue-400 rounded-md\">\n${titleLines.join('\n')}\n  </div>`
        : ''

      const blocksMap: Record<string, string> = { 'header-titles': titlesBlock, 'header-actions': datepickerBlock }
      const providedOrder = (data as any).blocksOrder as string[] | undefined
      const order = Array.isArray(providedOrder) && providedOrder.length ? providedOrder : ['header-titles','header-actions']
      const innerBlocks = order.map(k => blocksMap[k]).filter(Boolean).join('\n')
      const tag = `<header${headerAttrs.length ? ' ' + headerAttrs.join(' ') : ''}>\n${innerBlocks}\n</header>`

      if (rePair.test(code)) {
        const next = code.replace(rePair, tag)
        visualBuilderActions.updateCode(next)
        return
      }
      if (reSelf.test(code)) {
        const next = code.replace(reSelf, tag)
        visualBuilderActions.updateCode(next)
        return
      }

      // 2) Insert after <dashboard ...> and any immediate <style> block/comments
      const m = code.match(/<dashboard\b[^>]*>/i)
      if (!m) {
        const next = `${tag}\n${code}`
        visualBuilderActions.updateCode(next)
        return
      }
      const dashOpen = m[0]
      const start = (m.index || 0) + dashOpen.length
      const post = code.slice(start)
      const earlyStyle = post.match(/^\s*(?:<!--[\s\S]*?-->\s*)*(<style\b[\s\S]*?<\/style>)/i)
      if (earlyStyle && typeof earlyStyle.index === 'number') {
        const insertAt = start + (earlyStyle.index + earlyStyle[0].length)
        const next = code.slice(0, insertAt) + `\n  ${tag}\n` + code.slice(insertAt)
        visualBuilderActions.updateCode(next)
      } else {
        const next = code.slice(0, start) + `\n  ${tag}\n` + code.slice(start)
        visualBuilderActions.updateCode(next)
      }
      return
    }

    // JSON: set dashboardTitle/dashboardSubtitle and headerConfig
    try {
      const root = JSON.parse(code || '{}') as { [k: string]: unknown }
      const next = { ...root } as any
      if (data?.title !== undefined) next.dashboardTitle = data.title
      if (data?.subtitle !== undefined) next.dashboardSubtitle = data.subtitle
      const hc: any = { ...(next.headerConfig || {}) }
      const assign = (k: string, v: unknown) => { if (v !== undefined && v !== "") hc[k] = v }
      assign('titleFontFamily', data?.titleFontFamily)
      assign('titleFontSize', data?.titleFontSize)
      assign('titleFontWeight', data?.titleFontWeight)
      assign('titleColor', data?.titleColor)
      assign('subtitleFontFamily', data?.subtitleFontFamily)
      assign('subtitleFontSize', data?.subtitleFontSize)
      assign('subtitleFontWeight', data?.subtitleFontWeight)
      assign('subtitleColor', data?.subtitleColor)
      assign('backgroundColor', data?.backgroundColor)
      assign('borderColor', data?.borderColor)
      assign('borderWidth', data?.borderWidth)
      assign('borderStyle', data?.borderStyle as any)
      if (typeof data?.showDatePicker === 'boolean') assign('showDatePicker', data?.showDatePicker)
      if (Object.keys(hc).length > 0) next.headerConfig = hc
      const nextCode = JSON.stringify(next, null, 2)
      visualBuilderActions.updateCode(nextCode)
    } catch {
      // ignore
    }
  },

  // Reorder first three <p> blocks inside a KPI article by widget id (mapped to h1/h2/h3 order)
  updateKpiTitlesOrderInCode: (kpiId: string, titlesOrder: Array<'h1'|'h2'|'h3'>) => {
    const currentState = $visualBuilderState.get()
    const code = currentState.code || ''
    if (!isLiquidCode(code)) return
    if (!kpiId || !Array.isArray(titlesOrder) || !titlesOrder.length) return

    // Helper to reorder tags within a matched block
    const reorderTags = (whole: string): string => {
      const openMatch = whole.match(/^(<[^>]+>)/i)
      const closeMatch = whole.match(/(<\/[^>]+>)\s*$/i)
      const open = openMatch ? openMatch[1] : ''
      const close = closeMatch ? closeMatch[1] : ''
      const inner = whole.slice(open.length, whole.length - close.length)
      // Grab first three <p> blocks
      const pRe = /<p\b[^>]*>[\s\S]*?<\/p>/gi
      const ps = inner.match(pRe) || []
      const map: Record<'h1'|'h2'|'h3', string> = {
        h1: ps[0] || '',
        h2: ps[1] || '',
        h3: ps[2] || ''
      }
      const ordered = titlesOrder.map(t => map[t]).filter(Boolean)
      // If nothing to reorder, return original
      if (!ordered.length) return whole
      // Replace the first n p-blocks with new order
      let replaced = inner
      // Remove original first three ps
      replaced = replaced.replace(pRe, (m, ...args) => {
        const index = (replaced as any)._pIndex = ((replaced as any)._pIndex || 0) + 1
        return index <= 3 ? '' : m
      })
      ;(replaced as any)._pIndex = 0
      // Prepend ordered blocks at the top of inner
      const newInner = ordered.join('\n') + replaced
      return `${open}\n${newInner}\n${close}`
    }

    // Try to find the KPI as an <article id="..."> ... </article>
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const idEsc = escape(kpiId)
    const reArticle = new RegExp(`<article\\b([^>]*)\\bid=\\"${idEsc}\\"[\\s\\S]*?>[\\s\\S]*?<\\/article>`, 'i')
    const mArt = code.match(reArticle)
    if (mArt && mArt[0]) {
      const whole = mArt[0]
      const nextBlock = reorderTags(whole)
      if (nextBlock !== whole) {
        const next = code.replace(whole, nextBlock)
        visualBuilderActions.updateCode(next)
      }
      return
    }

    // Fallback: try a paired <kpi id="..."> ... </kpi>
    const reKpi = new RegExp(`<kpi\\b([^>]*)\\bid=\\"${idEsc}\\"[\\s\\S]*?>[\\s\\S]*?<\\/kpi>`, 'i')
    const mKpi = code.match(reKpi)
    if (mKpi && mKpi[0]) {
      const whole = mKpi[0]
      const nextBlock = reorderTags(whole)
      if (nextBlock !== whole) {
        const next = code.replace(whole, nextBlock)
        visualBuilderActions.updateCode(next)
      }
    }
  },

  // Update only the in-memory widgets state (no code change)
  updateKpiTitlesOrderInState: (kpiId: string, titlesOrder: Array<'h1'|'h2'|'h3'>) => {
    const current = $visualBuilderState.get()
    const widgets = current.widgets.map(w => {
      if (w.id === kpiId) {
        return { ...w, kpiTitlesOrder: titlesOrder }
      }
      return w
    })
    $visualBuilderState.set({ ...current, widgets })
  },

  // Remove <header> from DSL or clear fields in JSON
  removeHeaderFromCode: () => {
    const currentState = $visualBuilderState.get()
    const code = currentState.code || ''
    if (isLiquidCode(code)) {
      const rePair = /<header\b[^>]*>[\s\S]*?<\/header>/i
      const reSelf = /<header\b[^>]*\/>/i
      let next = code
      if (rePair.test(next)) next = next.replace(rePair, '')
      else if (reSelf.test(next)) next = next.replace(reSelf, '')
      if (next !== code) visualBuilderActions.updateCode(next)
      return
    }
    try {
      const root = JSON.parse(code || '{}') as { [k: string]: unknown }
      if (typeof root === 'object' && root) {
        delete (root as any).dashboardTitle
        delete (root as any).dashboardSubtitle
        delete (root as any).headerConfig
        const nextCode = JSON.stringify(root, null, 2)
        visualBuilderActions.updateCode(nextCode)
      }
    } catch {
      // ignore
    }
  },

  // Migrar title/subtitle do <dashboard> para um <header .../>
  migrateHeaderToTag: () => {
    const currentState = $visualBuilderState.get()
    const code = currentState.code || ''
    if (!isLiquidCode(code)) return
    const dashOpenMatch = code.match(/<dashboard\b[^>]*>/i)
    if (!dashOpenMatch) return
    const openTag = dashOpenMatch[0]
    const attrsStr = openTag.slice('<dashboard'.length, openTag.length - 1)
    const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/g
    const attrs: Record<string, string> = {}
    for (const m of attrsStr.matchAll(attrRegex)) attrs[m[1]] = m[2]
    const title = attrs['title']
    const subtitle = attrs['subtitle']
    if (!title && !subtitle) return
    // Remove from dashboard attrs
    delete attrs['title']
    delete attrs['subtitle']
    const kv = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')
    const newOpenTag = `<dashboard ${kv}>`
    const codeNoDashTitle = code.replace(openTag, newOpenTag)
    // First, apply the dashboard tag change, then upsert header
    visualBuilderActions.updateCode(codeNoDashTitle)
    visualBuilderActions.updateHeaderInCode({ title, subtitle })
  },

  // Resetar filtros globais
  resetGlobalFilters: () => {
    const currentState = $visualBuilderState.get()
    $visualBuilderState.set({
      ...currentState,
      globalFilters: {
        dateRange: {
          type: 'last_30_days'
        }
      }
    })
  },

  // Bump reload tick for a specific widget (forces data refetch)
  bumpReloadTick: (widgetId: string) => {
    const currentState = $visualBuilderState.get()
    const nextTicks = { ...(currentState.reloadTicks || {}) }
    nextTicks[widgetId] = (nextTicks[widgetId] || 0) + 1
    $visualBuilderState.set({ ...currentState, reloadTicks: nextTicks })
  }
}
