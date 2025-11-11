'use client'

import { atom } from 'nanostores'

export type Typography = {
  family?: string
  weight?: number
  letterSpacing?: number
  color?: string
  size?: number
  transform?: 'none' | 'uppercase'
}

export type FinanceiroDashboardUIState = {
  fonts: {
    values: Typography
    kpiTitle: Typography
    chartTitle: Typography
    text: Typography
    filters: Typography
    headerTitle: Typography
    headerSubtitle: Typography
    sidebarSectionTitle: Typography
    sidebarItemText: Typography
  }
  cardBorderColor: string
  cardShadow: boolean
  cardShadowPreset: 'none' | '1' | '2' | '3' | '4' | '5'
  pageBgColor: string
  filtersIconColor: string
  kpiIconColor: string
  chartIconColor: string
}

export type FinanceiroDashboardFiltersState = {
  dateRange?: { from?: string; to?: string }
  dataFilter: string
}

const DEFAULT_UI: FinanceiroDashboardUIState = {
  fonts: {
    values: { family: 'Geist Mono', weight: 700, letterSpacing: 0, color: '#111827', size: 24, transform: 'none' },
    kpiTitle: { family: 'Geist Mono', weight: 500, letterSpacing: 0, color: 'rgb(179, 179, 179)', size: 12, transform: 'uppercase' },
    chartTitle: { family: 'Geist Mono', weight: 500, letterSpacing: -1, color: 'rgb(125, 125, 125)', size: 16, transform: 'none' },
    text: { family: 'Inter', weight: 400, letterSpacing: 0, color: '#6b7280', size: 12, transform: 'none' },
    filters: { family: 'Geist Mono', weight: 400, letterSpacing: 0, color: 'rgb(122, 122, 122)', size: 12, transform: 'uppercase' },
    headerTitle: { family: 'Geist Mono', weight: 700, letterSpacing: -1, color: '#111827', size: 25, transform: 'none' },
    headerSubtitle: { family: 'Barlow', weight: 400, letterSpacing: 0, color: 'rgb(168, 168, 168)', size: 14, transform: 'none' },
    sidebarSectionTitle: { family: 'Space Mono', weight: 500, letterSpacing: 0, color: '#808080', size: 12, transform: 'uppercase' },
    sidebarItemText: { family: 'Inter', weight: 400, letterSpacing: 0, color: '#0f172a', size: 14, transform: 'none' },
  },
  cardBorderColor: 'rgb(233, 233, 233)',
  cardShadow: false,
  cardShadowPreset: 'none',
  pageBgColor: '#ffffff',
  filtersIconColor: '#6b7280',
  kpiIconColor: '#6b7280',
  chartIconColor: '#6b7280',
}

const DEFAULT_FILTERS: FinanceiroDashboardFiltersState = {
  dateRange: undefined,
  dataFilter: 'todos',
}

export const $financeiroDashboardUI = atom<FinanceiroDashboardUIState>({ ...DEFAULT_UI })
export const $financeiroDashboardFilters = atom<FinanceiroDashboardFiltersState>({ ...DEFAULT_FILTERS })

export type FontSection = keyof FinanceiroDashboardUIState['fonts']

export const financeiroDashboardActions = {
  setUI: (partial: Partial<FinanceiroDashboardUIState>) => {
    const curr = $financeiroDashboardUI.get()
    $financeiroDashboardUI.set({
      ...curr,
      ...partial,
      fonts: partial.fonts ? { ...curr.fonts, ...partial.fonts } : curr.fonts,
    })
  },
  setCardShadowPreset: (preset: FinanceiroDashboardUIState['cardShadowPreset']) => {
    const curr = $financeiroDashboardUI.get()
    $financeiroDashboardUI.set({ ...curr, cardShadowPreset: preset })
  },
  setFont: (section: FontSection, patch: Partial<Typography>) => {
    const curr = $financeiroDashboardUI.get()
    $financeiroDashboardUI.set({
      ...curr,
      fonts: {
        ...curr.fonts,
        [section]: { ...curr.fonts[section], ...patch },
      } as FinanceiroDashboardUIState['fonts'],
    })
  },
  setFilters: (partial: Partial<FinanceiroDashboardFiltersState>) => {
    const curr = $financeiroDashboardFilters.get()
    $financeiroDashboardFilters.set({ ...curr, ...partial })
  },
  resetUI: () => $financeiroDashboardUI.set({ ...DEFAULT_UI }),
  resetFilters: () => $financeiroDashboardFilters.set({ ...DEFAULT_FILTERS }),
}
