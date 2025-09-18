'use client'

import { atom } from 'nanostores'
import { ConfigParser } from '@/components/visual-builder/ConfigParser'
import type { Widget, ParseResult } from '@/components/visual-builder/ConfigParser'

// Re-export types for use in other components
export type { Widget } from '@/components/visual-builder/ConfigParser'

// Estado da store
interface VisualBuilderState {
  widgets: Widget[]
  code: string
  parseErrors: ParseResult['errors']
  isValid: boolean
}

const initialState: VisualBuilderState = {
  widgets: [],
  code: `{
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
    const newCode = JSON.stringify({ widgets }, null, 2)

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
      code: initialState.code,
      parseErrors: parseResult.errors,
      isValid: parseResult.isValid
    })
  }
}