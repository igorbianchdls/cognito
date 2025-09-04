import { atom, computed } from 'nanostores'
import type { 
  TableWidget, 
  CreateTableWidgetProps, 
  TableConfig,
  TableColumn,
  TableRow
} from '@/types/apps/tableWidgets'
import { 
  DEFAULT_TABLE_CONFIG,
  generateSampleTableData
} from '@/types/apps/tableWidgets'
import type { LayoutItem } from '@/types/apps/baseWidget'

// Main tables atom
export const $tableWidgets = atom<TableWidget[]>([])

// Convert Tables to DroppedWidget format for direct consumption
export const $tablesAsDropped = computed([$tableWidgets], (tables) => {
  return tables.map(table => ({
    i: table.i,
    type: 'table' as const,
    name: table.name,
    x: table.x,
    y: table.y,
    w: table.w,
    h: table.h,
    tableConfig: table.config
  }))
})

// Selected table atom
export const $selectedTableId = atom<string | null>(null)

// Computed for selected table
export const $selectedTable = computed([$tableWidgets, $selectedTableId], (tables, selectedId) => {
  if (!selectedId) return null
  return tables.find(t => t.i === selectedId) || null
})

// Tables with row counts
export const $tablesWithCounts = computed([$tableWidgets], (tables) => {
  return tables.map(table => ({
    ...table,
    rowCount: table.config.data?.length || 0,
    columnCount: table.config.columns?.length || 0
  }))
})

// Table creation helper
function createBaseTable(props: CreateTableWidgetProps): TableWidget {
  const timestamp = Date.now()
  const sampleData = generateSampleTableData(10)
  
  return {
    id: `table-${timestamp}`,
    i: `table-${timestamp}`,
    name: props.name,
    type: 'table',
    icon: props.icon || '📋',
    description: props.description || 'Data table widget',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    defaultWidth: 6,
    defaultHeight: 4,
    color: '#3B82F6',
    config: {
      ...DEFAULT_TABLE_CONFIG,
      // Use sample data if no data provided
      data: sampleData.rows,
      columns: sampleData.columns,
      ...props.config
    }
  }
}

