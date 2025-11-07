import { atom } from 'nanostores'
import type { ReactNode } from 'react'

export type TituloState = {
  title: string
  subtitle?: string
  titleFontFamily?: string
  titleFontSize?: number
  titleFontWeight?: string
  titleColor?: string
  titleLetterSpacing?: number
  // Subtitle typography
  subtitleFontFamily?: string
  subtitleFontSize?: number
  subtitleFontWeight?: string
  subtitleColor?: string
  subtitleLetterSpacing?: number
}

export type TabsOption = { value: string; label: string; icon?: ReactNode; rightIcon?: ReactNode; badge?: ReactNode }

export type TabsState = {
  options: TabsOption[]
  selected: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  letterSpacing?: number
  iconSize?: number
  leftOffset?: number
  labelOffsetY?: number
  activeColor?: string
  activeFontWeight?: string
  activeBorderColor?: string
}

export type TabelaUIState = {
  pageSize: number
  showPagination: boolean
  enableSearch: boolean
  enableColumnToggle: boolean
  enableRowSelection: boolean
  selectionMode: 'single' | 'multiple'
  stickyHeader: boolean
  headerBg: string
  headerText: string
  cellText: string
  headerFontSize: number
  cellFontSize: number
  headerFontFamily?: string
  headerFontWeight?: string
  cellFontFamily?: string
  cellFontWeight?: string
  headerLetterSpacing?: number
  cellLetterSpacing?: number
  enableZebraStripes?: boolean
  rowAlternateBgColor?: string
  borderColor?: string
  borderWidth?: number
  selectionColumnWidth?: number
  defaultSortColumn?: string
  defaultSortDirection?: 'asc' | 'desc'
}

export type LayoutState = {
  mbTitle: number
  mbTabs: number
  mbTable: number
  contentBg?: string
  contentTopGap?: number
}

export type ToolbarUIState = {
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  fontColor?: string
  letterSpacing?: number
  borderBottomWidth?: number
  borderBottomColor?: string
  borderDistanceTop?: number
  underlineColor?: string
  underlineWidth?: number
  underlineOffsetTop?: number
  iconGap?: number
  iconColor?: string
  iconSize?: number
  searchWidth?: number
  dateRangeWidth?: number
}

const DEFAULT_TITULO: TituloState = {
  title: 'Módulo',
  subtitle: 'Selecione uma opção para visualizar os dados',
  titleFontFamily: 'Geist',
  titleFontSize: 24,
  titleFontWeight: '600',
  titleColor: '#111827',
  titleLetterSpacing: 0,
}

const DEFAULT_TABS: TabsState = {
  options: [],
  selected: 'default',
  fontFamily: 'Geist',
  fontSize: 14,
  fontWeight: '400',
  color: 'rgb(180, 180, 180)',
  letterSpacing: -0.3,
  iconSize: 16,
  leftOffset: 20,
  labelOffsetY: 6,
  activeColor: 'rgb(41, 41, 41)',
  activeFontWeight: '500',
  activeBorderColor: 'rgb(41, 41, 41)',
}

const DEFAULT_TABELA_UI: TabelaUIState = {
  pageSize: 10,
  showPagination: true,
  enableSearch: true,
  enableColumnToggle: true,
  enableRowSelection: true,
  selectionMode: 'multiple',
  stickyHeader: false,
  headerBg: '#ffffff',
  headerText: '#aaaaaa',
  cellText: '#1f2937',
  headerFontSize: 13,
  cellFontSize: 13,
  headerFontFamily: 'Inter',
  headerFontWeight: '500',
  cellFontFamily: 'Inter',
  cellFontWeight: '400',
  headerLetterSpacing: -0.28,
  cellLetterSpacing: -0.28,
  enableZebraStripes: true,
  rowAlternateBgColor: '#ffffff',
  borderColor: '#f0f0f0',
  borderWidth: 1,
  selectionColumnWidth: 48,
  defaultSortColumn: undefined,
  defaultSortDirection: 'asc',
}

export const $titulo = atom<TituloState>({ ...DEFAULT_TITULO, subtitleFontFamily: 'Inter', subtitleLetterSpacing: -0.28 })
export const $tabs = atom<TabsState>({ ...DEFAULT_TABS })
export const $tabelaUI = atom<TabelaUIState>({ ...DEFAULT_TABELA_UI })
export const $layout = atom<LayoutState>({ mbTitle: 16, mbTabs: 8, mbTable: 24, contentBg: 'rgb(253, 253, 253)', contentTopGap: 8 })
export const $toolbarUI = atom<ToolbarUIState>({
  fontFamily: 'Geist',
  fontSize: 14,
  fontWeight: '500',
  fontColor: '#6b7280',
  letterSpacing: 0,
  borderBottomWidth: 0,
  borderBottomColor: '#e5e7eb',
  borderDistanceTop: 8,
  underlineColor: '#d1d5db',
  underlineWidth: 0,
  underlineOffsetTop: 0,
  iconGap: 8,
  iconColor: '#9ca3af',
  iconSize: 16,
  searchWidth: 240,
  dateRangeWidth: 160,
})

export const moduleUiActions = {
  setTitulo: (partial: Partial<TituloState>) => $titulo.set({ ...$titulo.get(), ...partial }),
  setTabs: (partial: Partial<TabsState>) => $tabs.set({ ...$tabs.get(), ...partial }),
  setTabelaUI: (partial: Partial<TabelaUIState>) => $tabelaUI.set({ ...$tabelaUI.get(), ...partial }),
  setToolbarUI: (partial: Partial<ToolbarUIState>) => $toolbarUI.set({ ...$toolbarUI.get(), ...partial }),
  setLayout: (partial: Partial<LayoutState>) => $layout.set({ ...$layout.get(), ...partial }),
  resetAll: () => {
    $titulo.set({ ...DEFAULT_TITULO, subtitleFontFamily: 'Inter', subtitleLetterSpacing: -0.28 })
    $tabs.set({ ...DEFAULT_TABS })
    $tabelaUI.set({ ...DEFAULT_TABELA_UI })
    $toolbarUI.set({
      fontFamily: 'Geist', fontSize: 14, fontWeight: '500', fontColor: '#6b7280', letterSpacing: 0,
      borderBottomWidth: 0, borderBottomColor: '#e5e7eb', borderDistanceTop: 8, underlineColor: '#d1d5db', underlineWidth: 0, underlineOffsetTop: 0,
      iconGap: 8, iconColor: '#9ca3af', iconSize: 16, searchWidth: 240, dateRangeWidth: 160,
    })
    $layout.set({ mbTitle: 16, mbTabs: 8, mbTable: 24, contentBg: 'rgb(253, 253, 253)', contentTopGap: 8 })
  },
}
