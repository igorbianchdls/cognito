import { atom } from 'nanostores'
import { ColDef } from 'ag-grid-community'
import { MOCK_DATASETS, DatasetInfo } from '@/data/mockDatasets'

// Types
export interface CellData {
  row: number
  col: number
  value: unknown
  formula?: string
}

export interface SheetData {
  rows: unknown[][]
  headers: string[]
  selectedCells: CellData[]
  totalRows: number
  totalCols: number
}

export interface SheetTools {
  addColumn: (name: string, position?: number) => Promise<void>
  applyFormula: (range: string, formula: string) => Promise<void>
  updateCell: (row: number, col: number, value: unknown) => Promise<void>
  createChart: (range: string, type: string) => Promise<void>
  exportData: (format: 'csv' | 'excel') => Promise<void>
  insertRow: (position?: number) => Promise<void>
  deleteRow: (position: number) => Promise<void>
  deleteColumn: (position: number) => Promise<void>
}

export interface ActiveDataset {
  id: string
  name: string
  data: Array<Record<string, unknown>>
  columnDefs: ColDef[]
  totalRows: number
  totalCols: number
}

// Atoms
export const univerAPIStore = atom<unknown>(null)
export const univerInstanceStore = atom<unknown>(null)

// Datasets Management
export const availableDatasetsStore = atom<DatasetInfo[]>(MOCK_DATASETS)
export const activeDatasetIdStore = atom<string>('produtos') // Default to 'produtos'
export const activeDatasetStore = atom<ActiveDataset | null>(null)

// Legacy Sheet Data (maintained for compatibility)
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

// Dataset Management Functions
export const switchToDataset = (datasetId: string) => {
  setSheetLoading(true)
  setSheetError(null)

  try {
    // Find dataset by ID
    const datasets = availableDatasetsStore.get()
    const dataset = datasets.find(ds => ds.id === datasetId)
    
    if (!dataset) {
      throw new Error(`Dataset '${datasetId}' não encontrado`)
    }

    // Update active dataset ID
    activeDatasetIdStore.set(datasetId)

    // Create active dataset object
    const activeDataset: ActiveDataset = {
      id: dataset.id,
      name: dataset.name,
      data: dataset.data,
      columnDefs: dataset.columnDefs,
      totalRows: dataset.rows,
      totalCols: dataset.columns
    }

    // Update active dataset store
    activeDatasetStore.set(activeDataset)

    // Extract headers from column definitions
    const headers = dataset.columnDefs.map(col => col.headerName || col.field || '')
    
    // Convert data to rows format (legacy compatibility)
    const rows = dataset.data.map(item => 
      dataset.columnDefs.map(col => {
        const dataItem = item as Record<string, unknown>;
        return dataItem[col.field || ''] || '';
      })
    )

    // Update legacy sheet data store for compatibility
    updateSheetData({
      rows,
      headers,
      selectedCells: [],
      totalRows: dataset.rows,
      totalCols: dataset.columns
    })

    console.log(`Switched to dataset: ${dataset.name} (${dataset.rows} rows, ${dataset.columns} columns)`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao trocar dataset'
    setSheetError(errorMessage)
    console.error('Error switching dataset:', error)
  } finally {
    setSheetLoading(false)
  }
}

// Initialize with default dataset on first load
export const initializeDefaultDataset = () => {
  const activeId = activeDatasetIdStore.get()
  if (!activeDatasetStore.get() && activeId) {
    switchToDataset(activeId)
  }
}

// Get current active dataset info
export const getActiveDatasetInfo = (): DatasetInfo | null => {
  const activeId = activeDatasetIdStore.get()
  const datasets = availableDatasetsStore.get()
  return datasets.find(ds => ds.id === activeId) || null
}