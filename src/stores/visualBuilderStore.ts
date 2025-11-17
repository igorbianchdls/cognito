'use client'

import { atom } from 'nanostores'
import { ConfigParser } from '@/components/visual-builder/ConfigParser'
import type { Widget, GridConfig, ParseResult } from '@/components/visual-builder/ConfigParser'

// Re-export types for use in other components
export type { Widget, GridConfig } from '@/components/visual-builder/ConfigParser'

// Tipos para filtros globais
export type DateRangeType = 'today' | 'yesterday' | 'last_7_days' | 'last_14_days' | 'last_30_days' | 'last_90_days' | 'current_month' | 'last_month' | 'custom';

export interface DateRangeFilter {
  type: DateRangeType;
  startDate?: string;
  endDate?: string;
}

export interface GlobalFilters {
  dateRange: DateRangeFilter;
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

const initialCode = `{
  "theme": "branco",
  "dashboardTitle": "Dashboard de Vendas",
  "dashboardSubtitle": "Análise de desempenho comercial",
  "config": {
    "maxRows": 25,
    "rowHeight": 30,
    "height": 1000,
    "cols": 12,
    "backgroundColor": "#171717",
    "borderColor": "#404040"
  },
  "layoutRows": {
    "1": {
      "desktop": 4,
      "tablet": 2,
      "mobile": 1
    },
    "2": {
      "desktop": 2,
      "tablet": 2,
      "mobile": 1
    }
  },
  "widgets": [
    {
      "id": "faturamento_total",
      "type": "kpi",
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 1,
      "heightPx": 150,
      "title": "💰 Faturamento Total",
      "dataSource": {
        "schema": "vendas",
        "table": "vw_pedidos_completo",
        "x": "item_subtotal",
        "y": "item_subtotal",
        "aggregation": "SUM"
      },
      "kpiConfig": {
        "unit": "R$",
        "visualizationType": "card"
      }
    },
    {
      "id": "total_pedidos",
      "type": "kpi",
      "position": { "x": 3, "y": 0, "w": 3, "h": 2 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 2,
      "heightPx": 150,
      "title": "📦 Total de Itens",
      "dataSource": {
        "schema": "vendas",
        "table": "vw_pedidos_completo",
        "x": "item_id",
        "y": "item_id",
        "aggregation": "COUNT"
      },
      "kpiConfig": {
        "visualizationType": "card"
      }
    },
    {
      "id": "ticket_medio",
      "type": "kpi",
      "position": { "x": 6, "y": 0, "w": 3, "h": 2 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 3,
      "heightPx": 150,
      "title": "🎯 Ticket Médio",
      "dataSource": {
        "schema": "vendas",
        "table": "vw_pedidos_completo",
        "x": "item_subtotal",
        "y": "item_subtotal",
        "aggregation": "AVG"
      },
      "kpiConfig": {
        "unit": "R$",
        "visualizationType": "card"
      }
    },
    {
      "id": "itens_vendidos",
      "type": "kpi",
      "position": { "x": 9, "y": 0, "w": 3, "h": 2 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 4,
      "heightPx": 150,
      "title": "📊 Itens Vendidos",
      "dataSource": {
        "schema": "vendas",
        "table": "vw_pedidos_completo",
        "x": "quantidade",
        "y": "quantidade",
        "aggregation": "SUM"
      },
      "kpiConfig": {
        "visualizationType": "card"
      }
    },
    {
      "id": "faturamento_mensal",
      "type": "line",
      "position": { "x": 0, "y": 2, "w": 6, "h": 4 },
      "row": "1",
      "span": { "desktop": 2, "tablet": 2, "mobile": 1 },
      "order": 5,
      "heightPx": 320,
      "title": "📈 Faturamento Mensal",
      "dataSource": {
        "schema": "vendas",
        "table": "vw_pedidos_completo",
        "x": "data_pedido",
        "y": "item_subtotal",
        "aggregation": "SUM"
      },
      "lineConfig": {
        "styling": {
          "showLegend": false,
          "showGrid": true,
          "translateY": 0,
          "marginBottom": 40
        }
      }
    },
    {
      "id": "top_produtos",
      "type": "bar",
      "position": { "x": 6, "y": 2, "w": 6, "h": 4 },
      "row": "1",
      "span": { "desktop": 2, "tablet": 2, "mobile": 1 },
      "order": 6,
      "heightPx": 320,
      "title": "🏆 Top 10 Produtos",
      "dataSource": {
        "schema": "vendas",
        "table": "vw_pedidos_completo",
        "x": "produto_nome",
        "y": "item_subtotal",
        "aggregation": "SUM"
      },
      "barConfig": {
        "styling": {
          "showLegend": false,
          "showGrid": true,
          "translateY": 0,
          "marginBottom": 40
        }
      }
    },
    {
      "id": "vendas_territorio",
      "type": "bar",
      "position": { "x": 0, "y": 6, "w": 6, "h": 4 },
      "row": "2",
      "span": { "desktop": 1, "tablet": 2, "mobile": 1 },
      "order": 7,
      "heightPx": 320,
      "title": "🌎 Vendas por Território",
      "dataSource": {
        "schema": "vendas",
        "table": "vw_pedidos_completo",
        "x": "territorio_nome",
        "y": "item_subtotal",
        "aggregation": "SUM"
      },
      "barConfig": {
        "styling": {
          "showLegend": false,
          "showGrid": true,
          "translateY": 0,
          "marginBottom": 40
        }
      }
    },
    {
      "id": "vendas_canal",
      "type": "pie",
      "position": { "x": 6, "y": 6, "w": 6, "h": 4 },
      "row": "2",
      "span": { "desktop": 1, "tablet": 2, "mobile": 1 },
      "order": 8,
      "heightPx": 320,
      "title": "📱 Vendas por Canal",
      "dataSource": {
        "schema": "vendas",
        "table": "vw_pedidos_completo",
        "x": "canal_venda_nome",
        "y": "item_subtotal",
        "aggregation": "SUM"
      },
      "pieConfig": {
        "styling": {
          "showLegend": true,
          "showGrid": false,
          "translateY": 0,
          "marginBottom": 40
        }
      }
    }
  ]
}`

// Parse do código inicial para ter widgets desde o início
const initialParseResult = ConfigParser.parse(initialCode)

const initialState: VisualBuilderState = {
  widgets: initialParseResult.widgets,
  gridConfig: initialParseResult.gridConfig,
  code: initialCode,
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
      const parsed = JSON.parse(saved)
      console.log('💾 Visual Builder: Carregado do localStorage', {
        widgetsCount: parsed.widgets?.length || 0
      })
      return parsed
    }
  } catch (error) {
    console.error('❌ Error loading visual builder state:', error)
  }
  return null
}

