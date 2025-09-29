'use client'

import { atom } from 'nanostores'
import { ConfigParser } from '@/components/visual-builder/ConfigParser'
import type { Widget, GridConfig, ParseResult } from '@/components/visual-builder/ConfigParser'

// Re-export types for use in other components
export type { Widget, GridConfig } from '@/components/visual-builder/ConfigParser'

// Estado da store
interface VisualBuilderState {
  widgets: Widget[]
  gridConfig: GridConfig
  code: string
  parseErrors: ParseResult['errors']
  isValid: boolean
}

const initialCode = `{
  "theme": "dark",
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
      "desktop": 3,
      "tablet": 2,
      "mobile": 1
    }
  },
  "widgets": [
    {
      "id": "chart1",
      "type": "bar",
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "row": "1",
      "span": { "desktop": 2, "tablet": 2, "mobile": 1 },
      "order": 1,
      "heightPx": 320,
      "title": "Events by Type",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "y": "quantity",
        "aggregation": "SUM"
      },
      "barConfig": {
        "styling": {
          "showLegend": true,
          "showGrid": true,
          "translateY": 0,
          "marginBottom": 40
        }
      }
    },
    {
      "id": "kpi1",
      "type": "kpi",
      "position": { "x": 6, "y": 0, "w": 3, "h": 2 },
      "row": "2",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 2,
      "heightPx": 150,
      "title": "Total Events",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "aggregation": "COUNT"
      },
      "kpiConfig": {
        "unit": "events",
        "target": 1000,
        "showTarget": true,
        "trend": "increasing",
        "visualizationType": "card",
        "status": "on-target"
      }
    },
    {
      "id": "chart2",
      "type": "line",
      "position": { "x": 0, "y": 4, "w": 9, "h": 4 },
      "row": "1",
      "span": { "desktop": 3, "tablet": 2, "mobile": 1 },
      "order": 3,
      "heightPx": 280,
      "title": "Quantity Trend",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "y": "quantity",
        "aggregation": "AVG"
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
      "id": "chart3",
      "type": "pie",
      "position": { "x": 9, "y": 0, "w": 3, "h": 4 },
      "row": "2",
      "span": { "desktop": 2, "tablet": 1, "mobile": 1 },
      "order": 4,
      "title": "Event Distribution",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "y": "quantity"
      },
      "pieConfig": {
        "styling": {
          "showLegend": true,
          "showGrid": false,
          "translateY": 0,
          "marginBottom": 40
        }
      }
    },
    {
      "id": "chart4",
      "type": "area",
      "position": { "x": 9, "y": 4, "w": 3, "h": 4 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 5,
      "title": "Quantity Area",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "y": "quantity",
        "aggregation": "AVG"
      },
      "areaConfig": {
        "styling": {
          "showLegend": false,
          "showGrid": true,
          "translateY": 0,
          "marginBottom": 40
        }
      }
    },
    {
      "id": "insights1",
      "type": "insights",
      "position": { "x": 0, "y": 8, "w": 4, "h": 6 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 2, "mobile": 1 },
      "order": 6,
      "heightPx": 400,
      "title": "💡 Insights",
      "insightsConfig": {
        "useGlobalStore": true,
        "maxItems": 5,
        "collapsible": true,
        "showActions": true
      }
    },
    {
      "id": "alerts1",
      "type": "alerts",
      "position": { "x": 4, "y": 8, "w": 4, "h": 6 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 2, "mobile": 1 },
      "order": 7,
      "heightPx": 400,
      "title": "⚠️ Alertas",
      "alertsConfig": {
        "useGlobalStore": true,
        "maxItems": 5,
        "collapsible": true,
        "showActions": true,
        "showOnlyCritical": false
      }
    },
    {
      "id": "recommendations1",
      "type": "recommendations",
      "position": { "x": 8, "y": 8, "w": 4, "h": 6 },
      "row": "2",
      "span": { "desktop": 1, "tablet": 2, "mobile": 1 },
      "order": 8,
      "heightPx": 400,
      "title": "🎯 Recomendações",
      "recommendationsConfig": {
        "useGlobalStore": true,
        "maxItems": 5,
        "collapsible": true,
        "showActions": true,
        "priorityFilter": "all"
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
  isValid: initialParseResult.isValid
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
    try {
      const parsedCode = JSON.parse(currentState.code)
      currentTheme = parsedCode.theme
      currentConfig = parsedCode.config
    } catch (error) {
      console.warn('Erro ao extrair tema/config do código atual:', error)
      currentConfig = currentState.gridConfig // fallback
    }

    const newCode = JSON.stringify({
      ...(currentTheme && { theme: currentTheme }),
      config: currentConfig,
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

    $visualBuilderState.set({
      widgets: parseResult.widgets,
      gridConfig: parseResult.gridConfig,
      code,
      parseErrors: parseResult.errors,
      isValid: parseResult.isValid
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
      isValid: parseResult.isValid
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
    let currentTheme = 'light'
    try {
      const parsedCode = JSON.parse(currentState.code)
      currentTheme = parsedCode.theme || 'light'
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
  }
}