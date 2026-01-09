'use client'

import { atom } from 'nanostores'

export type MotionPreset = 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow'

export interface VBNivoThemeState {
  // Grid
  enableGridX: boolean
  enableGridY: boolean
  gridColor?: string
  gridStrokeWidth?: number

  // Axis
  axisFontFamily?: string
  axisFontSize?: number
  axisFontWeight?: number
  axisTextColor?: string
  axisLegendFontSize?: number
  axisLegendFontWeight?: number

  // Labels
  labelsFontFamily?: string
  labelsFontSize?: number
  labelsFontWeight?: number
  labelsTextColor?: string

  // Legends
  showLegend: boolean
  legendsFontFamily?: string
  legendsFontSize?: number
  legendsFontWeight?: number
  legendsTextColor?: string

  // Tooltip
  tooltipFontSize?: number
  tooltipFontFamily?: string

  // Animation
  animate: boolean
  motionConfig: MotionPreset
}

const STORAGE_KEY = 'vb-nivo-theme'

function loadInitial(): VBNivoThemeState {
  if (typeof window === 'undefined') {
    return {
      enableGridX: false,
      enableGridY: true,
      showLegend: true,
      animate: true,
      motionConfig: 'gentle',
      gridColor: '#f1f5f9',
      gridStrokeWidth: 1,
      axisFontFamily: 'Geist, sans-serif',
      axisFontSize: 12,
      axisFontWeight: 400,
      axisTextColor: '#6b7280',
      axisLegendFontSize: 14,
      axisLegendFontWeight: 500,
      labelsFontFamily: 'Geist, sans-serif',
      labelsFontSize: 11,
      labelsFontWeight: 500,
      labelsTextColor: '#1f2937',
      legendsFontFamily: 'Geist, sans-serif',
      legendsFontSize: 12,
      legendsFontWeight: 400,
      legendsTextColor: '#6b7280',
      tooltipFontSize: 12,
      tooltipFontFamily: 'Geist, sans-serif',
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as VBNivoThemeState
  } catch {}
  return {
    enableGridX: false,
    enableGridY: true,
    showLegend: true,
    animate: true,
    motionConfig: 'gentle',
    gridColor: '#f1f5f9',
    gridStrokeWidth: 1,
    axisFontFamily: 'Geist, sans-serif',
    axisFontSize: 12,
    axisFontWeight: 400,
    axisTextColor: '#6b7280',
    axisLegendFontSize: 14,
    axisLegendFontWeight: 500,
    labelsFontFamily: 'Geist, sans-serif',
    labelsFontSize: 11,
    labelsFontWeight: 500,
    labelsTextColor: '#1f2937',
    legendsFontFamily: 'Geist, sans-serif',
    legendsFontSize: 12,
    legendsFontWeight: 400,
    legendsTextColor: '#6b7280',
    tooltipFontSize: 12,
    tooltipFontFamily: 'Geist, sans-serif',
  }
}

export const $vbNivoTheme = atom<VBNivoThemeState>(loadInitial())

if (typeof window !== 'undefined') {
  $vbNivoTheme.subscribe((v) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch {}
  })
}

export const vbNivoActions = {
  update(partial: Partial<VBNivoThemeState>) {
    const curr = $vbNivoTheme.get()
    $vbNivoTheme.set({ ...curr, ...partial })
  },
  reset() {
    $vbNivoTheme.set(loadInitial())
  }
}

