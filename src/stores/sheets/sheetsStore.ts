import { atom } from 'nanostores'
import { ColDef } from 'ag-grid-community'
import { MOCK_DATASETS, DatasetInfo } from '@/data/mockDatasets'
import { SUPABASE_DATASETS, fetchSupabaseTable, SupabaseDatasetConfig } from '@/data/supabaseDatasets'

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
// Start with Supabase datasets (merged with mock datasets for backward compatibility)
const initialDatasets: DatasetInfo[] = [
  ...SUPABASE_DATASETS.map(ds => ({
    id: ds.id,
    name: ds.name,
    description: ds.description,
    rows: 0, // Will be fetched dynamically
    columns: ds.columnDefs.length,
    size: 'Loading...',
    type: 'grid' as const,
    lastModified: new Date(),
    data: [],
    columnDefs: ds.columnDefs
  })),
  ...MOCK_DATASETS
]

export const availableDatasetsStore = atom<DatasetInfo[]>(initialDatasets)
export const activeDatasetIdStore = atom<string>('contas-a-receber') // Default to Contas a Receber
export const activeDatasetStore = atom<ActiveDataset | null>(null)
export const supabaseDatasetsConfigStore = atom<SupabaseDatasetConfig[]>(SUPABASE_DATASETS)

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
export const switchToDataset = async (datasetId: string) => {
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

    let dataToUse = dataset.data

    // Check if this is a Supabase dataset and fetch real data
    const supabaseConfig = SUPABASE_DATASETS.find(ds => ds.id === datasetId)
    if (supabaseConfig) {
      console.log(`Fetching Supabase data for: ${supabaseConfig.tableName}`)
      const supabaseData = await fetchSupabaseTable(supabaseConfig.tableName)
      dataToUse = supabaseData

      // Update dataset in store with fetched data
      const updatedDatasets = datasets.map(ds => {
        if (ds.id === datasetId) {
          return {
            ...ds,
            data: supabaseData,
            rows: supabaseData.length,
            size: `${supabaseData.length} registros`
          }
        }
        return ds
      })
      availableDatasetsStore.set(updatedDatasets)
    }

    // Create active dataset object
    const activeDataset: ActiveDataset = {
      id: dataset.id,
      name: dataset.name,
      data: dataToUse,
      columnDefs: dataset.columnDefs,
      totalRows: dataToUse.length,
      totalCols: dataset.columns
    }

    // Update active dataset store
    activeDatasetStore.set(activeDataset)

    // Extract headers from column definitions
    const headers = dataset.columnDefs.map(col => col.headerName || col.field || '')

    // Convert data to rows format (legacy compatibility)
    const rows = dataToUse.map(item =>
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
      totalRows: dataToUse.length,
      totalCols: dataset.columns
    })

    console.log(`Switched to dataset: ${dataset.name} (${dataToUse.length} rows, ${dataset.columns} columns)`)

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

