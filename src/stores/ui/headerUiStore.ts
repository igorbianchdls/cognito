'use client'

import { atom } from 'nanostores'

export type HeaderVariant = 'auto' | 'light' | 'dark'

export interface HeaderStyle {
  background: string
  textPrimary: string
  textSecondary: string
  borderBottomColor: string
}

export interface HeaderUiState {
  variant: HeaderVariant
  styles: Record<'light' | 'dark', HeaderStyle>
}

const STORAGE_KEY = 'cognito-header-ui'

const DEFAULT_STYLES: Record<'light' | 'dark', HeaderStyle> = {
  light: {
    background: '#ffffff',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    borderBottomColor: '#e5e7eb',
  },
  dark: {
    background: '#1B1B1B',
    textPrimary: '#ffffff',
    textSecondary: '#d1d5db',
    borderBottomColor: '#404040',
  }
}

const loadFromStorage = (): HeaderUiState | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed
  } catch {
    return null
  }
}

const initialState: HeaderUiState = loadFromStorage() || {
  variant: 'auto',
  styles: DEFAULT_STYLES,
}

export const $headerUi = atom<HeaderUiState>(initialState)

// Persist
if (typeof window !== 'undefined') {
  $headerUi.subscribe((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  })
}

// Helpers
export const headerUiActions = {
  setVariant(variant: HeaderVariant) {
    const current = $headerUi.get()
    $headerUi.set({ ...current, variant })
  },
  setStyle(kind: 'light' | 'dark', partial: Partial<HeaderStyle>) {
    const current = $headerUi.get()
    const next: HeaderStyle = { ...current.styles[kind], ...partial }
    $headerUi.set({ ...current, styles: { ...current.styles, [kind]: next } })
  }
}

// Resolve variant based on theme name when auto
export function resolveHeaderVariant(themeName?: string, variant?: HeaderVariant): 'light' | 'dark' {
  const v = variant || $headerUi.get().variant
  if (v && v !== 'auto') return v
  const isLight = themeName === 'branco' || themeName === 'cinza-claro'
  return isLight ? 'light' : 'dark'
}

export function resolveHeaderStyle(themeName?: string, variant?: HeaderVariant): HeaderStyle {
  const kind = resolveHeaderVariant(themeName, variant)
  const styles = $headerUi.get().styles
  return styles[kind]
}
