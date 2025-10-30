import { atom } from 'nanostores'

export type ReportsCadence = 'mensal' | 'trimestral' | 'anual'
export type ReportsView = 'valores' | 'percentual' | 'comparativo'

export type ReportsDateRange = { from?: Date; to?: Date }

export interface ReportsFiltersState {
  dateRange?: ReportsDateRange
  cadence: ReportsCadence
  view: ReportsView
  filters: {
    centrosCusto?: string[]
    contas?: string[]
  }
}

export const $reportsFilters = atom<ReportsFiltersState>({
  dateRange: undefined,
  cadence: 'mensal',
  view: 'valores',
  filters: {},
})

export const reportsFiltersActions = {
  setDateRange: (range?: ReportsDateRange) => {
    $reportsFilters.set({ ...$reportsFilters.get(), dateRange: range })
  },
  setCadence: (cadence: ReportsCadence) => {
    $reportsFilters.set({ ...$reportsFilters.get(), cadence })
  },
  setView: (view: ReportsView) => {
    $reportsFilters.set({ ...$reportsFilters.get(), view })
  },
  setFilters: (filters: ReportsFiltersState['filters']) => {
    $reportsFilters.set({ ...$reportsFilters.get(), filters })
  },
}