// Função para salvar no localStorage
const saveToStorage = (state: VisualBuilderState) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    console.log('💾 Visual Builder: Salvo no localStorage', {
      widgetsCount: state.widgets.length
    })
  } catch (error) {
    console.error('❌ Error saving visual builder state:', error)
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
    let currentTheme = null
    let currentConfig = null
    let dashboardTitle: string | undefined
    let dashboardSubtitle: string | undefined
    try {
      const parsedCode = JSON.parse(currentState.code)
      currentTheme = parsedCode.theme
      currentConfig = parsedCode.config
      dashboardTitle = parsedCode.dashboardTitle
      dashboardSubtitle = parsedCode.dashboardSubtitle
    } catch (error) {
      console.warn('Erro ao extrair tema/config do código atual:', error)
      currentConfig = currentState.gridConfig // fallback
    }

    const newCode = JSON.stringify({
      ...(currentTheme && { theme: currentTheme }),
      config: currentConfig,
      ...(dashboardTitle ? { dashboardTitle } : {}),
      ...(dashboardSubtitle ? { dashboardSubtitle } : {}),
      widgets
    }, null, 2)

    console.log('🎨 Visual Builder: Updating widgets', { count: widgets.length })

    $visualBuilderState.set({
      ...currentState,
      widgets,
      code: newCode
    })
  },

  // Atualizar código (vem do Monaco Editor)
  updateCode: (code: string) => {
    console.log('📝 Visual Builder: Updating code')

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
      globalFilters: currentState.globalFilters // Preservar filtros existentes
    })
  },

  // Inicializar store com código padrão
  initialize: () => {
    // Se já há estado válido, não sobrescreve
    const currentState = $visualBuilderState.get()
    if (currentState.widgets.length > 0) {
      console.log('🎨 Visual Builder: Estado já inicializado, mantendo widgets existentes')
      return
    }

    console.log('🎨 Visual Builder: Inicializando com código padrão')
    const parseResult = ConfigParser.parse(initialCode)

    $visualBuilderState.set({
      widgets: parseResult.widgets,
      gridConfig: parseResult.gridConfig,
      code: initialCode,
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
    console.log('🔄 Visual Builder: Resetando para estado inicial')
    $visualBuilderState.set(initialState)
  },

  // Limpar localStorage e resetar
  clearStorage: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      console.log('🧹 Visual Builder: localStorage limpo')
    }
    visualBuilderActions.reset()
  },

  // Adicionar novos widgets à store
  addWidgets: (newWidgets: Widget[]) => {
    const currentState = $visualBuilderState.get()
    const updatedWidgets = [...currentState.widgets, ...newWidgets]

    console.log('➕ Visual Builder: Adicionando novos widgets', {
      existing: currentState.widgets.length,
      new: newWidgets.length,
      total: updatedWidgets.length
    })

    // Extrair tema atual do código
    let currentTheme = 'branco'
    try {
      const parsedCode = JSON.parse(currentState.code)
      currentTheme = parsedCode.theme || 'branco'
    } catch (error) {
      console.warn('Erro ao extrair tema do código atual:', error)
    }

    const newCode = JSON.stringify({
      theme: currentTheme,
      config: currentState.gridConfig,
      widgets: updatedWidgets
    }, null, 2)

    $visualBuilderState.set({
      ...currentState,
      widgets: updatedWidgets,
      code: newCode
    })
  },

  // Atualizar filtros globais
  updateGlobalFilters: (filters: GlobalFilters) => {
    const currentState = $visualBuilderState.get()
    
    console.log('🔍 Visual Builder: Updating global filters', filters)
    
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