// Add new dataset from imported file
export const addDataset = (
  csvData: {
    headers: string[]
    rows: Array<Record<string, unknown>>
    fileName: string
    fileSize: number
    rowCount: number
    columnCount: number
  }
) => {
  setSheetLoading(true)
  setSheetError(null)

  try {
    // Generate unique ID
    const timestamp = Date.now()
    const cleanFileName = csvData.fileName.replace(/\.[^/.]+$/, '') // Remove extension
    const datasetId = `imported-${cleanFileName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}`

    // Generate column definitions
    const columnDefs = generateColumnDefs(csvData.headers, csvData.rows)

    // Create dataset info
    const newDataset: DatasetInfo = {
      id: datasetId,
      name: cleanFileName,
      description: `Importado de ${csvData.fileName} • ${csvData.rowCount} registros`,
      rows: csvData.rowCount,
      columns: csvData.columnCount,
      size: formatFileSize(csvData.fileSize),
      type: getFileType(csvData.fileName),
      lastModified: new Date(),
      data: csvData.rows,
      columnDefs
    }

    // Add to available datasets
    const currentDatasets = availableDatasetsStore.get()
    availableDatasetsStore.set([...currentDatasets, newDataset])

    // Auto-activate the new dataset
    switchToDataset(datasetId)

    console.log(`Dataset imported: ${newDataset.name} (${newDataset.rows} rows, ${newDataset.columns} columns)`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao importar dataset'
    setSheetError(errorMessage)
    console.error('Error importing dataset:', error)
  } finally {
    setSheetLoading(false)
  }
}

// Remove dataset from available datasets
export const removeDataset = (datasetId: string) => {
  const currentDatasets = availableDatasetsStore.get()
  const updatedDatasets = currentDatasets.filter(ds => ds.id !== datasetId)
  
  // If removing active dataset, switch to first available
  const activeId = activeDatasetIdStore.get()
  if (activeId === datasetId && updatedDatasets.length > 0) {
    switchToDataset(updatedDatasets[0].id)
  }
  
  availableDatasetsStore.set(updatedDatasets)
  
  console.log(`Dataset removed: ${datasetId}`)
}

// Utility function to generate column definitions based on data
const generateColumnDefs = (headers: string[], rows: Array<Record<string, unknown>>): ColDef[] => {
  return headers.map((header, index) => {
    const field = header
    const sampleValues = rows.slice(0, 10).map(row => row[field])
    const dataType = detectColumnType(sampleValues)

    const baseConfig: ColDef = {
      field,
      headerName: header,
      width: Math.min(Math.max(header.length * 10, 100), 200),
      editable: true,
      sortable: true,
      filter: getFilterType(dataType),
    }

    // Add type-specific configurations
    switch (dataType) {
      case 'number':
        return {
          ...baseConfig,
          enableValue: true,
          aggFunc: 'avg',
          valueFormatter: (params) => {
            if (params.value == null) return ''
            return typeof params.value === 'number' 
              ? params.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
              : String(params.value)
          }
        }

      case 'currency':
        return {
          ...baseConfig,
          enableValue: true,
          aggFunc: 'sum',
          valueFormatter: (params) => {
            if (params.value == null) return ''
            return typeof params.value === 'number'
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value)
              : String(params.value)
          }
        }

      case 'date':
        return {
          ...baseConfig,
          filter: 'agDateColumnFilter',
          valueFormatter: (params) => {
            if (!params.value) return ''
            const date = new Date(params.value as string)
            return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR')
          }
        }

      case 'boolean':
        return {
          ...baseConfig,
          enableRowGroup: true,
          enablePivot: true,
          cellRenderer: (params: { value: unknown }) => {
            if (params.value === true || params.value === 'true' || params.value === 'sim') return '✓'
            if (params.value === false || params.value === 'false' || params.value === 'não') return '✗'
            return String(params.value || '')
          },
          cellStyle: (params) => {
            const isTrue = params.value === true || params.value === 'true' || params.value === 'sim'
            const isFalse = params.value === false || params.value === 'false' || params.value === 'não'
            if (isTrue) return { color: '#2e7d32', fontWeight: 'bold' }
            if (isFalse) return { color: '#c62828', fontWeight: 'bold' }
            return undefined
          }
        }

      case 'string':
      default:
        return {
          ...baseConfig,
          enableRowGroup: true,
          enablePivot: index < 3 // Only enable pivot for first few string columns
        }
    }
  })
}

// Detect column data type based on sample values
const detectColumnType = (sampleValues: unknown[]): 'number' | 'currency' | 'date' | 'boolean' | 'string' => {
  const nonNullValues = sampleValues.filter(v => v != null && v !== '')

  if (nonNullValues.length === 0) return 'string'

  // Check for booleans
  const booleanCount = nonNullValues.filter(v => 
    v === true || v === false || 
    v === 'true' || v === 'false' ||
    v === 'sim' || v === 'não'
  ).length
  if (booleanCount / nonNullValues.length >= 0.8) return 'boolean'

  // Check for numbers
  const numberCount = nonNullValues.filter(v => typeof v === 'number' || !isNaN(Number(v))).length
  if (numberCount / nonNullValues.length >= 0.8) {
    // Check if it looks like currency
    const currencyCount = nonNullValues.filter(v => {
      const str = String(v)
      return /^[R$€£¥₹]\s*[\d,.]/.test(str) || /[\d,.]+\s*[R$€£¥₹]/.test(str)
    }).length
    if (currencyCount / nonNullValues.length >= 0.6) return 'currency'
    
    return 'number'
  }

  // Check for dates
  const dateCount = nonNullValues.filter(v => {
    const dateValue = new Date(String(v))
    return !isNaN(dateValue.getTime()) && String(v).match(/\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/)
  }).length
  if (dateCount / nonNullValues.length >= 0.6) return 'date'

  return 'string'
}

// Get appropriate filter type for data type
const getFilterType = (dataType: string): string => {
  switch (dataType) {
    case 'number':
    case 'currency':
      return 'agNumberColumnFilter'
    case 'date':
      return 'agDateColumnFilter'
    case 'boolean':
    case 'string':
    default:
      return 'agSetColumnFilter'
  }
}

// Get file type based on extension
const getFileType = (fileName: string): DatasetInfo['type'] => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'csv': return 'csv'
    case 'json': return 'json'
    case 'xlsx':
    case 'xls': return 'excel'
    default: return 'csv'
  }
}

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}