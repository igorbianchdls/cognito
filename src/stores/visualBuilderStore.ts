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

// New DSL initial code (HTML-like)
export const initialDsl = `<dashboard theme="branco" title="Dashboard de Vendas" subtitle="Análise de desempenho comercial" layout-mode="grid-per-row">
  <!-- KPIs (6 em uma linha) - Foco: Novembro/2025 via filtros globais -->
  <row id="kpis" cols-d="6" cols-t="3" cols-m="2" gap-x="12" gap-y="12">
    <widget id="kpi_meta" type="kpi" order="1" span-d="1" span-t="1" span-m="1" height="150" title="Meta de Vendas">
      <datasource schema="comercial" table="vw_vendas_metas" measure="SUM(meta_faturamento_territorio)" />
      <styling tw="kpi:viz:card kpi:unit:R$" />
    </widget>
    <widget id="kpi_vendas" type="kpi" order="2" span-d="1" span-t="1" span-m="1" height="150" title="Vendas">
      <datasource schema="comercial" table="vendas_vw" measure="SUM(item_subtotal)" />
      <styling tw="kpi:viz:card kpi:unit:R$" />
    </widget>
    <widget id="kpi_percent_meta" type="kpi" order="3" span-d="1" span-t="1" span-m="1" height="150" title="% da Meta">
      <datasource schema="comercial" table="vw_vendas_metas" measure="(SUM(subtotal)/NULLIF(SUM(meta_faturamento_territorio),0))*100" />
      <styling tw="kpi:viz:card" />
    </widget>
    <widget id="kpi_ticket_medio" type="kpi" order="4" span-d="1" span-t="1" span-m="1" height="150" title="Ticket Médio">
      <datasource schema="comercial" table="vendas_vw" measure="SUM(item_subtotal)/COUNT_DISTINCT(pedido_id)" />
      <styling tw="kpi:viz:card kpi:unit:R$" />
    </widget>
    <widget id="kpi_pedidos" type="kpi" order="5" span-d="1" span-t="1" span-m="1" height="150" title="Pedidos">
      <datasource schema="comercial" table="vendas_vw" measure="COUNT_DISTINCT(pedido_id)" />
      <styling tw="kpi:viz:card" />
    </widget>
    <widget id="kpi_clientes" type="kpi" order="6" span-d="1" span-t="1" span-m="1" height="150" title="Clientes">
      <datasource schema="comercial" table="vendas_vw" measure="COUNT_DISTINCT(cliente_id)" />
      <styling tw="kpi:viz:card" />
    </widget>
  </row>

  <!-- Meta x Realizado • Vendedor -->
  <row id="mxr_vendedor" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <widget id="mxr_vend_fat" type="comparebar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="💰 Meta x Faturamento por Vendedor">
      <datasource schema="comercial" table="vw_vendas_metas" dimension="vendedor_nome" measureGoal="meta_faturamento_vendedor" measureActual="subtotal" where="EXTRACT(YEAR FROM data_pedido)=2025 AND EXTRACT(MONTH FROM data_pedido)=11" />
      <styling tw="group:grouped layout:horizontal legend:on mb:32" />
    </widget>
    <widget id="mxr_vend_ticket" type="comparebar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="🎯 Meta x Ticket Médio por Vendedor">
      <datasource schema="comercial" table="vw_vendas_metas" dimension="vendedor_nome" measureGoal="meta_ticket_vendedor" measureActual="ticket_medio" where="EXTRACT(YEAR FROM data_pedido)=2025 AND EXTRACT(MONTH FROM data_pedido)=11" />
      <styling tw="group:grouped layout:horizontal legend:on mb:32" />
    </widget>
    <widget id="mxr_vend_novos" type="comparebar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="👥 Meta x Novos Clientes por Vendedor">
      <datasource schema="comercial" table="vw_vendas_metas" dimension="vendedor_nome" measureGoal="meta_novos_clientes_vendedor" measureActual="novos_clientes" where="EXTRACT(YEAR FROM data_pedido)=2025 AND EXTRACT(MONTH FROM data_pedido)=11" />
      <styling tw="group:grouped layout:horizontal legend:on mb:32" />
    </widget>
  </row>

  <!-- Meta x Realizado • Território -->
  <row id="mxr_territorio" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <widget id="mxr_terr_fat" type="comparebar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="💰 Meta x Faturamento por Território">
      <datasource schema="comercial" table="vw_vendas_metas" dimension="territorio_nome" measureGoal="meta_faturamento_territorio" measureActual="subtotal" where="EXTRACT(YEAR FROM data_pedido)=2025 AND EXTRACT(MONTH FROM data_pedido)=11" />
      <styling tw="group:grouped layout:horizontal legend:on mb:32" />
    </widget>
    <widget id="mxr_terr_ticket" type="comparebar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="🎯 Meta x Ticket Médio por Território">
      <datasource schema="comercial" table="vw_vendas_metas" dimension="territorio_nome" measureGoal="meta_ticket_territorio" measureActual="ticket_medio" where="EXTRACT(YEAR FROM data_pedido)=2025 AND EXTRACT(MONTH FROM data_pedido)=11" />
      <styling tw="group:grouped layout:horizontal legend:on mb:32" />
    </widget>
    <widget id="mxr_terr_novos" type="comparebar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="👥 Meta x Novos Clientes por Território">
      <datasource schema="comercial" table="vw_vendas_metas" dimension="territorio_nome" measureGoal="meta_novos_clientes_territorio" measureActual="novos_clientes" where="EXTRACT(YEAR FROM data_pedido)=2025 AND EXTRACT(MONTH FROM data_pedido)=11" />
      <styling tw="group:grouped layout:horizontal legend:on mb:32" />
    </widget>
  </row>

  <!-- Agregados: Serviços e Categorias (3 por linha) -->
  <row id="agg_1" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <widget id="vendas_servico" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Vendas por Serviço">
      <datasource schema="comercial" table="vendas_vw" dimension="servico_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
    <widget id="fat_categoria" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Faturamento por Categoria de Serviço">
      <datasource schema="comercial" table="vendas_vw" dimension="categoria_servico_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
    <widget id="ticket_categoria" type="bar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="Ticket Médio por Categoria de Serviço">
      <datasource schema="comercial" table="vendas_vw" dimension="categoria_servico_nome" measure="SUM(item_subtotal)/COUNT_DISTINCT(pedido_id)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
  </row>

  <!-- Agregados: Categorias e Canais -->
  <row id="agg_2" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <widget id="pedidos_categoria" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Pedidos por Categoria de Serviço">
      <datasource schema="comercial" table="vendas_vw" dimension="categoria_servico_nome" measure="COUNT_DISTINCT(pedido_id)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
    <widget id="vendas_canal" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Vendas por Canal">
      <datasource schema="comercial" table="vendas_vw" dimension="canal_venda_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
    <widget id="fat_canal_distrib" type="bar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="Faturamento por Canal de Distribuição">
      <datasource schema="comercial" table="vendas_vw" dimension="canal_distribuicao_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
  </row>

  <!-- Agregados: Canais de Distribuição e Territórios -->
  <row id="agg_3" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <widget id="ticket_canal_distrib" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Ticket Médio por Canal de Distribuição">
      <datasource schema="comercial" table="vendas_vw" dimension="canal_distribuicao_nome" measure="SUM(item_subtotal)/COUNT_DISTINCT(pedido_id)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
    <widget id="pedidos_canal_distrib" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Pedidos por Canal de Distribuição">
      <datasource schema="comercial" table="vendas_vw" dimension="canal_distribuicao_nome" measure="COUNT_DISTINCT(pedido_id)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
    <widget id="vendas_territorio" type="bar" order="3" span-d="1" span-t="1" span-m="1" height="360" title="Vendas por Território">
      <datasource schema="comercial" table="vendas_vw" dimension="territorio_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
  </row>

  <!-- Agregados: Clientes e Filial -->
  <row id="agg_4" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <widget id="top_clientes" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="Top Clientes">
      <datasource schema="comercial" table="vendas_vw" dimension="cliente_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
    <widget id="fat_filial" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Faturamento por Filial">
      <datasource schema="comercial" table="vendas_vw" dimension="filial_nome" measure="SUM(item_subtotal)" />
      <styling tw="legend:off grid:on mb:32" />
    </widget>
  </row>
</dashboard>`

