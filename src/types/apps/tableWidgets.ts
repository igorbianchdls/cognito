import { BaseWidget } from './baseWidget'

// BigQuery field interface for table data source
export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

// Table BigQuery data interface
export interface TableBigQueryData {
  query: string
  selectedTable: string | null
  selectedColumns: BigQueryField[]
  filters: BigQueryField[]
  data: Record<string, unknown>[] | null
  lastExecuted: Date | null
  isLoading: boolean
  error: string | null
}

// Table column configuration
export interface TableColumn {
  id: string
  header: string
  accessorKey: string
  sortable?: boolean
  width?: number | string
  type?: 'text' | 'number' | 'boolean' | 'date'
  formatter?: (value: string | number | boolean | null | undefined) => string
  textColor?: string
}

// Table-specific configuration
export interface TableConfig {
  // Data properties
  data?: Array<{ [key: string]: string | number | boolean | null | undefined }>
  columns?: TableColumn[]
  
  // BigQuery data source properties
  bigqueryData?: TableBigQueryData
  dataSourceType?: 'manual' | 'bigquery'
  
  // Display options (matching DataTable props)
  searchPlaceholder?: string
  showColumnToggle?: boolean
  showPagination?: boolean
  pageSize?: number
  
  // Data source and simulation control
  dataSource?: string
  refreshRate?: string
  enableSimulation?: boolean
  
  // Styling options
  headerBackground?: string
  headerTextColor?: string
  rowHoverColor?: string
  borderColor?: string
  padding?: number
  borderWidth?: number
  borderRadius?: number
  
  // Header typography
  headerFontSize?: number
  headerFontFamily?: string
  headerFontWeight?: string
  
  // Cell typography  
  fontSize?: number // Mantém para backward compatibility
  cellFontSize?: number
  cellFontFamily?: string
  cellFontWeight?: string
  cellTextColor?: string
  lineHeight?: number
  letterSpacing?: number
  defaultTextAlign?: 'left' | 'center' | 'right' | 'justify'
  
  // Sorting and filtering
  defaultSortColumn?: string
  defaultSortDirection?: 'asc' | 'desc'
  enableSearch?: boolean
  enableFiltering?: boolean
  enableSorting?: boolean
  enableMultiSort?: boolean
  
  // Row selection
  enableRowSelection?: boolean
  selectionMode?: 'single' | 'multiple'
  
  // Export options
  enableExport?: boolean
  exportFormats?: ('csv' | 'excel' | 'pdf')[]
  exportSelectedOnly?: boolean
  exportWithHeaders?: boolean
  exportFilteredData?: boolean
  exportButtonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom'
  csvSeparator?: string
  csvEncoding?: string
  pdfOrientation?: 'portrait' | 'landscape'
  pdfPageSize?: string
  pdfIncludeTitle?: boolean
  exportFilePrefix?: string
  exportIncludeTimestamp?: boolean
  
  // Editing options
  editableMode?: boolean
  editableCells?: string[] | 'all' | 'none'
  editableRowActions?: {
    allowAdd?: boolean
    allowDelete?: boolean
    allowDuplicate?: boolean
  }
  validationRules?: {
    [columnKey: string]: {
      required?: boolean
      type?: 'text' | 'number' | 'email' | 'date'
      min?: number
      max?: number
      pattern?: RegExp
    }
  }
  enableValidation?: boolean
  showValidationErrors?: boolean
  saveBehavior?: 'auto' | 'manual' | 'onBlur'
  editTrigger?: 'click' | 'doubleClick' | 'focus'
  
  // Editing colors
  editingCellColor?: string
  validationErrorColor?: string
  modifiedCellColor?: string
  newRowColor?: string
  
  // Performance options
  searchDebounce?: number
  enableVirtualization?: boolean
  enableAutoRefresh?: boolean
  autoRefreshInterval?: number
  
  // Responsive options
  enableResponsive?: boolean
  stackOnMobile?: boolean
  
  // Callback functions
  onCellEdit?: (rowIndex: number, columnKey: string, newValue: string | number | boolean | null | undefined) => void
  onRowAdd?: (newRow: Record<string, string | number | boolean | null | undefined>) => void
  onRowDelete?: (rowIndex: number) => void
  onRowDuplicate?: (rowIndex: number) => void
}

// Table Widget interface
export interface TableWidget extends BaseWidget {
  type: 'table'
  config: TableConfig
}

