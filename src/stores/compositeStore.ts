import { atom, computed } from 'nanostores'
import { $chartWidgets, chartActions } from './chartStore'
import { $kpiWidgets, kpiActions } from './kpiStore'
import { $tableWidgets, tableActions } from './tableStore'
import type { ChartWidget } from '@/types/chartWidgets'
import type { KPIWidget } from '@/types/kpiWidgets'
import type { TableWidget } from '@/types/tableWidgets'
import type { DroppedWidget } from '@/types/widget' // Legacy type for backward compatibility

// Union type for all specialized widgets
export type SpecializedWidget = ChartWidget | KPIWidget | TableWidget

// Legacy widgets store (for simple widgets like 'metric')
export const $legacyWidgets = atom<DroppedWidget[]>([])

// Cache for adapter functions to prevent unnecessary re-renders
const adapterCache = new Map<string, DroppedWidget>()

// Cache cleanup to prevent memory leaks
setInterval(() => {
  if (adapterCache.size > 100) {
    console.log('🧹 Clearing adapter cache:', adapterCache.size, 'entries')
    adapterCache.clear()
  }
}, 30000) // Clear every 30 seconds if cache grows too large

// Unified widget store - combines all specialized stores + legacy
export const $allWidgets = computed(
  [$chartWidgets, $kpiWidgets, $tableWidgets, $legacyWidgets],
  (charts, kpis, tables, legacy) => {
    console.log('🔄 Composite store recomputando:', {
      chartsCount: charts.length,
      kpisCount: kpis.length,
      tablesCount: tables.length,
      legacyCount: legacy.length,
      triggeredBy: 'store update'
    })
    
    // Convert specialized widgets to legacy format for backward compatibility
    const convertedCharts = charts.map(chart => {
      const adapted = adaptChartToLegacy(chart)
      console.log('🔄 Chart sendo adaptado:', {
        id: chart.i,
        type: chart.type,
        originalConfig: chart.config,
        adaptedConfigStructure: adapted.config,
        adaptedChartConfig: adapted.chartConfig,
        configMatch: JSON.stringify(chart.config) === JSON.stringify(adapted.config?.chartConfig)
      })
      return adapted
    })
    const convertedKPIs = kpis.map(adaptKPIToLegacy)
    const convertedTables = tables.map(adaptTableToLegacy)
    
    const result = [...convertedCharts, ...convertedKPIs, ...convertedTables, ...legacy]
    console.log('🔄 Composite store resultado final:', result.length, 'widgets')
    return result
  }
)

// Widget count by type
export const $widgetCounts = computed([$allWidgets], (widgets) => {
  const counts = {
    chart: 0,
    kpi: 0,
    table: 0,
    metric: 0,
    total: widgets.length
  }
  
  widgets.forEach(widget => {
    switch (widget.type) {
      case 'chart':
      case 'chart-bar':
      case 'chart-line':
      case 'chart-pie':
      case 'chart-area':
        counts.chart++
        break
      case 'kpi':
        counts.kpi++
        break
      case 'table':
        counts.table++
        break
      case 'metric':
        counts.metric++
        break
    }
  })
  
  return counts
})

// Selected widget management (unified)
export const $selectedWidgetId = atom<string | null>(null)
export const $selectedWidget = computed([$allWidgets, $selectedWidgetId], (widgets, selectedId) => {
  if (!selectedId) return null
  const selected = widgets.find(w => w.i === selectedId) || null
  
  console.log('🎯 selectedWidget atualizado:', {
    selectedId,
    found: !!selected,
    type: selected?.type,
    hasConfig: !!selected?.config,
    hasChartConfig: !!selected?.chartConfig,
    configStructure: selected?.config,
    chartConfigDirect: selected?.chartConfig
  })
  
  return selected
})

// Adapter functions to convert specialized widgets to legacy format
function adaptChartToLegacy(chart: ChartWidget): DroppedWidget {
  // Create cache key based on widget ID and config content
  const configHash = JSON.stringify(chart.config)
  const cacheKey = `chart_${chart.i}_${configHash}`
  
  // Return cached version if available
  const cached = adapterCache.get(cacheKey)
  if (cached) {
    console.log('📋 Chart adapter cache hit:', chart.i)
    return cached
  }
  
  // Create new adapted widget
  const adapted: DroppedWidget = {
    ...chart,
    chartConfig: chart.config, // Legacy compatibility
    config: {
      chartConfig: chart.config // Mantém acesso via config.chartConfig para ChartWidget.tsx
    }
  }
  
  // Cache the result
  adapterCache.set(cacheKey, adapted)
  console.log('💾 Chart adapter cache miss - cached:', chart.i)
  
  return adapted
}

