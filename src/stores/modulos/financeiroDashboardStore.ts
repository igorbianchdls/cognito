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
  }
  cardBorderColor: string
  cardShadow: boolean
  cardShadowPreset: 'none' | '1' | '2' | '3' | '4' | '5'
  pageBgColor: string
  filtersIconColor: string
  kpiIconColor: string
}

export type FinanceiroDashboardFiltersState = {
  dateRange?: { from?: string; to?: string }
  dataFilter: string
}

const DEFAULT_UI: FinanceiroDashboardUIState = {
  fonts: {
    values: { family: 'Space Mono', weight: 700, letterSpacing: 0, color: '#111827', size: 24, transform: 'none' },
    kpiTitle: { family: 'Space Mono', weight: 500, letterSpacing: 0, color: 'rgb(145, 145, 145)', size: 13, transform: 'uppercase' },
    chartTitle: { family: 'Space Mono', weight: 500, letterSpacing: 0, color: 'rgb(145, 145, 145)', size: 13, transform: 'uppercase' },
    text: { family: 'Inter', weight: 400, letterSpacing: 0, color: '#6b7280', size: 12, transform: 'none' },
    filters: { family: 'Inter', weight: 400, letterSpacing: 0, color: 'rgb(122, 122, 122)', size: 13, transform: 'none' },
    headerTitle: { family: 'Geist', weight: 700, letterSpacing: 0, color: '#111827', size: 25, transform: 'none' },
    headerSubtitle: { family: 'Geist', weight: 400, letterSpacing: 0, color: '#6b7280', size: 12, transform: 'none' },
    sidebarSectionTitle: { family: 'Space Mono', weight: 500, letterSpacing: 0, color: '#808080', size: 12, transform: 'uppercase' },
  },
  cardBorderColor: 'rgb(233, 233, 233)',
  cardShadow: false,
  cardShadowPreset: 'none',
  pageBgColor: '#ffffff',
  filtersIconColor: '#6b7280',
  kpiIconColor: '#6b7280',
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