// Table Actions
export const tableActions = {
  // Set all tables
  setTables: (tables: TableWidget[]) => {
    console.log('📋 Setting tables:', tables.length)
    $tableWidgets.set(tables)
  },

  // Add table
  addTable: (props: CreateTableWidgetProps & { position?: { x: number; y: number }, size?: { w: number; h: number } }) => {
    console.log('➕ Adding table:', props.name)
    
    const table = createBaseTable(props)
    
    // Apply position and size if provided
    if (props.position) {
      table.x = props.position.x
      table.y = props.position.y
    }
    if (props.size) {
      table.w = props.size.w
      table.h = props.size.h
    }
    
    const currentTables = $tableWidgets.get()
    $tableWidgets.set([...currentTables, table])
    
    return table
  },

  // Edit table
  editTable: (tableId: string, changes: Partial<TableWidget>) => {
    console.log('✏️ Editing table:', { tableId, changes })
    const currentTables = $tableWidgets.get()
    
    const updatedTables = currentTables.map(table => 
      table.i === tableId ? { ...table, ...changes } : table
    )
    $tableWidgets.set(updatedTables)
  },

  // Update table config specifically
  updateTableConfig: (tableId: string, configChanges: Partial<TableConfig>) => {
    console.log('🔧 Updating table config:', { tableId, configChanges })
    const currentTables = $tableWidgets.get()
    
    const updatedTables = currentTables.map(table => {
      if (table.i === tableId) {
        return {
          ...table,
          config: { ...table.config, ...configChanges }
        }
      }
      return table
    })
    $tableWidgets.set(updatedTables)
  },

  // Update table data
  updateTableData: (tableId: string, data: TableRow[]) => {
    console.log('📊 Updating table data:', { tableId, rowCount: data.length })
    const currentTables = $tableWidgets.get()
    
    const updatedTables = currentTables.map(table => {
      if (table.i === tableId) {
        return {
          ...table,
          config: {
            ...table.config,
            data
          }
        }
      }
      return table
    })
    $tableWidgets.set(updatedTables)
  },

  // Update table columns
  updateTableColumns: (tableId: string, columns: TableColumn[]) => {
    console.log('📋 Updating table columns:', { tableId, columnCount: columns.length })
    const currentTables = $tableWidgets.get()
    
    const updatedTables = currentTables.map(table => {
      if (table.i === tableId) {
        return {
          ...table,
          config: {
            ...table.config,
            columns
          }
        }
      }
      return table
    })
    $tableWidgets.set(updatedTables)
  },

  // Add row to table
  addTableRow: (tableId: string, row: TableRow) => {
    console.log('➕ Adding row to table:', { tableId, rowId: row.id })
    const currentTables = $tableWidgets.get()
    
    const updatedTables = currentTables.map(table => {
      if (table.i === tableId) {
        const currentData = table.config.data || []
        return {
          ...table,
          config: {
            ...table.config,
            data: [...currentData, row]
          }
        }
      }
      return table
    })
    $tableWidgets.set(updatedTables)
  },

  // Remove row from table
  removeTableRow: (tableId: string, rowId: string | number) => {
    console.log('🗑️ Removing row from table:', { tableId, rowId })
    const currentTables = $tableWidgets.get()
    
    const updatedTables = currentTables.map(table => {
      if (table.i === tableId) {
        const currentData = table.config.data || []
        return {
          ...table,
          config: {
            ...table.config,
            data: currentData.filter(row => row.id !== rowId)
          }
        }
      }
      return table
    })
    $tableWidgets.set(updatedTables)
  },

  // Update specific row in table
  updateTableRow: (tableId: string, rowId: string | number, updates: Partial<TableRow>) => {
    console.log('✏️ Updating table row:', { tableId, rowId, updates })
    const currentTables = $tableWidgets.get()
    
    const updatedTables = currentTables.map(table => {
      if (table.i === tableId) {
        const currentData = table.config.data || []
        return {
          ...table,
          config: {
            ...table.config,
            data: currentData.map(row => 
              row.id === rowId ? { ...row, ...updates } : row
            )
          }
        }
      }
      return table
    })
    $tableWidgets.set(updatedTables)
  },

  // Remove table
  removeTable: (tableId: string) => {
    console.log('🗑️ Removing table:', tableId)
    const currentTables = $tableWidgets.get()
    const newTables = currentTables.filter(table => table.i !== tableId)
    $tableWidgets.set(newTables)
    
    // Clear selection if removed table was selected
    if ($selectedTableId.get() === tableId) {
      $selectedTableId.set(null)
    }
  },

  // Select table
  selectTable: (tableId: string | null) => {
    console.log('🎯 Selecting table:', tableId)
    $selectedTableId.set(tableId)
  },

  // Update layout (for react-grid-layout)
  updateTablesLayout: (layout: LayoutItem[]) => {
    console.log('📐 Updating tables layout for', layout.length, 'items')
    const currentTables = $tableWidgets.get()
    
    const updatedTables = currentTables.map(table => {
      const layoutItem = layout.find(l => l.i === table.i)
      return layoutItem ? { ...table, ...layoutItem } : table
    })
    $tableWidgets.set(updatedTables)
  },

  // Duplicate table
  duplicateTable: (tableId: string) => {
    console.log('📋 Duplicating table:', tableId)
    const currentTables = $tableWidgets.get()
    const tableToDuplicate = currentTables.find(table => table.i === tableId)
    
    if (!tableToDuplicate) {
      console.warn('Table not found for duplication:', tableId)
      return
    }
    
    const timestamp = Date.now()
    const duplicatedTable: TableWidget = {
      ...tableToDuplicate,
      id: `table-${timestamp}`,
      i: `table-${timestamp}`,
      name: `${tableToDuplicate.name} (Copy)`,
      x: tableToDuplicate.x + 1,
      y: tableToDuplicate.y + 1,
      config: {
        ...tableToDuplicate.config,
        // Deep clone the data array to avoid shared references
        data: tableToDuplicate.config.data ? [...tableToDuplicate.config.data] : undefined,
        columns: tableToDuplicate.config.columns ? [...tableToDuplicate.config.columns] : undefined
      }
    }
    
    $tableWidgets.set([...currentTables, duplicatedTable])
    return duplicatedTable
  },

  // Import CSV data to table
  importCSVToTable: (tableId: string, csvData: string, hasHeaders: boolean = true) => {
    console.log('📤 Importing CSV to table:', { tableId, hasHeaders })
    
    try {
      const lines = csvData.trim().split('\n')
      const headers = hasHeaders ? lines[0].split(',').map(h => h.trim()) : []
      const dataLines = hasHeaders ? lines.slice(1) : lines
      
      // Generate columns from headers or default names
      const columns: TableColumn[] = headers.length > 0 
        ? headers.map((header, index) => ({
            id: `col-${index}`,
            header: header,
            accessorKey: header.toLowerCase().replace(/\s+/g, '_'),
            sortable: true,
            type: 'text' as const
          }))
        : Array.from({ length: dataLines[0]?.split(',').length || 0 }, (_, index) => ({
            id: `col-${index}`,
            header: `Column ${index + 1}`,
            accessorKey: `column_${index + 1}`,
            sortable: true,
            type: 'text' as const
          }))
      
      // Parse data rows
      const data: TableRow[] = dataLines.map((line, index) => {
        const values = line.split(',').map(v => v.trim())
        const row: TableRow = { id: index + 1 }
        
        columns.forEach((col, colIndex) => {
          row[col.accessorKey] = values[colIndex] || ''
        })
        
        return row
      })
      
      // Update table with new data and columns
      tableActions.updateTableConfig(tableId, { data, columns })
      
      console.log('✅ CSV import successful:', { rows: data.length, columns: columns.length })
      return { success: true, rows: data.length, columns: columns.length }
    } catch (error) {
      console.error('❌ CSV import failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Export table data to CSV
  exportTableToCSV: (tableId: string): string | null => {
    console.log('📥 Exporting table to CSV:', tableId)
    const currentTables = $tableWidgets.get()
    const table = currentTables.find(t => t.i === tableId)
    
    if (!table || !table.config.data || !table.config.columns) {
      console.warn('Table not found or has no data:', tableId)
      return null
    }
    
    const { data, columns } = table.config
    
    // Create CSV headers
    const headers = columns.map(col => col.header).join(',')
    
    // Create CSV rows
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.accessorKey]
        // Escape values that contain commas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : String(value || '')
      }).join(',')
    )
    
    const csvContent = [headers, ...rows].join('\n')
    
    console.log('✅ CSV export successful:', { rows: rows.length })
    return csvContent
  }
}