// Canvas store for managing dashboard canvas configuration
// Handles background, dimensions, grid settings, and styling
import { atom } from 'nanostores'
import type { CanvasConfig } from '@/types/apps/canvas'
import { defaultCanvasConfig } from '@/types/apps/canvas'

const CANVAS_STORAGE_KEY = 'cognito-canvas-config'

// Load canvas config from localStorage on initialization
const loadCanvasFromStorage = (): CanvasConfig => {
  if (typeof window === 'undefined') return defaultCanvasConfig
  try {
    const stored = localStorage.getItem(CANVAS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with default config to ensure all properties exist
      return { ...defaultCanvasConfig, ...parsed }
    }
    return defaultCanvasConfig
  } catch (error) {
    console.error('Error loading canvas config from localStorage:', error)
    return defaultCanvasConfig
  }
}

// Save canvas config to localStorage
const saveCanvasToStorage = (config: CanvasConfig) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Error saving canvas config to localStorage:', error)
  }
}

// Canvas configuration store with localStorage persistence
export const $canvasConfig = atom<CanvasConfig>(loadCanvasFromStorage())

// Auto-save to localStorage whenever canvas config changes
if (typeof window !== 'undefined') {
  $canvasConfig.subscribe(config => {
    saveCanvasToStorage(config)
    console.log('🎨 Canvas config auto-saved to localStorage')
  })
}

// Canvas selection state - for showing canvas settings in editor
export const $isCanvasSettingsOpen = atom<boolean>(false)

// Canvas actions
export const canvasActions = {
  // Update entire canvas config
  setConfig: (config: CanvasConfig) => {
    console.log('🎨 Setting canvas config:', config)
    $canvasConfig.set(config)
  },

  // Update specific canvas property
  updateConfig: (updates: Partial<CanvasConfig>) => {
    console.log('🎨 Updating canvas config:', updates)
    const currentConfig = $canvasConfig.get()
    $canvasConfig.set({ ...currentConfig, ...updates })
  },

  // Background styling actions
  setBackgroundColor: (color: string) => {
    console.log('🎨 Setting background color:', color)
    canvasActions.updateConfig({ backgroundColor: color })
  },

  setBackgroundImage: (imageUrl?: string) => {
    console.log('🎨 Setting background image:', imageUrl)
    canvasActions.updateConfig({ backgroundImage: imageUrl })
  },

  setBackgroundSize: (size: CanvasConfig['backgroundSize']) => {
    console.log('🎨 Setting background size:', size)
    canvasActions.updateConfig({ backgroundSize: size })
  },

  setBackgroundPosition: (position: CanvasConfig['backgroundPosition']) => {
    console.log('🎨 Setting background position:', position)
    canvasActions.updateConfig({ backgroundPosition: position })
  },

  setBackgroundRepeat: (repeat: CanvasConfig['backgroundRepeat']) => {
    console.log('🎨 Setting background repeat:', repeat)
    canvasActions.updateConfig({ backgroundRepeat: repeat })
  },

  // Canvas dimension actions
  setCanvasMode: (mode: 'responsive' | 'fixed') => {
    console.log('📏 Setting canvas mode:', mode)
    canvasActions.updateConfig({ canvasMode: mode })
  },

  setCanvasDimensions: (width: number | 'auto' | '100%', height: number | 'auto' | '100vh') => {
    console.log('📏 Setting canvas dimensions:', { width, height })
    canvasActions.updateConfig({ width, height })
  },

  setMinHeight: (minHeight: number) => {
    console.log('📏 Setting canvas min height:', minHeight)
    canvasActions.updateConfig({ minHeight })
  },

  setMaxWidth: (maxWidth?: number) => {
    console.log('📏 Setting canvas max width:', maxWidth)
    canvasActions.updateConfig({ maxWidth })
  },

  // Grid configuration actions
  setRowHeight: (rowHeight: number) => {
    console.log('📐 Setting row height:', rowHeight)
    canvasActions.updateConfig({ rowHeight })
  },

  setContainerPadding: (padding: [number, number]) => {
    console.log('📐 Setting container padding:', padding)
    canvasActions.updateConfig({ containerPadding: padding })
  },

  setMargin: (margin: [number, number]) => {
    console.log('📐 Setting margin:', margin)
    canvasActions.updateConfig({ margin })
  },

  setBreakpoints: (breakpoints: Partial<CanvasConfig['breakpoints']>) => {
    console.log('📐 Setting breakpoints:', breakpoints)
    const currentConfig = $canvasConfig.get()
    canvasActions.updateConfig({ 
      breakpoints: { ...currentConfig.breakpoints, ...breakpoints }
    })
  },

  // Styling actions
  setBorderRadius: (borderRadius: number) => {
    console.log('🎨 Setting border radius:', borderRadius)
    canvasActions.updateConfig({ borderRadius })
  },

  setBoxShadow: (boxShadow: boolean) => {
    console.log('🎨 Setting box shadow:', boxShadow)
    canvasActions.updateConfig({ boxShadow })
  },

  setOverflow: (overflow: CanvasConfig['overflow']) => {
    console.log('📦 Setting overflow:', overflow)
    canvasActions.updateConfig({ overflow })
  },

  // Aspect ratio actions
  setMaintain16by9: (maintain16by9: boolean) => {
    console.log('📐 Setting 16:9 aspect ratio:', maintain16by9)
    canvasActions.updateConfig({ maintain16by9 })
  },

  // Responsive height actions
  setResponsiveHeight: (height: number | 'auto' | 'viewport') => {
    console.log('📏 Setting responsive height:', height)
    canvasActions.updateConfig({ responsiveHeight: height })
  },

  setResponsiveHeightValue: (value: number) => {
    console.log('📏 Setting responsive height value:', value)
    canvasActions.updateConfig({ responsiveHeightValue: value })
  },

  // Reset to defaults
  resetToDefaults: () => {
    console.log('🔄 Resetting canvas to defaults')
    console.log('📋 All canvas settings restored to initial values')
    $canvasConfig.set(defaultCanvasConfig)
  },

  // Canvas settings panel actions
  openCanvasSettings: () => {
    console.log('🎨 Opening canvas settings')
    $isCanvasSettingsOpen.set(true)
  },

  closeCanvasSettings: () => {
    console.log('🎨 Closing canvas settings')
    $isCanvasSettingsOpen.set(false)
  },

  toggleCanvasSettings: () => {
    const isOpen = $isCanvasSettingsOpen.get()
    console.log('🎨 Toggling canvas settings:', !isOpen)
    $isCanvasSettingsOpen.set(!isOpen)
  }
}