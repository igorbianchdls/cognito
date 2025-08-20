import type { DroppedWidget } from './widget'
import type { CanvasTab } from './multiCanvas'

export interface SavedDashboard {
  id: string
  name: string
  createdAt: Date
  widgets: DroppedWidget[]  // For backward compatibility and single canvas mode
  description?: string
  
  // Multi-canvas support
  isMultiCanvas?: boolean
  multiCanvasState?: {
    tabs: CanvasTab[]
    activeTab: string
  }
}

export interface SavedDashboardStore {
  dashboards: SavedDashboard[]
  save: (name: string, description?: string) => void
  load: (id: string) => void
  delete: (id: string) => void
  list: () => SavedDashboard[]
}