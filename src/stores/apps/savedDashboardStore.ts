'use client'

import { atom } from 'nanostores'
import { $kpisAsDropped, kpiActions } from './kpiStore'
import { $tablesAsDropped, tableActions } from './tableStore'
import { $barChartsAsDropped, barChartActions } from './barChartStore'
import { $horizontalBarChartsAsDropped, horizontalBarChartActions } from './horizontalBarChartStore'
import { $lineChartsAsDropped, lineChartActions } from './lineChartStore'
import { $pieChartsAsDropped, pieChartActions } from './pieChartStore'
import { $areaChartsAsDropped, areaChartActions } from './areaChartStore'
import { $canvasConfig, canvasActions } from './canvasStore'
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
    console.log('💾 Salvando dashboard:', name)
    
    // Coletar todos os widgets do estado atual
    const kpis = $kpisAsDropped.get()
    const tables = $tablesAsDropped.get()
    const barCharts = $barChartsAsDropped.get()
    const horizontalBarCharts = $horizontalBarChartsAsDropped.get()
    const lineCharts = $lineChartsAsDropped.get()
    const pieCharts = $pieChartsAsDropped.get()
    const areaCharts = $areaChartsAsDropped.get()
    const canvasConfig = $canvasConfig.get()
    
    // Combinar todos os widgets
    const allWidgets = [
      ...kpis,
      ...tables,
      ...barCharts,
      ...horizontalBarCharts,
      ...lineCharts,
      ...pieCharts,
      ...areaCharts
    ]
    
    console.log('📊 Widgets coletados:', {
      kpis: kpis.length,
      tables: tables.length,
      barCharts: barCharts.length,
      horizontalBarCharts: horizontalBarCharts.length,
      lineCharts: lineCharts.length,
      pieCharts: pieCharts.length,
      areaCharts: areaCharts.length,
      total: allWidgets.length
    })
    
    const newDashboard: SavedDashboard = {
      id: generateId(),
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date(),
      widgets: allWidgets,
      isMultiCanvas: false
    }
    
    const currentDashboards = $savedDashboards.get()
    $savedDashboards.set([...currentDashboards, newDashboard])
    
    console.log('✅ Dashboard salvo com sucesso:', newDashboard.id)
  },

  // Carregar dashboard
  load: (id: string) => {
    const dashboards = $savedDashboards.get()
    const dashboard = dashboards.find(d => d.id === id)
    
    if (!dashboard) {
      alert('Dashboard não encontrado!')
      return
    }

    console.log('📄 Carregando dashboard:', dashboard.name)
    
    // Simplificação temporária: apenas limpar KPIs por ora
    // O sistema está focado em KPIs, então vamos focar nisso primeiro
    kpiActions.setKPIs([])
    
    console.log('🧹 Limpando estado atual para carregar dashboard')
    
    // Por enquanto, vamos focar apenas em carregar KPIs
    // Os outros tipos podem ser implementados gradualmente
    const widgets = dashboard.widgets || []
    const kpiWidgets = widgets.filter(w => w.type === 'kpi')
    
    console.log('📊 Carregando widgets:', { 
      total: widgets.length, 
      kpis: kpiWidgets.length 
    })
    
    // Carregar apenas KPIs por enquanto
    kpiWidgets.forEach(widget => {
      kpiActions.addKPI({
        name: widget.name || 'Dashboard KPI',
        position: { x: widget.x, y: widget.y },
        size: { w: widget.w, h: widget.h }
      })
    })
    
    console.log('✅ Dashboard carregado com sucesso:', {
      name: dashboard.name,
      widgets: widgets.length
    })
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