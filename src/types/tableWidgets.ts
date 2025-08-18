import { BaseWidget } from './baseWidget'

// Table column configuration
export interface TableColumn {
  id: string
  header: string
  accessorKey: string
  sortable?: boolean
  width?: number | string
  type?: 'text' | 'number' | 'boolean' | 'date'
  formatter?: (value: any) => string
}

// Table-specific configuration
export interface TableConfig {
  // Data properties
  data?: Array<{ [key: string]: string | number | boolean | null | undefined }>
  columns?: TableColumn[]
  
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
  fontSize?: number
  padding?: number
  
  // Sorting and filtering
  defaultSortColumn?: string
  defaultSortDirection?: 'asc' | 'desc'
  enableSearch?: boolean
  enableFiltering?: boolean
  
  // Row selection
  enableRowSelection?: boolean
  selectionMode?: 'single' | 'multiple'
  
  // Export options
  enableExport?: boolean
  exportFormats?: ('csv' | 'excel' | 'pdf')[]
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
  rows: Array<Record<string, any>>
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
  [key: string]: any
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
export const DEFAULT_TABLE_CONFIG: Required<Omit<TableConfig, 'data' | 'columns' | 'dataSource' | 'refreshRate' | 'defaultSortColumn' | 'exportFormats'>> = {
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
  defaultSortDirection: 'asc',
  enableSearch: true,
  enableFiltering: false,
  enableRowSelection: false,
  selectionMode: 'single',
  enableExport: false
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