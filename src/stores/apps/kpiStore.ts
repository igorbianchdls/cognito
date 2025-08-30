import { atom, computed } from 'nanostores'
import type { 
  KPIWidget, 
  CreateKPIWidgetProps, 
  KPIConfig
} from '@/types/apps/kpiWidgets'
import { 
  DEFAULT_KPI_CONFIG,
  calculateKPIStatus,
  calculateKPITrend
} from '@/types/apps/kpiWidgets'
import type { LayoutItem } from '@/types/apps/baseWidget'

// Main KPIs atom
export const $kpiWidgets = atom<KPIWidget[]>([])

// Selected KPI atom
export const $selectedKPIId = atom<string | null>(null)

// Computed for selected KPI
export const $selectedKPI = computed([$kpiWidgets, $selectedKPIId], (kpis, selectedId) => {
  if (!selectedId) return null
  return kpis.find(k => k.i === selectedId) || null
})

// KPIs by status
export const $kpisByStatus = computed([$kpiWidgets], (kpis) => {
  const grouped = {
    'on-target': [] as KPIWidget[],
    'above-target': [] as KPIWidget[],
    'below-target': [] as KPIWidget[],
    'critical': [] as KPIWidget[]
  }
  
  kpis.forEach(kpi => {
    const status = kpi.config.status || calculateKPIStatus(
      kpi.config.value || 0, 
      kpi.config.target
    )
    if (status) {
      grouped[status].push(kpi)
    }
  })
  
  return grouped
})

// KPI creation helper
function createBaseKPI(props: CreateKPIWidgetProps): KPIWidget {
  const timestamp = Date.now()
  return {
    id: `kpi-${timestamp}`,
    i: `kpi-${timestamp}`,
    name: props.name,
    type: 'kpi',
    icon: props.icon || '🎯',
    description: props.description || 'KPI metric widget',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    color: '#3B82F6',
    config: {
      ...DEFAULT_KPI_CONFIG,
      name: props.name,
      ...props.config
    }
  }
}