function adaptKPIToLegacy(kpi: KPIWidget): DroppedWidget {
  // Create cache key based on widget ID and config content
  const configHash = JSON.stringify(kpi.config)
  const cacheKey = `kpi_${kpi.i}_${configHash}`
  
  // Return cached version if available
  const cached = adapterCache.get(cacheKey)
  if (cached) {
    console.log('📋 KPI adapter cache hit:', kpi.i)
    return cached
  }
  
  // Create new adapted widget
  const adapted: DroppedWidget = {
    ...kpi,
    config: {
      kpiConfig: kpi.config
    }
  }
  
  // Cache the result
  adapterCache.set(cacheKey, adapted)
  console.log('💾 KPI adapter cache miss - cached:', kpi.i)
  
  return adapted
}

function adaptTableToLegacy(table: TableWidget): DroppedWidget {
  // Create cache key based on widget ID and config content
  const configHash = JSON.stringify(table.config)
  const cacheKey = `table_${table.i}_${configHash}`
  
  // Return cached version if available
  const cached = adapterCache.get(cacheKey)
  if (cached) {
    console.log('📋 Table adapter cache hit:', table.i)
    return cached
  }
  
  // Create new adapted widget
  const adapted: DroppedWidget = {
    ...table,
    config: {
      tableConfig: table.config
    }
  }
  
  // Cache the result
  adapterCache.set(cacheKey, adapted)
  console.log('💾 Table adapter cache miss - cached:', table.i)
  
  return adapted
}

