'use client'

import { atom } from 'nanostores'
// import { $widgets, widgetActions } from './widgetStore' // REMOVED: Only KPIs supported now
// import { $multiCanvasState, multiCanvasActions } from './multiCanvasStore' // REMOVED: Simplified to single canvas
// import { isNavigationWidget } from '@/types/apps/droppedWidget' // REMOVED: No navigation widgets in KPI-only mode
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
    // REMOVED: Dashboard saving functionality disabled for KPI-only mode
    alert('Dashboard saving functionality needs to be updated for KPI-only mode')
    return // Temporarily disabled
  },

  // Carregar dashboard
  load: (id: string) => {
    const dashboards = $savedDashboards.get()
    const dashboard = dashboards.find(d => d.id === id)
    
    if (!dashboard) {
      alert('Dashboard não encontrado!')
      return
    }

    // REMOVED: Dashboard loading functionality disabled for KPI-only mode
    alert('Dashboard loading functionality needs to be updated for KPI-only mode')
    console.log('📄 Dashboard load requested:', dashboard.name, 'but functionality is temporarily disabled')
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