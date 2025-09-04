'use client'

import { atom } from 'nanostores'
// import { $widgets, widgetActions } from './widgetStore' // REMOVED: Only KPIs supported now
import { $multiCanvasState, multiCanvasActions } from './multiCanvasStore'
import { isNavigationWidget } from '@/types/apps/droppedWidget'
import type { SavedDashboard } from '@/types/apps/savedDashboard'

const STORAGE_KEY = 'cognito_saved_dashboards'

// Store para dashboards salvos
export const $savedDashboards = atom<SavedDashboard[]>([])

// Função para carregar do localStorage
const loadFromStorage = (): SavedDashboard[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.map((dashboard: SavedDashboard & { createdAt: string }) => ({
        ...dashboard,
        createdAt: new Date(dashboard.createdAt)
      }))
    }
  } catch (error) {
    console.error('Error loading saved dashboards:', error)
  }
  return []
}

// Função para salvar no localStorage
const saveToStorage = (dashboards: readonly SavedDashboard[]) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards))
  } catch (error) {
    console.error('Error saving dashboards to localStorage:', error)
  }
}

// Inicializar store com dados do localStorage
if (typeof window !== 'undefined') {
  $savedDashboards.set(loadFromStorage())
}

// Subscribe para sincronização automática com localStorage
$savedDashboards.subscribe((dashboards) => {
  saveToStorage(dashboards)
})

// Gerar ID único
const generateId = (): string => {
  return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Actions
export const savedDashboardActions = {
  // Salvar dashboard atual
  save: (name: string, description?: string) => {
    const currentWidgets = $widgets.get()
    const multiCanvasState = $multiCanvasState.get()
    
    // Detect if we're in multi-canvas mode
    const hasNavigationWidget = currentWidgets.some(widget => isNavigationWidget(widget))
    const isMultiCanvasMode = hasNavigationWidget && multiCanvasState.hasNavigationWidget
    
    let newDashboard: SavedDashboard
    
    if (isMultiCanvasMode) {
      // Multi-canvas mode: Check if tabs have widgets
      const totalWidgets = multiCanvasState.tabs.reduce((total, tab) => total + tab.widgets.length, 0)
      if (totalWidgets === 0) {
        alert('Não há widgets nas tabs para salvar!')
        return
      }
      
      newDashboard = {
        id: generateId(),
        name: name.trim(),
        description: description?.trim(),
        createdAt: new Date(),
        widgets: JSON.parse(JSON.stringify(currentWidgets)), // For compatibility - includes Navigation Widget
        isMultiCanvas: true,
        multiCanvasState: {
          tabs: JSON.parse(JSON.stringify(multiCanvasState.tabs)), // Deep clone
          activeTab: multiCanvasState.activeTab
        }
      }
      
      const totalTabWidgets = multiCanvasState.tabs.reduce((total, tab) => total + tab.widgets.length, 0)
      console.log('📄 Multi-canvas dashboard saved:', newDashboard.name, 'with', multiCanvasState.tabs.length, 'tabs and', totalTabWidgets, 'widgets')
    } else {
      // Normal single canvas mode
      if (currentWidgets.length === 0) {
        alert('Não há widgets no canvas para salvar!')
        return
      }

      newDashboard = {
        id: generateId(),
        name: name.trim(),
        description: description?.trim(),
        createdAt: new Date(),
        widgets: JSON.parse(JSON.stringify(currentWidgets)), // Deep clone
        isMultiCanvas: false
      }
      
      console.log('📄 Single canvas dashboard saved:', newDashboard.name, 'with', newDashboard.widgets.length, 'widgets')
    }

    const currentDashboards = $savedDashboards.get()
    $savedDashboards.set([...currentDashboards, newDashboard])
  },

  // Carregar dashboard
  load: (id: string) => {
    const dashboards = $savedDashboards.get()
    const dashboard = dashboards.find(d => d.id === id)
    
    if (!dashboard) {
      alert('Dashboard não encontrado!')
      return
    }

    if (dashboard.isMultiCanvas && dashboard.multiCanvasState) {
      // Multi-canvas dashboard: Restore complete structure
      console.log('📄 Loading multi-canvas dashboard:', dashboard.name, 'with', dashboard.multiCanvasState.tabs.length, 'tabs')
      
      // First, clear current state
      // widgetActions.setWidgets([]) // REMOVED: Only KPIs supported now
      
      // Initialize multi-canvas mode with the saved state
      const multiCanvasState = dashboard.multiCanvasState
      
      // Add navigation widget to main store (it should be in dashboard.widgets)
      const navigationWidget = dashboard.widgets.find(w => isNavigationWidget(w))
      if (navigationWidget) {
        // widgetActions.setWidgets([navigationWidget]) // REMOVED: Only KPIs supported now
      }
      
      // Restore multi-canvas state
      if (navigationWidget) {
        multiCanvasActions.initializeMultiCanvas([navigationWidget])
      }
      
      // Restore tabs and their widgets
      const currentState = $multiCanvasState.get()
      const newState = {
        ...currentState,
        tabs: multiCanvasState.tabs,
        activeTab: multiCanvasState.activeTab,
        hasNavigationWidget: true
      }
      
      $multiCanvasState.set(newState)
      
      const totalTabWidgets = multiCanvasState.tabs.reduce((total, tab) => total + tab.widgets.length, 0)
      console.log('📄 Multi-canvas dashboard loaded with', multiCanvasState.tabs.length, 'tabs and', totalTabWidgets, 'widgets')
      
    } else {
      // Single canvas dashboard: Normal loading
      console.log('📄 Loading single canvas dashboard:', dashboard.name, 'with', dashboard.widgets.length, 'widgets')
      
      // If currently in multi-canvas mode, exit it first
      const currentMultiState = $multiCanvasState.get()
      if (currentMultiState.hasNavigationWidget) {
        multiCanvasActions.exitMultiCanvas()
      }
      
      // Load widgets normally
      // widgetActions.setWidgets(dashboard.widgets) // REMOVED: Only KPIs supported now
      console.log('📄 Single canvas dashboard loaded with', dashboard.widgets.length, 'widgets')
    }
  },

  // Excluir dashboard
  delete: (id: string) => {
    const currentDashboards = $savedDashboards.get()
    const filteredDashboards = currentDashboards.filter(d => d.id !== id)
    $savedDashboards.set(filteredDashboards)
    
    console.log('🗑️ Dashboard deleted:', id)
  },

  // Listar todos os dashboards
  list: (): SavedDashboard[] => {
    return $savedDashboards.get()
  },

  // Prompt para salvar com nome
  promptAndSave: () => {
    const name = prompt('Nome do dashboard:')
    if (name && name.trim()) {
      savedDashboardActions.save(name.trim())
      alert('Dashboard salvo com sucesso!')
    }
  }
}