// Migration utilities - convert legacy widgets to specialized stores
export const migrationUtils = {
  // Detect if a legacy widget needs migration
  needsMigration: (widget: DroppedWidget): boolean => {
    switch (widget.type) {
      case 'chart':
      case 'chart-bar':
      case 'chart-line':
      case 'chart-pie':
      case 'chart-area':
        return true
      case 'kpi':
        return true
      case 'table':
        return true
      case 'metric':
        return false // Keep in legacy store
      default:
        return false
    }
  },

  // Migrate a single widget from legacy format to specialized store
  migrateWidget: (widget: DroppedWidget) => {
    console.log('🔄 Migrating widget:', widget.type, widget.name)
    
    switch (widget.type) {
      case 'chart':
      case 'chart-bar':
      case 'chart-line':
      case 'chart-pie':
      case 'chart-area':
        migrationUtils.migrateChart(widget)
        break
      case 'kpi':
        migrationUtils.migrateKPI(widget)
        break
      case 'table':
        migrationUtils.migrateTable(widget)
        break
      default:
        console.log('ℹ️ Widget does not need migration:', widget.type)
    }
  },

  // Migrate chart widget
  migrateChart: (widget: DroppedWidget) => {
    const chartWidget: ChartWidget = {
      ...widget,
      type: widget.type as ChartWidget['type'],
      config: widget.config?.chartConfig || widget.chartConfig || {}
    } as ChartWidget
    
    const currentCharts = $chartWidgets.get()
    const existingIndex = currentCharts.findIndex(c => c.i === widget.i)
    
    if (existingIndex >= 0) {
      // Update existing
      const updatedCharts = [...currentCharts]
      updatedCharts[existingIndex] = chartWidget
      $chartWidgets.set(updatedCharts)
    } else {
      // Add new
      $chartWidgets.set([...currentCharts, chartWidget])
    }
    
    console.log('✅ Chart migrated:', widget.name)
  },

  // Migrate KPI widget with legacy compatibility
  migrateKPI: (widget: DroppedWidget) => {
    let kpiConfig = widget.config?.kpiConfig || {}
    
    // Handle legacy KPI data stored in chartConfig
    if (widget.chartConfig && !kpiConfig.name) {
      const legacy = widget.chartConfig as Record<string, unknown>
      kpiConfig = {
        name: legacy.kpiName as string,
        value: legacy.kpiValue as number,
        unit: legacy.kpiUnit as string,
        target: legacy.kpiTarget as number,
        change: legacy.kpiChange as number,
        trend: legacy.kpiTrend as 'increasing' | 'decreasing' | 'stable',
        status: legacy.kpiStatus as 'on-target' | 'above-target' | 'below-target' | 'critical',
        showTarget: legacy.showTarget as boolean,
        showTrend: legacy.showTrend as boolean,
        visualizationType: legacy.kpiVisualizationType as 'card' | 'display' | 'gauge',
        colorScheme: legacy.kpiColorScheme as 'green' | 'blue' | 'orange' | 'red',
        metric: legacy.kpiMetric as string,
        calculation: legacy.kpiCalculation as string,
        timeRange: legacy.kpiTimeRange as string,
        valueFontSize: legacy.kpiValueFontSize as number,
        valueColor: legacy.kpiValueColor as string,
        valueFontWeight: legacy.kpiValueFontWeight as number,
        nameFontSize: legacy.kpiNameFontSize as number,
        nameColor: legacy.kpiNameColor as string,
        nameFontWeight: legacy.kpiNameFontWeight as number,
        backgroundColor: legacy.kpiBackgroundColor as string,
        borderColor: legacy.kpiBorderColor as string,
        borderWidth: legacy.kpiBorderWidth as number,
        borderRadius: legacy.kpiBorderRadius as number,
        padding: legacy.kpiPadding as number,
        textAlign: legacy.kpiTextAlign as 'left' | 'center' | 'right',
        shadow: legacy.kpiShadow as boolean,
        changeColor: legacy.kpiChangeColor as string,
        targetColor: legacy.kpiTargetColor as string,
        ...kpiConfig // Overlay any newer config
      }
    }
    
    const kpiWidget: KPIWidget = {
      ...widget,
      type: 'kpi',
      config: kpiConfig
    }
    
    const currentKPIs = $kpiWidgets.get()
    const existingIndex = currentKPIs.findIndex(k => k.i === widget.i)
    
    if (existingIndex >= 0) {
      // Update existing
      const updatedKPIs = [...currentKPIs]
      updatedKPIs[existingIndex] = kpiWidget
      $kpiWidgets.set(updatedKPIs)
    } else {
      // Add new
      $kpiWidgets.set([...currentKPIs, kpiWidget])
    }
    
    console.log('✅ KPI migrated:', widget.name)
  },

  // Migrate table widget
  migrateTable: (widget: DroppedWidget) => {
    const tableWidget: TableWidget = {
      ...widget,
      type: 'table',
      config: widget.config?.tableConfig || {}
    }
    
    const currentTables = $tableWidgets.get()
    const existingIndex = currentTables.findIndex(t => t.i === widget.i)
    
    if (existingIndex >= 0) {
      // Update existing
      const updatedTables = [...currentTables]
      updatedTables[existingIndex] = tableWidget
      $tableWidgets.set(updatedTables)
    } else {
      // Add new
      $tableWidgets.set([...currentTables, tableWidget])
    }
    
    console.log('✅ Table migrated:', widget.name)
  },

  // Migrate all legacy widgets to specialized stores
  migrateAllWidgets: (legacyWidgets: DroppedWidget[]) => {
    console.log('🔄 Migrating all legacy widgets:', legacyWidgets.length)
    
    const toMigrate = legacyWidgets.filter(migrationUtils.needsMigration)
    const toKeep = legacyWidgets.filter(w => !migrationUtils.needsMigration(w))
    
    console.log('📊 Migration plan:', {
      toMigrate: toMigrate.length,
      toKeep: toKeep.length
    })
    
    // Migrate widgets to specialized stores
    toMigrate.forEach(migrationUtils.migrateWidget)
    
    // Keep simple widgets in legacy store
    $legacyWidgets.set(toKeep)
    
    console.log('✅ Migration complete')
  }
}