// Example in grid-per-column mode
export const initialDslColumns = `<dashboard theme="branco" title="Dashboard (Colunas)" subtitle="Layout por colunas" layout-mode="grid-per-column" cols-d="3" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
  <columns>
    <column id="1">
      <widget id="kpi_faturamento" type="kpi" order="1" span-d="1" height="150" title="💰 Faturamento Total">
        <datasource schema="vendas" table="vw_pedidos_completo" measure="item_subtotal" agg="SUM" />
        <styling tw="kpi:unit:R$ kpi:viz:card" />
      </widget>
      <widget id="chart_faturamento_mensal" type="line" order="2" span-d="2" height="420" title="📈 Faturamento Mensal">
        <datasource schema="vendas" table="vw_pedidos_completo" dimension="data_pedido" measure="item_subtotal" agg="SUM" />
        <styling tw="legend:off grid:on mb:40" />
      </widget>
    </column>
    <column id="2">
      <widget id="kpi_total_itens" type="kpi" order="1" span-d="1" height="150" title="📦 Total de Itens">
        <datasource schema="vendas" table="vw_pedidos_completo" measure="item_id" agg="COUNT" />
        <styling tw="kpi:viz:card" />
      </widget>
      <widget id="chart_top_produtos" type="bar" order="3" span-d="1" height="420" title="🏆 Top 10 Produtos">
        <datasource schema="vendas" table="vw_pedidos_completo" dimension="produto_nome" measure="item_subtotal" agg="SUM" />
        <styling tw="legend:off grid:on mb:40 bar:color:#3b82f6" />
      </widget>
    </column>
    <column id="3">
      <widget id="kpi_ticket_medio" type="kpi" order="1" span-d="1" height="150" title="🎯 Ticket Médio">
        <datasource schema="vendas" table="vw_pedidos_completo" measure="item_subtotal" agg="AVG" />
        <styling tw="kpi:unit:R$ kpi:viz:card" />
      </widget>
      <widget id="chart_vendas_canal" type="pie" order="2" span-d="1" height="420" title="📱 Vendas por Canal">
        <datasource schema="vendas" table="vw_pedidos_completo" dimension="canal_venda_nome" measure="item_subtotal" agg="SUM" />
        <styling tw="legend:on grid:off mb:40" />
      </widget>
    </column>
  </columns>
</dashboard>`

