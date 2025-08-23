'use client'

import { useState, useEffect } from 'react'
import { DataTable, createSortableHeader, type TableData } from '@/components/widgets/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { DroppedWidget } from '@/types/widget'
import type { TableConfig } from '@/types/tableWidgets'

interface TableWidgetProps {
  widget: DroppedWidget
}

// Helper function to convert hex color + opacity to RGBA
function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default function TableWidget({ widget }: TableWidgetProps) {
  // Get container configuration
  const containerConfig = widget.config?.containerConfig || {}

  // Get table configuration with backward compatibility (same pattern as charts)
  const tableConfig: TableConfig = widget.config?.tableConfig || {}

  // Default simulation data (only used if no real data provided)
  const [simulatedData, setSimulatedData] = useState<TableData[]>([
    { id: 1, name: 'João Silva', email: 'joao@email.com', status: 'Ativo', score: 85 },
    { id: 2, name: 'Maria Santos', email: 'maria@email.com', status: 'Inativo', score: 92 },
    { id: 3, name: 'Pedro Costa', email: 'pedro@email.com', status: 'Ativo', score: 78 },
    { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', status: 'Pendente', score: 88 },
    { id: 5, name: 'Carlos Lima', email: 'carlos@email.com', status: 'Ativo', score: 95 },
  ])

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

  // Determine if we should use simulation (same pattern as KPI)
  const hasRealData = tableConfig.data !== undefined && tableConfig.data.length > 0
  const shouldSimulate = tableConfig.enableSimulation !== false && !hasRealData

  // Simulate real-time data updates (only if simulation is enabled and no real data)
  useEffect(() => {
    if (!shouldSimulate) return

    const interval = setInterval(() => {
      setSimulatedData(prevData => 
        prevData.map(item => ({
          ...item,
          score: Math.floor(Math.random() * 30) + 70, // Score between 70-100
        }))
      )
    }, 8000) // Update every 8 seconds

    return () => clearInterval(interval)
  }, [shouldSimulate])

  // Convert config columns to ColumnDef format
  const configColumns: ColumnDef<TableData>[] = tableConfig.columns?.map(col => ({
    accessorKey: col.accessorKey,
    header: col.sortable !== false ? createSortableHeader(col.header) : col.header,
    size: typeof col.width === 'number' ? col.width : undefined,
  })) || []

  // Prepare props for DataTable (following chart pattern)
  const tableProps = {
    data: tableConfig.data || simulatedData,
    columns: configColumns.length > 0 ? configColumns : defaultColumns,
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
    <div 
      className="h-full w-full"
      style={{
        backgroundColor: hexToRgba(containerConfig.backgroundColor || '#ffffff', containerConfig.backgroundOpacity ?? 1),
        borderColor: hexToRgba(containerConfig.borderColor || '#e5e7eb', containerConfig.borderOpacity ?? 1),
        borderWidth: `${containerConfig.borderWidth || 1}px`,
        borderRadius: `${containerConfig.borderRadius || 8}px`,
        borderStyle: 'solid'
      }}
    >
      <DataTable {...tableProps} />
    </div>
  )
}