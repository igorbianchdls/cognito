'use client'

import { useState, useEffect, useMemo } from 'react'
import { DataTable, type TableData } from '@/components/widgets/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { TableConfig } from '@/types/apps/tableWidgets'

interface TableWidgetProps {
  widget: DroppedWidget
}

export default function TableWrapper({ widget }: TableWidgetProps) {
  // Get table configuration - REACTIVE like KPI pattern  
  const tableConfig: TableConfig = useMemo(() => {
    console.log('🔄 TableWidget tableConfig recalculated for widget:', widget.i, {
      hasTableConfig: !!widget.tableConfig,
      hasNestedTableConfig: !!widget.config?.tableConfig,
      configKeys: widget.tableConfig ? Object.keys(widget.tableConfig) : [],
      timestamp: Date.now()
    })
    
    const config = widget.tableConfig || widget.config?.tableConfig || {}
    console.log('🔄 TableWidget final config:', config)
    return config
  }, [widget.tableConfig, widget.config?.tableConfig, widget.i])

  const [data, setData] = useState<TableData[]>([])
  
  // Handle data changes from editing
  const handleDataChange = (newData: TableData[]) => {
    setData(newData)
    console.log('📝 TableWidget data changed:', newData)
  }
  
  // Handle individual cell edits
  const handleCellEdit = (rowIndex: number, columnKey: string, newValue: string | number | boolean | null | undefined) => {
    console.log('📝 TableWidget cell edited:', { rowIndex, columnKey, newValue })
    // You can add specific business logic here like API calls
  }
  
  // Handle row operations
  const handleRowAdd = (newRow: Record<string, string | number | boolean | null | undefined>) => {
    console.log('➕ TableWidget row added:', newRow)
    // You can add specific business logic here like API calls
  }
  
  const handleRowDelete = (rowIndex: number) => {
    console.log('🗑️ TableWidget row deleted:', rowIndex)
    // You can add specific business logic here like API calls
  }
  
  const handleRowDuplicate = (rowIndex: number) => {
    console.log('📋 TableWidget row duplicated:', rowIndex)
    // You can add specific business logic here like API calls
  }

  // Initialize data - SIMPLE like KPI pattern
  useEffect(() => {
    console.log('📋 TableWidget DEBUG:', {
      hasTableConfigData: !!tableConfig.data,
      tableConfigDataLength: tableConfig.data?.length,
      tableConfig: tableConfig
    })

    // Real BigQuery data from config (like KPI)
    if (tableConfig.data && Array.isArray(tableConfig.data) && tableConfig.data.length > 0) {
      const configData = tableConfig.data.map((row, index) => ({
        id: row.id || index + 1,
        ...row
      }))
      setData(configData as TableData[])
      console.log('📋 TableWidget using REAL BigQuery data:', configData.length, 'rows')
    } 
    // FALLBACK: Default sample data (only when no real data available)
    else {
      const defaultData = [
        { id: 1, name: 'João Silva', email: 'joao@email.com', status: 'Ativo', score: 85 },
        { id: 2, name: 'Maria Santos', email: 'maria@email.com', status: 'Inativo', score: 92 },
        { id: 3, name: 'Pedro Costa', email: 'pedro@email.com', status: 'Ativo', score: 78 },
        { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', status: 'Pendente', score: 88 },
        { id: 5, name: 'Carlos Lima', email: 'carlos@email.com', status: 'Ativo', score: 95 },
      ]
      setData(defaultData)
      console.log('📋 TableWidget using fallback sample data (no real data available)')
      
      // Simulate real-time data updates for sample data only
      const interval = setInterval(() => {
        setData(prevData => 
          prevData.map(item => ({
            ...item,
            score: Math.floor(Math.random() * 30) + 70, // Score between 70-100
          }))
        )
      }, 8000) // Update every 8 seconds

      return () => clearInterval(interval)
    }
  }, [tableConfig]) // React to any tableConfig change (like KPI)

  // Default columns configuration
  const defaultColumns: ColumnDef<TableData>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.getValue('status') === 'Ativo' 
            ? 'bg-green-100 text-green-800'
            : row.getValue('status') === 'Inativo'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.getValue('status')}
        </span>
      ),
    },
    {
      accessorKey: 'score',
      header: 'Pontuação',
      cell: ({ row }) => (
        <div className="text-right">
          {row.getValue('score')}
        </div>
      ),
    },
  ]


  // Convert config columns to ColumnDef format
  const configColumns: ColumnDef<TableData>[] = tableConfig.columns?.map(col => ({
    accessorKey: col.accessorKey,
    header: col.header,
    size: typeof col.width === 'number' ? col.width : undefined,
    cell: ({ row }) => {
      const value = row.getValue(col.accessorKey)
      return (
        <div style={{ color: col.textColor || 'inherit' }}>
          {String(value)}
        </div>
      )
    },
  })) || []

  // Generate columns from BigQuery data if no config columns
  const generateColumnsFromData = (data: TableData[]): ColumnDef<TableData>[] => {
    if (data.length === 0) return defaultColumns
    
    const firstRow = data[0]
    return Object.keys(firstRow)
      .filter(key => key !== 'id') // Skip the auto-generated id
      .map(key => {
        // Find column config for this key to get textColor
        const columnConfig = tableConfig.columns?.find(col => col.accessorKey === key)
        
        return {
          accessorKey: key,
          header: key.charAt(0).toUpperCase() + key.slice(1),
          cell: ({ row }) => {
            const value = row.getValue(key)
            
            // Apply column text color if configured
            const textColor = columnConfig?.textColor || 'inherit'
            
            // Format based on value type
            if (typeof value === 'number') {
              return <div className="text-right" style={{ color: textColor }}>{value}</div>
            }
            if (key === 'status' || key === 'estado' || key === 'situacao') {
              return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  String(value).toLowerCase().includes('ativo') || String(value).toLowerCase().includes('active')
                    ? 'bg-green-100 text-green-800'
                    : String(value).toLowerCase().includes('inativo') || String(value).toLowerCase().includes('inactive')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {String(value)}
                </span>
              )
            }
            return <div style={{ color: textColor }}>{String(value)}</div>
          },
        }
      })
  }

  // Prepare props for DataTable (following chart pattern)
  const tableProps = {
    data,
    columns: configColumns.length > 0 ? configColumns : generateColumnsFromData(data),
    searchPlaceholder: tableConfig.searchPlaceholder || 'Buscar...',
    showColumnToggle: tableConfig.showColumnToggle ?? true,
    showPagination: tableConfig.showPagination ?? true,
    pageSize: tableConfig.pageSize || 10,
    // Pass styling props
    headerBackground: tableConfig.headerBackground,
    headerTextColor: tableConfig.headerTextColor,
    rowHoverColor: tableConfig.rowHoverColor,
    borderColor: tableConfig.borderColor,
    fontSize: tableConfig.fontSize, // Mantém para backward compatibility
    padding: tableConfig.padding,
    // Pass header typography props
    headerFontSize: tableConfig.headerFontSize,
    headerFontFamily: tableConfig.headerFontFamily,
    headerFontWeight: tableConfig.headerFontWeight,
    // Pass cell typography props
    cellFontSize: tableConfig.cellFontSize,
    cellFontFamily: tableConfig.cellFontFamily,
    cellFontWeight: tableConfig.cellFontWeight,
    cellTextColor: tableConfig.cellTextColor,
    // Pass new configuration props
    enableSearch: tableConfig.enableSearch ?? true,
    enableFiltering: tableConfig.enableFiltering ?? false,
    enableRowSelection: tableConfig.enableRowSelection ?? false,
    selectionMode: tableConfig.selectionMode || 'single',
    defaultSortColumn: tableConfig.defaultSortColumn,
    defaultSortDirection: tableConfig.defaultSortDirection || 'asc',
    // Pass editing props
    editableMode: tableConfig.editableMode ?? false,
    editableCells: tableConfig.editableCells ?? 'none',
    editableRowActions: tableConfig.editableRowActions ?? {
      allowAdd: false,
      allowDelete: false,
      allowDuplicate: false
    },
    validationRules: tableConfig.validationRules ?? {},
    enableValidation: tableConfig.enableValidation ?? false,
    showValidationErrors: tableConfig.showValidationErrors ?? false,
    saveBehavior: tableConfig.saveBehavior ?? 'onBlur',
    editTrigger: tableConfig.editTrigger ?? 'doubleClick',
    // Pass editing colors
    editingCellColor: tableConfig.editingCellColor ?? '#fef3c7',
    validationErrorColor: tableConfig.validationErrorColor ?? '#fef2f2',
    modifiedCellColor: tableConfig.modifiedCellColor ?? '#f0f9ff',
    newRowColor: tableConfig.newRowColor ?? '#f0fdf4',
    // Pass callbacks
    onCellEdit: handleCellEdit,
    onRowAdd: handleRowAdd,
    onRowDelete: handleRowDelete,
    onRowDuplicate: handleRowDuplicate,
    onDataChange: handleDataChange,
  }

  return (
    <div className="h-full w-full">
      <DataTable {...tableProps} />
    </div>
  )
}