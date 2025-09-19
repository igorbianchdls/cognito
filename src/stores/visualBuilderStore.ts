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

const initialState: VisualBuilderState = {
  widgets: [],
  gridConfig: { maxRows: 12, rowHeight: 30, cols: 12 },
  code: `{
  "config": {
    "maxRows": 12,
    "rowHeight": 30,
    "cols": 12
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
        "styling": {
          "colors": ["#3b82f6", "#10b981", "#f59e0b"],
          "showLegend": true,
          "enableGridX": true,
          "enableGridY": true,
          "borderRadius": 8,
          "titleFontSize": 18,
          "titleColor": "#1e293b",
          "marginTop": 20,
          "marginBottom": 40,
          "axisFontSize": 12,
          "axisTextColor": "#64748b",
          "backgroundColor": "#f1f5f9"
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
          "axisFontSize": 11,
          "axisTextColor": "#9ca3af",
          "backgroundColor": "#fefefe"
        }
      }
    }
  ]
}`,
  parseErrors: [],
  isValid: false
}

export const $visualBuilderState = atom<VisualBuilderState>(initialState)

// Actions
export const visualBuilderActions = {
  // Atualizar widgets (vem do GridCanvas)
  updateWidgets: (widgets: Widget[]) => {
    const currentState = $visualBuilderState.get()
    const newCode = JSON.stringify({
      config: currentState.gridConfig,
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
    const parseResult = ConfigParser.parse(initialState.code)

    $visualBuilderState.set({
      widgets: parseResult.widgets,
      gridConfig: parseResult.gridConfig,
      code: initialState.code,
      parseErrors: parseResult.errors,
      isValid: parseResult.isValid
    })
  }
}