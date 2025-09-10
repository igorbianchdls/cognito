// Canvas history store for undo/redo functionality
import { atom } from 'nanostores'
import type { CanvasConfig } from '@/types/apps/canvas'

interface CanvasHistoryState {
  history: CanvasConfig[]
  currentIndex: number
  maxHistory: number
}

const INITIAL_STATE: CanvasHistoryState = {
  history: [],
  currentIndex: -1,
  maxHistory: 50
}

// History state store
export const $canvasHistory = atom<CanvasHistoryState>(INITIAL_STATE)

// Canvas history actions
export const canvasHistoryActions = {
  // Add new state to history
  addToHistory: (config: CanvasConfig) => {
    const currentState = $canvasHistory.get()
    
    // Remove any history after current index (when undoing then making new changes)
    const newHistory = currentState.history.slice(0, currentState.currentIndex + 1)
    
    // Add new config
    newHistory.push(JSON.parse(JSON.stringify(config))) // Deep clone
    
    // Limit history size
    if (newHistory.length > currentState.maxHistory) {
      newHistory.shift() // Remove oldest
    } else {
      // Update index only if we didn't remove the oldest
      $canvasHistory.set({
        ...currentState,
        history: newHistory,
        currentIndex: newHistory.length - 1
      })
      return
    }
    
    $canvasHistory.set({
      ...currentState,
      history: newHistory,
      currentIndex: newHistory.length - 1
    })
    
    console.log('🕰️ Added to canvas history. Total states:', newHistory.length)
  },

  // Undo - go back one step
  undo: (): CanvasConfig | null => {
    const currentState = $canvasHistory.get()
    
    if (currentState.currentIndex > 0) {
      const newIndex = currentState.currentIndex - 1
      const previousConfig = currentState.history[newIndex]
      
      $canvasHistory.set({
        ...currentState,
        currentIndex: newIndex
      })
      
      console.log('⬅️ Undo - moved to index:', newIndex)
      return JSON.parse(JSON.stringify(previousConfig)) // Deep clone
    }
    
    return null
  },

  // Redo - go forward one step
  redo: (): CanvasConfig | null => {
    const currentState = $canvasHistory.get()
    
    if (currentState.currentIndex < currentState.history.length - 1) {
      const newIndex = currentState.currentIndex + 1
      const nextConfig = currentState.history[newIndex]
      
      $canvasHistory.set({
        ...currentState,
        currentIndex: newIndex
      })
      
      console.log('➡️ Redo - moved to index:', newIndex)
      return JSON.parse(JSON.stringify(nextConfig)) // Deep clone
    }
    
    return null
  },

  // Check if undo is possible
  canUndo: (): boolean => {
    const currentState = $canvasHistory.get()
    return currentState.currentIndex > 0
  },

  // Check if redo is possible
  canRedo: (): boolean => {
    const currentState = $canvasHistory.get()
    return currentState.currentIndex < currentState.history.length - 1
  },

  // Clear all history
  clearHistory: () => {
    $canvasHistory.set(INITIAL_STATE)
    console.log('🗑️ Canvas history cleared')
  },

  // Get current history info
  getHistoryInfo: () => {
    const currentState = $canvasHistory.get()
    return {
      total: currentState.history.length,
      current: currentState.currentIndex + 1,
      canUndo: canvasHistoryActions.canUndo(),
      canRedo: canvasHistoryActions.canRedo()
    }
  }
}