// Table creation props
export interface CreateTableWidgetProps {
  name: string
  icon?: string
  description?: string
  config?: Partial<TableConfig>
}

// Table data interface (for runtime data)
export interface TableData {
  rows: Array<Record<string, string | number | boolean | null | undefined>>
  columns: TableColumn[]
  totalRows: number
  currentPage?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  searchQuery?: string
}

// Table row interface
export interface TableRow {
  id: string | number
  [key: string]: string | number | boolean | null | undefined
}

// Table pagination info
export interface TablePaginationInfo {
  currentPage: number
  totalPages: number
  pageSize: number
  totalRows: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Type guards
export function isTableWidget(widget: BaseWidget): widget is TableWidget {
  return widget.type === 'table'
}

// Table column type helpers
export const COLUMN_TYPES = {
  text: {
    defaultWidth: 150,
    align: 'left' as const
  },
  number: {
    defaultWidth: 100,
    align: 'right' as const
  },
  boolean: {
    defaultWidth: 80,
    align: 'center' as const
  },
  date: {
    defaultWidth: 120,
    align: 'left' as const
  }
} as const

// Default table configuration
export const DEFAULT_TABLE_CONFIG: Required<Omit<TableConfig, 'data' | 'columns' | 'dataSource' | 'refreshRate' | 'defaultSortColumn' | 'exportFormats' | 'headerFontFamily' | 'headerFontWeight' | 'cellFontFamily' | 'cellFontWeight' | 'validationRules' | 'onCellEdit' | 'onRowAdd' | 'onRowDelete' | 'onRowDuplicate'>> = {
  searchPlaceholder: 'Search...',
  showColumnToggle: true,
  showPagination: true,
  pageSize: 10,
  enableSimulation: false,
  headerBackground: '#f9fafb',
  headerTextColor: '#374151',
  rowHoverColor: '#f3f4f6',
  borderColor: '#e5e7eb',
  fontSize: 14,
  padding: 12,
  borderWidth: 1,
  borderRadius: 6,
  // Header typography defaults
  headerFontSize: 14,
  // Cell typography defaults  
  cellFontSize: 14,
  cellTextColor: '#1f2937',
  lineHeight: 1.4,
  letterSpacing: 0,
  defaultTextAlign: 'left',
  defaultSortDirection: 'asc',
  enableSearch: true,
  enableFiltering: false,
  enableSorting: true,
  enableMultiSort: false,
  enableRowSelection: false,
  selectionMode: 'single',
  enableExport: false,
  exportSelectedOnly: false,
  exportWithHeaders: true,
  exportFilteredData: false,
  exportButtonPosition: 'top-right',
  csvSeparator: ',',
  csvEncoding: 'utf-8',
  pdfOrientation: 'landscape',
  pdfPageSize: 'a4',
  pdfIncludeTitle: true,
  exportFilePrefix: 'table_export',
  exportIncludeTimestamp: true,
  // Editing defaults
  editableMode: false,
  editableCells: 'none',
  editableRowActions: {
    allowAdd: false,
    allowDelete: false,
    allowDuplicate: false
  },
  enableValidation: false,
  showValidationErrors: false,
  saveBehavior: 'onBlur',
  editTrigger: 'doubleClick',
  editingCellColor: '#fef3c7',
  validationErrorColor: '#fef2f2',
  modifiedCellColor: '#f0f9ff',
  newRowColor: '#f0fdf4',
  // Performance defaults
  searchDebounce: 300,
  enableVirtualization: false,
  enableAutoRefresh: false,
  autoRefreshInterval: 30,
  // Responsive defaults
  enableResponsive: true,
  stackOnMobile: false
}

// Sample table data generator
export function generateSampleTableData(rows: number = 10): TableData {
  const columns: TableColumn[] = [
    { id: 'id', header: 'ID', accessorKey: 'id', type: 'number', width: 80 },
    { id: 'name', header: 'Name', accessorKey: 'name', type: 'text', sortable: true },
    { id: 'email', header: 'Email', accessorKey: 'email', type: 'text', sortable: true },
    { id: 'status', header: 'Status', accessorKey: 'status', type: 'text', width: 100 },
    { id: 'created', header: 'Created', accessorKey: 'created', type: 'date', sortable: true }
  ]
  
  const sampleRows = Array.from({ length: rows }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: ['Active', 'Inactive', 'Pending'][Math.floor(Math.random() * 3)],
    created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }))
  
  return {
    rows: sampleRows,
    columns,
    totalRows: rows
  }
}