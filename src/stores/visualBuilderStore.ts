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
    "maxRows": 20,
    "rowHeight": 30,
    "height": 800,
    "cols": 12,
    "backgroundColor": "#171717",
    "borderColor": "#404040"
  },
  "widgets": [
    {
      "id": "chart1",
      "type": "bar",
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "title": "Events by Type",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "y": "quantity",
        "aggregation": "SUM"
      },
      "barConfig": {
        "_comment_container": "=== PROPS DO CONTAINER/FUNDO DO CHART ===",
        "_comment_glass": "Props para glass morphism e efeitos modernos",
        "styling": {
          "colors": ["#3b82f6", "#10b981", "#f59e0b"],
          "showLegend": true,
          "enableGridX": true,
          "enableGridY": true,
          "borderRadius": 8,
          "_comment_title": "=== CONFIGURAÇÃO DO TÍTULO ===",
          "titleFontFamily": "Inter, Arial, sans-serif",
          "titleFontSize": 18,
          "titleFontWeight": 700,
          "titleColor": "#1e293b",
          "titleMarginTop": 0,
          "titleMarginLeft": 0,
          "titleMarginBottom": 8,
          
          "_comment_subtitle": "=== CONFIGURAÇÃO DO SUBTÍTULO ===",
          "subtitleFontFamily": "Inter, Arial, sans-serif",
          "subtitleFontSize": 14,
          "subtitleFontWeight": 400,
          "subtitleColor": "#64748b",
          "subtitleMarginTop": 0,
          "subtitleMarginLeft": 0,
          "subtitleMarginBottom": 16,
          "marginTop": 20,
          "marginBottom": 0,
          "axisFontSize": 12,
          "axisTextColor": "#64748b",
          "barColor": "#3b82f6",
          
          "_comment_glass_effect": "=== GLASS MORPHISM CONFIG ===",
          "containerBackground": "rgba(255, 255, 255, 0.25)",
          "containerOpacity": 1,
          "containerBackdropFilter": "blur(10px) saturate(200%)",
          "containerBoxShadow": "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          "containerBorder": "1px solid rgba(255, 255, 255, 0.18)",
          
          "_comment_modern_effects": "=== EFEITOS MODERNOS ===",
          "containerFilter": "brightness(1.05)",
          "containerTransform": "perspective(1000px)",
          "containerTransition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          
          "_comment_bar_effects": "=== EFEITOS DAS BARRAS ===",
          "barOpacity": 0.9,
          "barHoverOpacity": 1.0,
          "barBrightness": 1.0,
          "barSaturate": 1.2,
          "barContrast": 1.1,
          "barBoxShadow": "0 2px 4px rgba(0,0,0,0.1)",
          "hoverBrightness": 1.1,
          "hoverSaturate": 1.3,
          "hoverScale": 1.03,
          "transitionDuration": "200ms",
          "transitionEasing": "ease-in-out"
        },
        "margin": {
          "bottom": 0
        },
        "legends": {
          "translateY": 0
        }
      }
    },
    {
      "id": "kpi1",
      "type": "kpi",
      "position": { "x": 6, "y": 0, "w": 3, "h": 2 },
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
        "kpiValueColor": "#059669",
        "kpiValueFontSize": 24,
        "kpiContainerBackgroundColor": "#ecfdf5",
        "status": "on-target"
      }
    },
    {
      "id": "chart2",
      "type": "line",
      "position": { "x": 0, "y": 4, "w": 9, "h": 4 },
      "title": "Quantity Trend",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "y": "quantity",
        "aggregation": "AVG"
      },
      "lineConfig": {
        "styling": {
          "colors": ["#8b5cf6"],
          "showLegend": false,
          "enableGridX": false,
          "enableGridY": true,
          "lineWidth": 3,
          "enablePoints": true,
          "pointSize": 8,
          "curve": "monotoneX",
          "titleFontSize": 16,
          "titleColor": "#374151",
          "titleMarginTop": 0,
          "titleMarginRight": 0,
          "titleMarginBottom": 8,
          "titleMarginLeft": 0,
          "axisFontSize": 11,
          "axisTextColor": "#9ca3af",
          "lineColor": "#8b5cf6",
          "pointColor": "#8b5cf6",
          "pointBorderColor": "#7c3aed",
          "backgroundColor": "#fefefe"
        },
        "margin": {
          "bottom": 0
        },
        "legends": {
          "translateY": 0
        }
      }
    },
    {
      "id": "chart3",
      "type": "pie",
      "position": { "x": 9, "y": 0, "w": 3, "h": 4 },
      "title": "Event Distribution",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "y": "quantity"
      },
      "pieConfig": {
        "styling": {
          "colors": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
          "showLegend": true,
          "titleFontSize": 16,
          "titleColor": "#374151",
          "titleMarginTop": 0,
          "titleMarginRight": 0,
          "titleMarginBottom": 8,
          "titleMarginLeft": 0,
          "axisTextColor": "#64748b",
          "backgroundColor": "#fefefe"
        },
        "margin": {
          "bottom": 0
        },
        "legends": {
          "translateY": 0
        }
      }
    },
    {
      "id": "chart4",
      "type": "area",
      "position": { "x": 9, "y": 4, "w": 3, "h": 4 },
      "title": "Quantity Area",
      "dataSource": {
        "table": "ecommerce",
        "x": "event_name",
        "y": "quantity",
        "aggregation": "AVG"
      },
      "areaConfig": {
        "styling": {
          "colors": ["#8b5cf6"],
          "showLegend": false,
          "titleFontSize": 16,
          "titleColor": "#374151",
          "titleMarginTop": 0,
          "titleMarginRight": 0,
          "titleMarginBottom": 8,
          "titleMarginLeft": 0,
          "axisTextColor": "#64748b",
          "lineColor": "#8b5cf6",
          "pointColor": "#8b5cf6",
          "pointBorderColor": "#7c3aed",
          "backgroundColor": "#fefefe"
        },
        "margin": {
          "bottom": 0
        },
        "legends": {
          "translateY": 0
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
  }
}