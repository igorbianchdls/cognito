import { atom } from 'nanostores'

// Types
export interface CellData {
  row: number
  col: number
  value: any
  formula?: string
}

export interface SheetData {
  rows: any[][]
  headers: string[]
  selectedCells: CellData[]
  totalRows: number
  totalCols: number
}

export interface SheetTools {
  addColumn: (name: string, position?: number) => Promise<void>
  applyFormula: (range: string, formula: string) => Promise<void>
  updateCell: (row: number, col: number, value: any) => Promise<void>
  createChart: (range: string, type: string) => Promise<void>
  exportData: (format: 'csv' | 'excel') => Promise<void>
  insertRow: (position?: number) => Promise<void>
  deleteRow: (position: number) => Promise<void>
  deleteColumn: (position: number) => Promise<void>
}

// Atoms
export const univerAPIStore = atom<any>(null)
export const univerInstanceStore = atom<any>(null)
export const sheetDataStore = atom<SheetData>({
  rows: [],
  headers: [],
  selectedCells: [],
  totalRows: 0,
  totalCols: 0
})

export const sheetToolsStore = atom<SheetTools | null>(null)
export const isSheetLoadingStore = atom<boolean>(false)
export const sheetErrorStore = atom<string | null>(null)

// Helper functions
export const updateSheetData = (data: Partial<SheetData>) => {
  const current = sheetDataStore.get()
  sheetDataStore.set({ ...current, ...data })
}

export const setSheetError = (error: string | null) => {
  sheetErrorStore.set(error)
}

export const setSheetLoading = (loading: boolean) => {
  isSheetLoadingStore.set(loading)
}