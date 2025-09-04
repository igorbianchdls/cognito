'use client'

import { atom } from 'nanostores'
import type { CanvasTab, MultiCanvasState } from '@/types/apps/multiCanvas'
import type { DroppedWidget } from '@/types/apps/droppedWidget'

const STORAGE_KEY = 'cognito_multi_canvas'

// Initial state
const initialState: MultiCanvasState = {
  tabs: [
    {
      id: 'tab-1',
      name: 'Dashboard 1',
      widgets: [],
      createdAt: new Date()
    }
  ],
  activeTab: 'tab-1',
  hasNavigationWidget: false
}

// Multi-canvas atoms
export const $multiCanvasState = atom<MultiCanvasState>(initialState)
export const $activeTab = atom<string>('tab-1')

// Função para carregar do localStorage
const loadFromStorage = (): MultiCanvasState | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as MultiCanvasState & { tabs: (CanvasTab & { createdAt: string })[] }
      return {
        ...parsed,
        tabs: parsed.tabs.map(tab => ({
          ...tab,
          createdAt: tab.createdAt ? new Date(tab.createdAt) : new Date()
        }))
      }
    }
  } catch (error) {
    console.error('Error loading multi-canvas state:', error)
  }
  return null
}

// Função para salvar no localStorage
const saveToStorage = (state: MultiCanvasState) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving multi-canvas state:', error)
  }
}

// Initialize from storage
if (typeof window !== 'undefined') {
  const stored = loadFromStorage()
  if (stored) {
    $multiCanvasState.set(stored)
    $activeTab.set(stored.activeTab)
  }
}

// Actions
export const multiCanvasActions = {
  // Initialize multi-canvas mode
  initializeMultiCanvas: (currentWidgets: DroppedWidget[]) => {
    console.log('🔄 Initializing multi-canvas mode with widgets:', currentWidgets.length)
    
    const currentState = $multiCanvasState.get()
    const nonNavigationWidgets = currentWidgets.filter(w => w.type !== 'navigation')
    
    const newState: MultiCanvasState = {
      ...currentState,
      tabs: [
        {
          id: 'tab-1',
          name: 'Dashboard 1',
          widgets: nonNavigationWidgets,
          createdAt: new Date()
        }
      ],
      activeTab: 'tab-1',
      hasNavigationWidget: true
    }
    
    $multiCanvasState.set(newState)
    $activeTab.set('tab-1')
    saveToStorage(newState)
  },

  // Exit multi-canvas mode
  exitMultiCanvas: () => {
    console.log('🔄 Exiting multi-canvas mode')
    
    const currentState = $multiCanvasState.get()
    const activeTabData = currentState.tabs.find(tab => tab.id === currentState.activeTab)
    
    const newState: MultiCanvasState = {
      ...currentState,
      hasNavigationWidget: false
    }
    
    $multiCanvasState.set(newState)
    saveToStorage(newState)
    
    // Return widgets from active tab for restoration to main canvas
    return activeTabData?.widgets || []
  },

  // Add new tab
  addTab: (name?: string) => {
    const currentState = $multiCanvasState.get()
    const newTabId = `tab-${Date.now()}`
    const tabName = name || `Dashboard ${currentState.tabs.length + 1}`
    
    console.log('➕ Adding new tab:', tabName)
    
    const newTab: CanvasTab = {
      id: newTabId,
      name: tabName,
      widgets: [],
      createdAt: new Date()
    }
    
    const newState: MultiCanvasState = {
      ...currentState,
      tabs: [...currentState.tabs, newTab],
      activeTab: newTabId
    }
    
    $multiCanvasState.set(newState)
    $activeTab.set(newTabId)
    saveToStorage(newState)
    
    return newTabId
  },

  // Remove tab
  removeTab: (tabId: string) => {
    const currentState = $multiCanvasState.get()
    
    // Don't allow removing the last tab
    if (currentState.tabs.length <= 1) {
      console.warn('❌ Cannot remove the last tab')
      return false
    }
    
    console.log('🗑️ Removing tab:', tabId)
    
    const filteredTabs = currentState.tabs.filter(tab => tab.id !== tabId)
    let newActiveTab = currentState.activeTab
    
    // If we're removing the active tab, switch to the first remaining tab
    if (currentState.activeTab === tabId) {
      newActiveTab = filteredTabs[0]?.id || 'tab-1'
    }
    
    const newState: MultiCanvasState = {
      ...currentState,
      tabs: filteredTabs,
      activeTab: newActiveTab
    }
    
    $multiCanvasState.set(newState)
    $activeTab.set(newActiveTab)
    saveToStorage(newState)
    
    return true
  },

  // Switch active tab
  switchTab: (tabId: string) => {
    const currentState = $multiCanvasState.get()
    
    if (!currentState.tabs.find(tab => tab.id === tabId)) {
      console.warn('❌ Tab not found:', tabId)
      return
    }
    
    console.log('🔄 Switching to tab:', tabId)
    
    const newState: MultiCanvasState = {
      ...currentState,
      activeTab: tabId
    }
    
    $multiCanvasState.set(newState)
    $activeTab.set(tabId)
    saveToStorage(newState)
  },

  // Rename tab
  renameTab: (tabId: string, newName: string) => {
    const currentState = $multiCanvasState.get()
    
    console.log('✏️ Renaming tab:', tabId, 'to:', newName)
    
    const updatedTabs = currentState.tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    )
    
    const newState: MultiCanvasState = {
      ...currentState,
      tabs: updatedTabs
    }
    
    $multiCanvasState.set(newState)
    saveToStorage(newState)
  },

  // Update widgets for specific tab
  updateTabWidgets: (tabId: string, widgets: DroppedWidget[]) => {
    const currentState = $multiCanvasState.get()
    
    console.log('🔄 Updating widgets for tab:', tabId, 'count:', widgets.length)
    
    const updatedTabs = currentState.tabs.map(tab =>
      tab.id === tabId ? { ...tab, widgets } : tab
    )
    
    const newState: MultiCanvasState = {
      ...currentState,
      tabs: updatedTabs
    }
    
    $multiCanvasState.set(newState)
    saveToStorage(newState)
  },

  // Get widgets for specific tab
  getTabWidgets: (tabId: string): DroppedWidget[] => {
    const currentState = $multiCanvasState.get()
    const tab = currentState.tabs.find(t => t.id === tabId)
    return tab?.widgets || []
  },

  // Get active tab widgets
  getActiveTabWidgets: (): DroppedWidget[] => {
    const currentState = $multiCanvasState.get()
    const activeTab = currentState.tabs.find(t => t.id === currentState.activeTab)
    return activeTab?.widgets || []
  }
}