'use client'

import { atom } from 'nanostores'
import { ConfigParser } from '@/components/visual-builder/ConfigParser'
import type { Widget, GridConfig, ParseResult } from '@/components/visual-builder/ConfigParser'

// Re-export types for use in other components
export type { Widget, GridConfig } from '@/components/visual-builder/ConfigParser'

// Tipos para filtros globais
export type DateRangeType = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'current_month' | 'last_month' | 'custom';

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
  "dashboardTitle": "Live Dashboard",
  "dashboardSubtitle": "Real-time visualization with Supabase data",
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
    },
    "3": {
      "desktop": 4,
      "tablet": 2,
      "mobile": 1
    }
  },
  "widgets": [
    {
      "id": "gasto_por_plataforma",
      "type": "bar",
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "row": "1",
      "span": { "desktop": 2, "tablet": 2, "mobile": 1 },
      "order": 1,
      "heightPx": 320,
      "title": "📊 Gasto por Plataforma",
      "dataSource": {
        "schema": "marketing",
        "table": "view_trafego_pago",
        "x": "plataforma_conta",
        "y": "gasto",
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
      "id": "total_gasto",
      "type": "kpi",
      "position": { "x": 6, "y": 0, "w": 3, "h": 2 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 2,
      "heightPx": 150,
      "title": "💰 Gasto Total",
      "dataSource": {
        "schema": "marketing",
        "table": "view_trafego_pago",
        "x": "gasto",
        "y": "gasto",
        "aggregation": "SUM"
      },
      "kpiConfig": {
        "unit": "R$",
        "target": 50000,
        "showTarget": true,
        "trend": "increasing",
        "visualizationType": "card",
        "status": "on-target"
      }
    },
    {
      "id": "impressoes_tempo",
      "type": "line",
      "position": { "x": 0, "y": 4, "w": 9, "h": 4 },
      "row": "2",
      "span": { "desktop": 1, "tablet": 2, "mobile": 1 },
      "order": 4,
      "heightPx": 280,
      "title": "📈 Impressões ao Longo do Tempo",
      "dataSource": {
        "schema": "marketing",
        "table": "view_trafego_pago",
        "x": "data_metricas",
        "y": "impressao",
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
      "id": "impressoes_tempo_bar",
      "type": "bar",
      "position": { "x": 0, "y": 8, "w": 6, "h": 4 },
      "row": "2",
      "span": { "desktop": 1, "tablet": 2, "mobile": 1 },
      "order": 5,
      "heightPx": 280,
      "title": "📊 Impressões ao Longo do Tempo (Barras)",
      "dataSource": {
        "schema": "marketing",
        "table": "view_trafego_pago",
        "x": "data_metricas",
        "y": "impressao",
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
      "id": "conversoes_por_dispositivo",
      "type": "pie",
      "position": { "x": 9, "y": 0, "w": 3, "h": 4 },
      "row": "1",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 3,
      "title": "🏆 Top 10 Campanhas por Gasto",
      "dataSource": {
        "schema": "marketing",
        "table": "view_trafego_pago",
        "x": "campanha_nome",
        "y": "gasto",
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
    },
    {
      "id": "roas_medio",
      "type": "kpi",
      "position": { "x": 9, "y": 4, "w": 3, "h": 2 },
      "row": "2",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 5,
      "heightPx": 150,
      "title": "🎯 ROAS Médio",
      "dataSource": {
        "schema": "marketing",
        "table": "view_trafego_pago",
        "x": "roas",
        "y": "roas",
        "aggregation": "AVG"
      },
      "kpiConfig": {
        "unit": "x",
        "target": 3.0,
        "showTarget": true,
        "trend": "increasing",
        "visualizationType": "card",
        "status": "on-target"
      }
    },
    {
      "id": "insights_hero_1",
      "type": "insightsHero",
      "position": { "x": 0, "y": 12, "w": 3, "h": 6 },
      "row": "3",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 7,
      "heightPx": 400,
      "title": "💡 AI Insights (Crimson)",
      "insightsHeroConfig": {
        "variant": "crimsonGlow",
        "autoplayDelay": 5000,
        "showArrows": true,
        "loop": true
      }
    },
    {
      "id": "insights_hero_2",
      "type": "insightsHero",
      "position": { "x": 3, "y": 12, "w": 3, "h": 6 },
      "row": "3",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 8,
      "heightPx": 400,
      "title": "💡 AI Insights (Rose)",
      "insightsHeroConfig": {
        "variant": "roseDawn",
        "autoplayDelay": 6000,
        "showArrows": true,
        "loop": true
      }
    },
    {
      "id": "insights_hero_3",
      "type": "insightsHero",
      "position": { "x": 6, "y": 12, "w": 3, "h": 6 },
      "row": "3",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 9,
      "heightPx": 400,
      "title": "💡 AI Insights (Obsidian)",
      "insightsHeroConfig": {
        "variant": "obsidianBlack",
        "autoplayDelay": 6000,
        "showArrows": true,
        "loop": true
      }
    },
    {
      "id": "insights_hero_4",
      "type": "insightsHero",
      "position": { "x": 9, "y": 12, "w": 3, "h": 6 },
      "row": "3",
      "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
      "order": 10,
      "heightPx": 400,
      "title": "💡 AI Insights (Aurora)",
      "insightsHeroConfig": {
        "variant": "aurora",
        "autoplayDelay": 5000,
        "showArrows": true,
        "loop": true
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
