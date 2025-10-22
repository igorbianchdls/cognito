import { atom } from 'nanostores'

export type TituloState = {
  title: string
  subtitle?: string
  // Typography
  titleFontFamily?: string
  titleFontSize?: number
  titleFontWeight?: string
  titleColor?: string
  titleLetterSpacing?: number
}

export type TabsOption = {
  value: string
  label: string
}

export type TabsState = {
  options: TabsOption[]
  selected: string
  // Typography for options
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  letterSpacing?: number
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
  // Row and border styling
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
}

const DEFAULT_TITULO: TituloState = {
  title: 'Financeiro',
  subtitle: 'Selecione uma opção para visualizar os dados',
  titleFontFamily: 'Geist',
  titleFontSize: 24,
  titleFontWeight: '600',
  titleColor: '#111827',
  titleLetterSpacing: 0,
}

const DEFAULT_TABS: TabsState = {
  options: [
    { value: 'visao', label: 'Visão geral' },
    { value: 'contas', label: 'Contas' },
    { value: 'pagamentos', label: 'Pagamentos' },
    { value: 'recebimentos', label: 'Recebimentos' },
  ],
  selected: 'visao',
  fontFamily: 'Geist',
  fontSize: 14,
  fontWeight: '500',
  color: '#111827',
  letterSpacing: 0,
}

const DEFAULT_TABELA_UI: TabelaUIState = {
  pageSize: 10,
  showPagination: true,
  enableSearch: true,
  enableColumnToggle: true,
  enableRowSelection: true,
  selectionMode: 'multiple',
  stickyHeader: false,
  headerBg: '#f9fafb',
  headerText: '#374151',
  cellText: '#1f2937',
  headerFontSize: 13,
  cellFontSize: 13,
  headerFontFamily: 'Geist',
  headerFontWeight: '600',
  cellFontFamily: 'Geist',
  cellFontWeight: '400',
  headerLetterSpacing: 0,
  cellLetterSpacing: 0,
  enableZebraStripes: true,
  rowAlternateBgColor: '#fafafa',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  selectionColumnWidth: 48,
  defaultSortColumn: undefined,
  defaultSortDirection: 'asc',
}

export const $titulo = atom<TituloState>({ ...DEFAULT_TITULO })
export const $tabs = atom<TabsState>({ ...DEFAULT_TABS })
export const $tabelaUI = atom<TabelaUIState>({ ...DEFAULT_TABELA_UI })
export const DEFAULT_TOOLBAR_UI: ToolbarUIState = {
  fontFamily: 'Geist',
  fontSize: 14,
  fontWeight: '500',
  fontColor: '#6b7280',
  letterSpacing: 0,
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
  borderDistanceTop: 8,
  underlineColor: '#d1d5db',
  underlineWidth: 1,
  underlineOffsetTop: 0,
  iconGap: 8,
  iconColor: '#9ca3af',
  iconSize: 16,
  searchWidth: 240,
}
export const $toolbarUI = atom<ToolbarUIState>({ ...DEFAULT_TOOLBAR_UI })
export const DEFAULT_LAYOUT: LayoutState = {
  mbTitle: 16,
  mbTabs: 16,
  mbTable: 24,
}
export const $layout = atom<LayoutState>({ ...DEFAULT_LAYOUT })

export const financeiroUiActions = {
  setTitulo: (partial: Partial<TituloState>) => {
    $titulo.set({ ...$titulo.get(), ...partial })
  },
  setTabs: (partial: Partial<TabsState>) => {
    $tabs.set({ ...$tabs.get(), ...partial })
  },
  setTabelaUI: (partial: Partial<TabelaUIState>) => {
    $tabelaUI.set({ ...$tabelaUI.get(), ...partial })
  },
  setToolbarUI: (partial: Partial<ToolbarUIState>) => {
    $toolbarUI.set({ ...$toolbarUI.get(), ...partial })
  },
  setLayout: (partial: Partial<LayoutState>) => {
    $layout.set({ ...$layout.get(), ...partial })
  },
  resetAll: () => {
    $titulo.set({ ...DEFAULT_TITULO })
    $tabs.set({ ...DEFAULT_TABS })
    $tabelaUI.set({ ...DEFAULT_TABELA_UI })
    $toolbarUI.set({ ...DEFAULT_TOOLBAR_UI })
    $layout.set({ ...DEFAULT_LAYOUT })
  },
}
