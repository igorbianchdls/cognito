'use client'

import { atom } from 'nanostores'
import { $widgets, widgetActions } from './widgetStore'
import type { SavedDashboard } from '@/types/savedDashboard'

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
const saveToStorage = (dashboards: SavedDashboard[]) => {
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
    
    if (currentWidgets.length === 0) {
      alert('Não há widgets no canvas para salvar!')
      return
    }

    const newDashboard: SavedDashboard = {
      id: generateId(),
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date(),
      widgets: JSON.parse(JSON.stringify(currentWidgets)) // Deep clone
    }

    const currentDashboards = $savedDashboards.get()
    $savedDashboards.set([...currentDashboards, newDashboard])
    
    console.log('📄 Dashboard saved:', newDashboard.name, 'with', newDashboard.widgets.length, 'widgets')
  },

  // Carregar dashboard
  load: (id: string) => {
    const dashboards = $savedDashboards.get()
    const dashboard = dashboards.find(d => d.id === id)
    
    if (!dashboard) {
      alert('Dashboard não encontrado!')
      return
    }

    // Limpar canvas atual e carregar widgets salvos
    widgetActions.setWidgets(dashboard.widgets)
    console.log('📄 Dashboard loaded:', dashboard.name, 'with', dashboard.widgets.length, 'widgets')
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