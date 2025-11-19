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
  <row id="1" cols-d="4" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
    <widget id="faturamento_total" type="kpi" order="1" span-d="1" span-t="1" span-m="1" height="150" title="💰 Faturamento Total">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"item_subtotal","y":"item_subtotal","aggregation":"SUM"},
         "kpiConfig":{"unit":"R$","visualizationType":"card"}}
      </config>
    </widget>
    <widget id="total_pedidos" type="kpi" order="2" span-d="1" span-t="1" span-m="1" height="150" title="📦 Total de Itens">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"item_id","y":"item_id","aggregation":"COUNT"},
         "kpiConfig":{"visualizationType":"card"}}
      </config>
    </widget>
    <widget id="ticket_medio" type="kpi" order="3" span-d="1" span-t="1" span-m="1" height="150" title="🎯 Ticket Médio">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"item_subtotal","y":"item_subtotal","aggregation":"AVG"},
         "kpiConfig":{"unit":"R$","visualizationType":"card"}}
      </config>
    </widget>
    <widget id="itens_vendidos" type="kpi" order="4" span-d="1" span-t="1" span-m="1" height="150" title="📊 Itens Vendidos">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"quantidade","y":"quantidade","aggregation":"SUM"},
         "kpiConfig":{"visualizationType":"card"}}
      </config>
    </widget>
  </row>

  <row id="4" cols-d="2" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
    <widget id="vendas_centro_lucro" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="320" title="💼 Vendas por Centro de Lucro">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"centro_lucro_nome","y":"item_subtotal","aggregation":"SUM"},
         "barConfig":{"styling":{"showLegend":false,"showGrid":true,"marginBottom":40,"barColor":"#8b5cf6"}}}
      </config>
    </widget>
    <widget id="vendas_campanha" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="320" title="🎯 Vendas por Campanha">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"campanha_venda_nome","y":"item_subtotal","aggregation":"SUM"},
         "barConfig":{"styling":{"showLegend":false,"showGrid":true,"marginBottom":40,"barColor":"#ec4899"}}}
      </config>
    </widget>
  </row>

  <row id="2" cols-d="3" cols-t="1" cols-m="1" gap-x="16" gap-y="16">
    <widget id="faturamento_mensal" type="line" order="1" span-d="1" span-t="1" span-m="1" height="320" title="📈 Faturamento Mensal">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"data_pedido","y":"item_subtotal","aggregation":"SUM"},
         "lineConfig":{"styling":{"showLegend":false,"showGrid":true,"marginBottom":40}}}
      </config>
    </widget>
    <widget id="top_produtos" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="320" title="🏆 Top 10 Produtos">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"produto_nome","y":"item_subtotal","aggregation":"SUM"},
         "barConfig":{"styling":{"showLegend":false,"showGrid":true,"marginBottom":40,"barColor":"#3b82f6"}}}
      </config>
    </widget>
    <widget id="vendas_canal" type="pie" order="3" span-d="1" span-t="1" span-m="1" height="320" title="📱 Vendas por Canal">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"canal_venda_nome","y":"item_subtotal","aggregation":"SUM"},
         "pieConfig":{"styling":{"showLegend":true,"showGrid":false,"marginBottom":40}}}
      </config>
    </widget>
  </row>

  <row id="3" cols-d="2" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
    <widget id="vendas_vendedor" type="bar" order="1" span-d="1" span-t="1" span-m="1" height="320" title="👤 Vendas por Vendedor">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"vendedor_nome","y":"item_subtotal","aggregation":"SUM"},
         "barConfig":{}}
      </config>
    </widget>
    <widget id="vendas_filial" type="bar" order="2" span-d="1" span-t="1" span-m="1" height="320" title="🏢 Vendas por Filial">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"filial_nome","y":"item_subtotal","aggregation":"SUM"},
         "barConfig":{}}
      </config>
    </widget>
  </row>

  <row id="5" cols-d="2" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
    <widget id="vendedores_por_territorio" type="stackedbar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="🏆 Top 5 Vendedores por Território">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","dimension1":"territorio_nome","dimension2":"vendedor_nome","field":"item_subtotal","aggregation":"SUM","limit":5},
         "stackedBarConfig":{"styling":{"layout":"vertical","enableGridX":false,"enableGridY":true,"marginBottom":40}}}
      </config>
    </widget>
    <widget id="vendedores_por_territorio_horizontal" type="stackedbar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="🏆 Top 5 Vendedores por Território (Horizontal)">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","dimension1":"territorio_nome","dimension2":"vendedor_nome","field":"item_subtotal","aggregation":"SUM","limit":5},
         "stackedBarConfig":{"styling":{"layout":"horizontal","enableGridX":true,"enableGridY":false,"marginBottom":50}}}
      </config>
    </widget>
  </row>

  <row id="6" cols-d="2" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
    <widget id="comparativo_territorio_vendedor_grouped" type="groupedbar" order="1" span-d="1" span-t="1" span-m="1" height="360" title="📊 Comparativo Vendedores por Território (Grouped)">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","dimension1":"territorio_nome","dimension2":"vendedor_nome","field":"item_subtotal","aggregation":"SUM","limit":5},
         "groupedBarConfig":{"styling":{"layout":"vertical","enableGridX":false,"enableGridY":true,"marginBottom":40}}}
      </config>
    </widget>
    <widget id="comparativo_territorio_vendedor_grouped_horizontal" type="groupedbar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="📊 Comparativo Vendedores por Território (Grouped • Horizontal)">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","dimension1":"territorio_nome","dimension2":"vendedor_nome","field":"item_subtotal","aggregation":"SUM","limit":5},
         "groupedBarConfig":{"styling":{"layout":"horizontal","enableGridX":true,"enableGridY":false,"marginBottom":50}}}
      </config>
    </widget>
  </row>

  <row id="7" cols-d="2" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
    <widget id="evolucao_empilhado_sem_area" type="stackedlines" order="1" span-d="2" span-t="2" span-m="1" height="360" title="📈 Evolução (Empilhado) por Vendedor • Sem Área">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","dimension1":"territorio_nome","dimension2":"vendedor_nome","field":"item_subtotal","aggregation":"SUM","limit":5},
         "stackedLinesConfig":{"styling":{"enableArea":false,"enableGridX":false,"enableGridY":true,"marginBottom":40}}}
      </config>
    </widget>
  </row>

  <row id="8" cols-d="2" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
    <widget id="radial_stacked_canais" type="radialstacked" order="1" span-d="1" span-t="1" span-m="1" height="320" title="🧭 Distribuição de Vendas por Canal (Radial Stacked)">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","dimension1":"territorio_nome","dimension2":"canal_venda_nome","field":"item_subtotal","aggregation":"SUM","limit":2},
         "radialStackedConfig":{"styling":{"startAngle":180,"endAngle":0,"innerRadius":80,"outerRadius":130,"cornerRadius":5}}}
      </config>
    </widget>
    <widget id="pivot_vendedor_canal" type="pivotbar" order="2" span-d="1" span-t="1" span-m="1" height="360" title="Vendedor x Canal • Faturamento">
      <config>
        {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","dimension1":"vendedor_nome","dimension2":"canal_venda_nome","measure":"faturamento","aggregation":"SUM","limit":8},
         "pivotBarConfig":{"styling":{"layout":"vertical","groupMode":"grouped","enableGridX":false,"enableGridY":true,"containerBorderVariant":"smooth","containerBorderWidth":1}}}
      </config>
    </widget>
  </row>

  <row id="9" cols-d="2" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
    <widget id="insights_card_2" type="insights2" order="1" span-d="1" span-t="1" span-m="1" height="140" title="Insights">
      <config>
        {"insights2Config":{
          "title":"Insights",
          "items":[
            {"id":"i1","variant":"risk","label":"Supply Risk","link":{"text":"Ethiopia Yirgacheffe"},"tail":"may run out in less than 3 days"},
            {"id":"i2","variant":"slow","label":"Slow Stock","link":{"text":"Costa Rican Tarrazú"},"tail":"sitting unsold in inventory"}
          ],
          "styling": {"compact": true, "borderRadius": 8}
        }}
      </config>
    </widget>
  </row>