// Parse do código inicial para ter widgets desde o início
const initialParseResult = ConfigParser.parse(initialDsl)

// Use a compact view when code is JSON; keep as-is for DSL
const isDslCode = (code: string) => code.trim().startsWith('<')
const compactInitialCode = isDslCode(initialDsl)
  ? initialDsl
  : compactWidgetHeaders(compactJsonSections(compactLayoutRows(reorderWidgetKeysInCode(initialDsl))))

const initialState: VisualBuilderState = {
  widgets: initialParseResult.widgets,
  gridConfig: initialParseResult.gridConfig,
  code: compactInitialCode,
  parseErrors: initialParseResult.errors,
  isValid: initialParseResult.isValid,
  dashboardTitle: initialParseResult.dashboardTitle,
  dashboardSubtitle: initialParseResult.dashboardSubtitle,
  globalFilters: {
    dateRange: {
      type: 'custom',
      startDate: '2025-11-01',
      endDate: '2025-11-30'
    }
  },
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

    const newCode = isDslCode(currentState.code)
      ? (() => {
          // Serialize DSL: update order and (in per-column mode) column (col-d)
          let dsl = currentState.code
          const isPerColumn = /layout-mode\s*=\s*"grid-per-column"/.test(dsl)

          const escapeId = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const setAttrOnWidget = (source: string, id: string, name: string, value: string): string => {
            const re = new RegExp(`(<widget\\b[^>]*\\bid=\"${escapeId(id)}\"[^>]*)(\\/?>)`, 'g')
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
            const idRe = new RegExp(`<widget\\b([^>]*)\\bid=\"${escapeId(id)}\"[^>]*>([\\s\\S]*?)<\\/widget>`, 'i')
            return source.replace(idRe, (match: string, wAttrs: string, inner: string) => {
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
          const setConfigOnWidget = (source: string, id: string, updater: (cfg: Record<string, unknown>) => Record<string, unknown>): string => {
            const reWidget = new RegExp(`(<widget\\b[^>]*\\bid=\"${escapeId(id)}\"[^>]*>)([\\s\\S]*?)(<\\/widget>)`, 'i')
            return source.replace(reWidget, (match: string, open: string, inner: string, close: string) => {
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
                dsl = setAttrOnWidget(dsl, w.id, 'order', String(w.order))
              }
              if (isPerColumn) {
                const col = w.gridStart?.desktop
                if (typeof col === 'number' && col >= 1) {
                  dsl = setAttrOnWidget(dsl, w.id, 'col-d', String(col))
                }
              }
              // Update common widget attrs
              if (typeof w.heightPx === 'number') {
                dsl = setAttrOnWidget(dsl, w.id, 'height', String(w.heightPx))
              }
              if (typeof w.title === 'string' && w.title.length > 0) {
                dsl = setAttrOnWidget(dsl, w.id, 'title', w.title)
              }
              if (typeof w.type === 'string' && w.type.length > 0) {
                dsl = setAttrOnWidget(dsl, w.id, 'type', w.type)
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
                } else if (['stackedbar','groupedbar','stackedlines','radialstacked','pivotbar'].includes(t)) {
                  const dim1 = (ds.dimension1 as string | undefined) ?? xDim ?? ''
                  const dim2 = (ds.dimension2 as string | undefined) ?? ''
                  dsAttrs['dimension1'] = dim1 || undefined
                  dsAttrs['dimension2'] = dim2 || undefined
                  dsAttrs['measure'] = measureExpr
                } else if (t === 'comparebar') {
                  const cDim = (ds.dimension as string | undefined) ?? xDim ?? ''
                  const goal = (ds.measureGoal as string | undefined) ?? ''
                  const actual = (ds.measureActual as string | undefined) ?? ''
                  dsAttrs['dimension'] = cDim || undefined
                  dsAttrs['measureGoal'] = goal || undefined
                  dsAttrs['measureActual'] = actual || undefined
              }
              dsl = setAttrOnDatasource(dsl, w.id, dsAttrs)

              // Persist styling colors and margin.left into <config> (supports simple and groupedbar)
              const updateChartConfig = (key: 'barConfig'|'lineConfig'|'pieConfig'|'areaConfig'|'groupedBarConfig', colors?: string[], marginLeft?: number) => {
                if ((!colors || colors.length === 0) && (marginLeft === undefined)) return
                dsl = setConfigOnWidget(dsl, w.id, (cfg) => {
                  const prev = (cfg[key] as Record<string, unknown>) || {}
                  const prevStyling = (prev['styling'] as Record<string, unknown>) || {}
                  const prevMargin = (prev['margin'] as { top?: number; right?: number; bottom?: number; left?: number } | undefined) || {}
                  const nextStyling = { ...prevStyling, ...(colors && colors.length ? { colors } : {}) }
                  const baseMargin = {
                    top: typeof prevMargin.top === 'number' ? prevMargin.top : 20,
                    right: typeof prevMargin.right === 'number' ? prevMargin.right : 20,
                    bottom: typeof prevMargin.bottom === 'number' ? prevMargin.bottom : 40,
                    left: typeof prevMargin.left === 'number' ? prevMargin.left : 40,
                  }
                  const nextMargin = {
                    ...baseMargin,
                    ...(typeof marginLeft === 'number' ? { left: marginLeft } : {}),
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
                const mLeft = w.barConfig?.margin?.left as number | undefined
                updateChartConfig('barConfig', colors, mLeft)
              } else if (t === 'line') {
                const colors = w.lineConfig?.styling?.colors as string[] | undefined
                const mLeft = (w.lineConfig?.margin as { left?: number } | undefined)?.left
                updateChartConfig('lineConfig', colors, mLeft)
              } else if (t === 'pie') {
                const colors = w.pieConfig?.styling?.colors as string[] | undefined
                const mLeft = (w.pieConfig?.margin as { left?: number } | undefined)?.left
                updateChartConfig('pieConfig', colors, mLeft)
              } else if (t === 'area') {
                const colors = w.areaConfig?.styling?.colors as string[] | undefined
                const mLeft = (w.areaConfig?.margin as { left?: number } | undefined)?.left
                updateChartConfig('areaConfig', colors, mLeft)
              } else if (t === 'groupedbar') {
                const colors = (w as unknown as { groupedBarConfig?: { styling?: { colors?: string[] }, margin?: { left?: number } } }).groupedBarConfig?.styling?.colors as string[] | undefined
                const mLeft = (w as unknown as { groupedBarConfig?: { margin?: { left?: number } } }).groupedBarConfig?.margin?.left as number | undefined
                updateChartConfig('groupedBarConfig', colors, mLeft)
              }
              }
            }
          })
          return dsl
        })()
      : compactWidgetHeaders(compactJsonSections(compactLayoutRows(reorderWidgetKeysInCode(newCodeRaw))))

    $visualBuilderState.set({
      ...currentState,
      widgets,
      code: newCode
    })
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
      globalFilters: currentState.globalFilters,
      reloadTicks: currentState.reloadTicks || {}
    })
  },

  // Inicializar store com código padrão
  initialize: () => {
    const currentState = $visualBuilderState.get()
    if (currentState.widgets.length > 0) {
      return
    }

    const parseResult = ConfigParser.parse(initialDsl)

    $visualBuilderState.set({
      widgets: parseResult.widgets,
      gridConfig: parseResult.gridConfig,
      code: initialDsl,
      parseErrors: parseResult.errors,
      isValid: parseResult.isValid,
      dashboardTitle: parseResult.dashboardTitle,
      dashboardSubtitle: parseResult.dashboardSubtitle,
      globalFilters: {
        dateRange: {
          type: 'last_30_days'
        }
      },
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
    const newCode = isDslCode(currentState.code)
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
