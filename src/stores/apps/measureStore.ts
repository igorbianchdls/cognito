import { atom } from 'nanostores'

export interface CustomMeasure {
  id: string
  name: string
  column: string
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN'
  tableId: string
  expression: string // Ex: "SUM(receita)"
  createdAt: string
}

// Store to hold measures by table ID
export const measuresStore = atom<Record<string, CustomMeasure[]>>({})

// Load from localStorage on init
if (typeof window !== 'undefined') {
  const savedMeasures = localStorage.getItem('customMeasures')
  if (savedMeasures) {
    try {
      const parsed = JSON.parse(savedMeasures)
      measuresStore.set(parsed)
    } catch (error) {
      console.warn('Failed to parse saved measures:', error)
    }
  }
}

// Save to localStorage when store changes
if (typeof window !== 'undefined') {
  measuresStore.subscribe((measures) => {
    localStorage.setItem('customMeasures', JSON.stringify(measures))
  })
}

// Actions
export const measureActions = {
  // Add a new measure
  addMeasure: (measure: Omit<CustomMeasure, 'id' | 'expression' | 'createdAt'>) => {
    const newMeasure: CustomMeasure = {
      ...measure,
      id: `measure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expression: `${measure.aggregation}(${measure.column})`,
      createdAt: new Date().toISOString()
    }

    const current = measuresStore.get()
    const tableMeasures = current[measure.tableId] || []
    
    measuresStore.set({
      ...current,
      [measure.tableId]: [...tableMeasures, newMeasure]
    })

    return newMeasure
  },

  // Remove a measure
  removeMeasure: (tableId: string, measureId: string) => {
    const current = measuresStore.get()
    const tableMeasures = current[tableId] || []
    
    measuresStore.set({
      ...current,
      [tableId]: tableMeasures.filter(measure => measure.id !== measureId)
    })
  },

  // Get measures for a specific table
  getMeasures: (tableId: string): CustomMeasure[] => {
    const current = measuresStore.get()
    return current[tableId] || []
  },

  // Get all measures
  getAllMeasures: (): Record<string, CustomMeasure[]> => {
    return measuresStore.get()
  },

  // Clear all measures for a table
  clearTableMeasures: (tableId: string) => {
    const current = measuresStore.get()
    const updated = { ...current }
    delete updated[tableId]
    measuresStore.set(updated)
  },

  // Clear all measures
  clearAllMeasures: () => {
    measuresStore.set({})
  }
}