// Composite actions - unified interface for all widget operations
export const compositeActions = {
  // Add widget (routes to appropriate store based on type)
  addWidget: (widget: DroppedWidget) => {
    console.log('➕ Adding widget via composite:', widget.type, widget.name)
    
    if (migrationUtils.needsMigration(widget)) {
      migrationUtils.migrateWidget(widget)
    } else {
      // Add to legacy store
      const currentLegacy = $legacyWidgets.get()
      $legacyWidgets.set([...currentLegacy, widget])
    }
  },

  // Edit widget (routes to appropriate store)
  editWidget: (widgetId: string, changes: Partial<DroppedWidget>) => {
    console.log('✏️ Editing widget via composite:', widgetId, changes)
    
    // Find widget in all stores to determine type
    const allWidgets = $allWidgets.get()
    const widget = allWidgets.find(w => w.i === widgetId)
    
    if (!widget) {
      console.warn('Widget not found for editing:', widgetId)
      return
    }
    
    // Route to appropriate store
    switch (widget.type) {
      case 'chart':
      case 'chart-bar':
      case 'chart-line':
      case 'chart-pie':
      case 'chart-area':
        chartActions.editChart(widgetId, changes as Partial<ChartWidget>)
        break
      case 'kpi':
        kpiActions.editKPI(widgetId, changes as Partial<KPIWidget>)
        break
      case 'table':
        tableActions.editTable(widgetId, changes as Partial<TableWidget>)
        break
      default:
        // Handle legacy widgets
        const currentLegacy = $legacyWidgets.get()
        const updatedLegacy = currentLegacy.map(w => 
          w.i === widgetId ? { ...w, ...changes } : w
        )
        $legacyWidgets.set(updatedLegacy)
    }
  },

  // Remove widget (routes to appropriate store)
  removeWidget: (widgetId: string) => {
    console.log('🗑️ Removing widget via composite:', widgetId)
    
    // Try to remove from all stores (only one will actually remove it)
    chartActions.removeChart(widgetId)
    kpiActions.removeKPI(widgetId)
    tableActions.removeTable(widgetId)
    
    // Also try legacy store
    const currentLegacy = $legacyWidgets.get()
    const updatedLegacy = currentLegacy.filter(w => w.i !== widgetId)
    if (updatedLegacy.length !== currentLegacy.length) {
      $legacyWidgets.set(updatedLegacy)
    }
    
    // Clear selection if removed widget was selected
    if ($selectedWidgetId.get() === widgetId) {
      $selectedWidgetId.set(null)
    }
  },

  // Select widget (unified)
  selectWidget: (widgetId: string | null) => {
    console.log('🎯 Selecting widget via composite:', widgetId)
    $selectedWidgetId.set(widgetId)
    
    // Also update individual store selections for consistency
    chartActions.selectChart(widgetId)
    kpiActions.selectKPI(widgetId)
    tableActions.selectTable(widgetId)
  },

  // Update layout for all widgets
  updateLayout: (layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    console.log('📐 Updating layout via composite for', layout.length, 'widgets')
    
    // Separate layout items by widget type
    const chartLayouts: Array<{ i: string; x: number; y: number; w: number; h: number }> = []
    const kpiLayouts: Array<{ i: string; x: number; y: number; w: number; h: number }> = []
    const tableLayouts: Array<{ i: string; x: number; y: number; w: number; h: number }> = []
    const legacyLayouts: Array<{ i: string; x: number; y: number; w: number; h: number }> = []
    
    layout.forEach(item => {
      const allWidgets = $allWidgets.get()
      const widget = allWidgets.find(w => w.i === item.i)
      
      if (!widget) return
      
      switch (widget.type) {
        case 'chart':
        case 'chart-bar':
        case 'chart-line':
        case 'chart-pie':
        case 'chart-area':
          chartLayouts.push(item)
          break
        case 'kpi':
          kpiLayouts.push(item)
          break
        case 'table':
          tableLayouts.push(item)
          break
        default:
          legacyLayouts.push(item)
      }
    })
    
    // Update each store with its relevant layout items
    if (chartLayouts.length > 0) chartActions.updateChartsLayout(chartLayouts)
    if (kpiLayouts.length > 0) kpiActions.updateKPIsLayout(kpiLayouts)
    if (tableLayouts.length > 0) tableActions.updateTablesLayout(tableLayouts)
    
    // Update legacy widgets
    if (legacyLayouts.length > 0) {
      const currentLegacy = $legacyWidgets.get()
      const updatedLegacy = currentLegacy.map(widget => {
        const layoutItem = legacyLayouts.find(l => l.i === widget.i)
        return layoutItem ? { ...widget, ...layoutItem } : widget
      })
      $legacyWidgets.set(updatedLegacy)
    }
  },

  // Set all widgets (with automatic migration)
  setWidgets: (widgets: DroppedWidget[]) => {
    console.log('🔄 Setting all widgets via composite:', widgets.length)
    migrationUtils.migrateAllWidgets(widgets)
  }
}