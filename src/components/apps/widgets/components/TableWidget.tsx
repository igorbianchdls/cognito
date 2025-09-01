'use client'

import { useState, useEffect } from 'react'
import { DataTable, createSortableHeader, type TableData } from '@/components/widgets/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { DroppedWidget } from '@/types/apps/widget'
import type { TableConfig } from '@/types/apps/tableWidgets'

interface TableWidgetProps {
  widget: DroppedWidget
}

export default function TableWidget({ widget }: TableWidgetProps) {
  // Get table configuration with backward compatibility (same pattern as charts)
  const tableConfig: TableConfig = widget.config?.tableConfig || {}

  const [data, setData] = useState<TableData[]>([])

  // Initialize data based on widget config
  useEffect(() => {
    // Check if widget has BigQuery data (similar to chart widgets)
    if (widget.bigqueryData && widget.bigqueryData.data && Array.isArray(widget.bigqueryData.data)) {
      // Use BigQuery data from Universal Builder
      const bigqueryData = widget.bigqueryData.data as Array<Record<string, unknown>>
      const tableData = bigqueryData.map((row, index) => ({
        id: index + 1,
        ...row
      }))
      setData(tableData as TableData[])
      console.log('📋 TableWidget usando dados do BigQuery:', tableData)
    } else if (tableConfig.data && tableConfig.data.length > 0) {
      // Use config data if available
      const configData = tableConfig.data.map((row, index) => ({
        id: index + 1,
        ...row
      }))
      setData(configData as TableData[])
      console.log('📋 TableWidget usando dados do config:', configData)
    } else {
      // Use default sample data as fallback
      const defaultData = [
        { id: 1, name: 'João Silva', email: 'joao@email.com', status: 'Ativo', score: 85 },
        { id: 2, name: 'Maria Santos', email: 'maria@email.com', status: 'Inativo', score: 92 },
        { id: 3, name: 'Pedro Costa', email: 'pedro@email.com', status: 'Ativo', score: 78 },
        { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', status: 'Pendente', score: 88 },
        { id: 5, name: 'Carlos Lima', email: 'carlos@email.com', status: 'Ativo', score: 95 },
      ]
      setData(defaultData)
      console.log('📋 TableWidget usando dados simulados default')
      
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
  }, [widget.config, widget.bigqueryData, tableConfig.data])

  // Default columns configuration
  const defaultColumns: ColumnDef<TableData>[] = [
    {
      accessorKey: 'name',
      header: createSortableHeader('Nome'),
    },
    {
      accessorKey: 'email',
      header: createSortableHeader('Email'),
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
      header: createSortableHeader('Pontuação'),
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
    header: col.sortable !== false ? createSortableHeader(col.header) : col.header,
    size: typeof col.width === 'number' ? col.width : undefined,
  })) || []

  // Generate columns from BigQuery data if no config columns
  const generateColumnsFromData = (data: TableData[]): ColumnDef<TableData>[] => {
    if (data.length === 0) return defaultColumns
    
    const firstRow = data[0]
    return Object.keys(firstRow)
      .filter(key => key !== 'id') // Skip the auto-generated id
      .map(key => ({
        accessorKey: key,
        header: createSortableHeader(key.charAt(0).toUpperCase() + key.slice(1)),
        cell: ({ row }) => {
          const value = row.getValue(key)
          // Format based on value type
          if (typeof value === 'number') {
            return <div className="text-right">{value}</div>
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
          return String(value)
        },
      }))
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
    fontSize: tableConfig.fontSize,
    padding: tableConfig.padding,
  }

  return (
    <div className="h-full w-full">
      <DataTable {...tableProps} />
    </div>
  )
}