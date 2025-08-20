import type { DroppedWidget } from './widget'

export interface SavedDashboard {
  id: string
  name: string
  createdAt: Date
  widgets: DroppedWidget[]
  description?: string
}

export interface SavedDashboardStore {
  dashboards: SavedDashboard[]
  save: (name: string, description?: string) => void
  load: (id: string) => void
  delete: (id: string) => void
  list: () => SavedDashboard[]
}