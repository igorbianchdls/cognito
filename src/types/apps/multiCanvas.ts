import type { DroppedWidget } from './widget'

export interface CanvasTab {
  id: string
  name: string
  widgets: DroppedWidget[]
  createdAt?: Date
}

export interface MultiCanvasState {
  tabs: CanvasTab[]
  activeTab: string
  hasNavigationWidget: boolean
}

export interface MultiCanvasActions {
  addTab: (name: string) => void
  removeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  renameTab: (tabId: string, name: string) => void
  updateTabWidgets: (tabId: string, widgets: DroppedWidget[]) => void
  setMultiCanvasMode: (enabled: boolean) => void
}