// KPI Actions
export const kpiActions = {
  // Set all KPIs
  setKPIs: (kpis: KPIWidget[]) => {
    console.log('🎯 Setting KPIs:', kpis.length)
    $kpiWidgets.set(kpis)
  },

  // Add KPI
  addKPI: (props: CreateKPIWidgetProps & { position?: { x: number; y: number }, size?: { w: number; h: number } }) => {
    console.log('➕ Adding KPI:', props.name)
    
    const kpi = createBaseKPI(props)
    
    // Apply position and size if provided
    if (props.position) {
      kpi.x = props.position.x
      kpi.y = props.position.y
    }
    if (props.size) {
      kpi.w = props.size.w
      kpi.h = props.size.h
    }
    
    const currentKPIs = $kpiWidgets.get()
    $kpiWidgets.set([...currentKPIs, kpi])
    
    return kpi
  },

  // Edit KPI
  editKPI: (kpiId: string, changes: Partial<KPIWidget>) => {
    console.log('✏️ Editing KPI:', { kpiId, changes })
    const currentKPIs = $kpiWidgets.get()
    
    const updatedKPIs = currentKPIs.map(kpi => 
      kpi.i === kpiId ? { ...kpi, ...changes } : kpi
    )
    $kpiWidgets.set(updatedKPIs)
  },

  // Update KPI config specifically
  updateKPIConfig: (kpiId: string, configChanges: Partial<KPIConfig>) => {
    console.log('🔧 Updating KPI config:', { kpiId, configChanges })
    const currentKPIs = $kpiWidgets.get()
    
    const updatedKPIs = currentKPIs.map(kpi => {
      if (kpi.i === kpiId) {
        return {
          ...kpi,
          config: { ...kpi.config, ...configChanges }
        }
      }
      return kpi
    })
    $kpiWidgets.set(updatedKPIs)
  },

  // Update KPI value (for real-time updates)
  updateKPIValue: (kpiId: string, value: number, previousValue?: number) => {
    console.log('📊 Updating KPI value:', { kpiId, value, previousValue })
    const currentKPIs = $kpiWidgets.get()
    
    const updatedKPIs = currentKPIs.map(kpi => {
      if (kpi.i === kpiId) {
        const config = kpi.config
        const change = previousValue ? ((value - previousValue) / previousValue) * 100 : config.change || 0
        const trend = calculateKPITrend(change)
        const status = calculateKPIStatus(value, config.target)
        
        return {
          ...kpi,
          config: {
            ...config,
            value,
            change,
            trend,
            status
          }
        }
      }
      return kpi
    })
    $kpiWidgets.set(updatedKPIs)
  },

  // Update KPI target
  updateKPITarget: (kpiId: string, target: number) => {
    console.log('🎯 Updating KPI target:', { kpiId, target })
    const currentKPIs = $kpiWidgets.get()
    
    const updatedKPIs = currentKPIs.map(kpi => {
      if (kpi.i === kpiId) {
        const config = kpi.config
        const status = calculateKPIStatus(config.value || 0, target)
        
        return {
          ...kpi,
          config: {
            ...config,
            target,
            status
          }
        }
      }
      return kpi
    })
    $kpiWidgets.set(updatedKPIs)
  },

  // Remove KPI
  removeKPI: (kpiId: string) => {
    console.log('🗑️ Removing KPI:', kpiId)
    const currentKPIs = $kpiWidgets.get()
    const newKPIs = currentKPIs.filter(kpi => kpi.i !== kpiId)
    $kpiWidgets.set(newKPIs)
    
    // Clear selection if removed KPI was selected
    if ($selectedKPIId.get() === kpiId) {
      $selectedKPIId.set(null)
    }
  },

  // Select KPI
  selectKPI: (kpiId: string | null) => {
    console.log('🎯 Selecting KPI:', kpiId)
    $selectedKPIId.set(kpiId)
  },

  // Update layout (for react-grid-layout)
  updateKPIsLayout: (layout: LayoutItem[]) => {
    console.log('📐 Updating KPIs layout for', layout.length, 'items')
    const currentKPIs = $kpiWidgets.get()
    
    const updatedKPIs = currentKPIs.map(kpi => {
      const layoutItem = layout.find(l => l.i === kpi.i)
      return layoutItem ? { ...kpi, ...layoutItem } : kpi
    })
    $kpiWidgets.set(updatedKPIs)
  },

  // Duplicate KPI
  duplicateKPI: (kpiId: string) => {
    console.log('📋 Duplicating KPI:', kpiId)
    const currentKPIs = $kpiWidgets.get()
    const kpiToDuplicate = currentKPIs.find(kpi => kpi.i === kpiId)
    
    if (!kpiToDuplicate) {
      console.warn('KPI not found for duplication:', kpiId)
      return
    }
    
    const timestamp = Date.now()
    const duplicatedKPI: KPIWidget = {
      ...kpiToDuplicate,
      id: `kpi-${timestamp}`,
      i: `kpi-${timestamp}`,
      name: `${kpiToDuplicate.name} (Copy)`,
      x: kpiToDuplicate.x + 1,
      y: kpiToDuplicate.y + 1
    }
    
    $kpiWidgets.set([...currentKPIs, duplicatedKPI])
    return duplicatedKPI
  },

  // Batch update KPI values (for simulation or data refresh)
  batchUpdateKPIValues: (updates: Array<{ kpiId: string; value: number; previousValue?: number }>) => {
    console.log('📊 Batch updating KPI values:', updates.length, 'KPIs')
    const currentKPIs = $kpiWidgets.get()
    
    const updatedKPIs = currentKPIs.map(kpi => {
      const update = updates.find(u => u.kpiId === kpi.i)
      if (!update) return kpi
      
      const config = kpi.config
      const change = update.previousValue ? 
        ((update.value - update.previousValue) / update.previousValue) * 100 : 
        config.change || 0
      const trend = calculateKPITrend(change)
      const status = calculateKPIStatus(update.value, config.target)
      
      return {
        ...kpi,
        config: {
          ...config,
          value: update.value,
          change,
          trend,
          status
        }
      }
    })
    
    $kpiWidgets.set(updatedKPIs)
  },

  // Start KPI simulation for a specific KPI
  startKPISimulation: (kpiId: string) => {
    console.log('🎲 Starting KPI simulation:', kpiId)
    const currentKPIs = $kpiWidgets.get()
    const kpi = currentKPIs.find(k => k.i === kpiId)
    
    if (!kpi || !kpi.config.enableSimulation) {
      console.warn('KPI simulation not enabled or KPI not found:', kpiId)
      return
    }
    
    const config = kpi.config
    const range = config.simulationRange || { min: 800, max: 1400, baseValue: 1000 }
    const minVal = range.min || 800
    const maxVal = range.max || 1400
    
    const interval = setInterval(() => {
      const variation = Math.random() * (maxVal - minVal) + minVal
      const newValue = Math.floor(variation)
      const currentValue = config.value || range.baseValue || 1000
      
      kpiActions.updateKPIValue(kpiId, newValue, currentValue)
    }, 5000)
    
    // Store interval ID for cleanup (in a real app, you'd want to manage this better)
    return interval
  }
}