</dashboard>`

// Example in grid-per-column mode
export const initialDslColumns = `<dashboard theme="branco" title="Dashboard (Colunas)" subtitle="Layout por colunas" layout-mode="grid-per-column" cols-d="3" cols-t="2" cols-m="1" gap-x="16" gap-y="16">
  <columns>
    <column id="1">
      <widget id="kpi_faturamento" type="kpi" order="1" span-d="1" height="150" title="💰 Faturamento Total">
        <config>
          {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"item_subtotal","y":"item_subtotal","aggregation":"SUM"},
           "kpiConfig":{"unit":"R$","visualizationType":"card"}}
        </config>
      </widget>
      <widget id="chart_faturamento_mensal" type="line" order="2" span-d="2" height="320" title="📈 Faturamento Mensal">
        <config>
          {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"data_pedido","y":"item_subtotal","aggregation":"SUM"},
           "lineConfig":{"styling":{"showLegend":false,"showGrid":true,"marginBottom":40}}}
        </config>
      </widget>
    </column>
    <column id="2">
      <widget id="kpi_total_itens" type="kpi" order="1" span-d="1" height="150" title="📦 Total de Itens">
        <config>
          {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"item_id","y":"item_id","aggregation":"COUNT"},
           "kpiConfig":{"visualizationType":"card"}}
        </config>
      </widget>
      <widget id="chart_top_produtos" type="bar" order="3" span-d="1" height="320" title="🏆 Top 10 Produtos">
        <config>
          {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"produto_nome","y":"item_subtotal","aggregation":"SUM"},
           "barConfig":{"styling":{"showLegend":false,"showGrid":true,"marginBottom":40,"barColor":"#3b82f6"}}}
        </config>
      </widget>
    </column>
    <column id="3">
      <widget id="kpi_ticket_medio" type="kpi" order="1" span-d="1" height="150" title="🎯 Ticket Médio">
        <config>
          {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"item_subtotal","y":"item_subtotal","aggregation":"AVG"},
           "kpiConfig":{"unit":"R$","visualizationType":"card"}}
        </config>
      </widget>
      <widget id="chart_vendas_canal" type="pie" order="2" span-d="1" height="320" title="📱 Vendas por Canal">
        <config>
          {"dataSource":{"schema":"vendas","table":"vw_pedidos_completo","x":"canal_venda_nome","y":"item_subtotal","aggregation":"SUM"},
           "pieConfig":{"styling":{"showLegend":true,"showGrid":false,"marginBottom":40}}}
        </config>
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
      type: 'last_30_days'
    }
  }
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
      globalFilters: currentState.globalFilters
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
      }
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
      code: newCode
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
  }
}
