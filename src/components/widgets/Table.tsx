"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  type PaginationState,
  type Updater,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, MoreHorizontal, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Generic data type for table rows
export type TableData = {
  [key: string]: string | number | boolean | null | undefined;
}

interface DataTableProps<TData extends TableData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  // Row expansion (optional)
  enableExpand?: boolean
  renderDetail?: (row: TData) => React.ReactNode
  rowCanExpand?: (row: TData) => boolean
  searchPlaceholder?: string
  showColumnToggle?: boolean
  showPagination?: boolean
  pageSize?: number
  maxHeight?: number | string
  // Server-side pagination support
  serverSidePagination?: boolean
  serverTotalRows?: number
  pageIndex?: number
  // Styling props
  headerBackground?: string
  headerTextColor?: string
  rowHoverColor?: string
  borderColor?: string
  borderWidth?: number
  showTopBorder?: boolean
  stickyHeader?: boolean
  rowHover?: boolean
  bordered?: boolean
  rounded?: boolean
  density?: 'compact' | 'comfortable' | 'spacious'
  emptyMessage?: string
  fontSize?: number
  padding?: number
  // Header padding (if different from cell padding)
  headerPadding?: number
  // Header typography props
  headerFontSize?: number
  headerFontFamily?: string
  headerFontWeight?: string
  headerLetterSpacing?: number
  headerTextAlign?: 'left' | 'center' | 'right'
  // Per-column options
  columnOptions?: Record<string, {
    headerNoWrap?: boolean
    cellNoWrap?: boolean
    widthMode?: 'auto' | 'fixed'
    fixedWidth?: number
    minWidth?: number
    maxWidth?: number
  }>
  // Cell typography props
  cellFontSize?: number
  cellFontFamily?: string
  cellFontWeight?: string
  cellTextColor?: string
  cellLetterSpacing?: number
  cellTextAlign?: 'left' | 'center' | 'right'
  // Zebra rows
  enableZebraStripes?: boolean
  rowAlternateBgColor?: string
  // Selection column
  selectionColumnWidth?: number
  // Search & filtering props
  enableSearch?: boolean
  enableFiltering?: boolean
  enableSorting?: boolean
  enableColumnResize?: boolean
  enableExportCsv?: boolean
  // Row selection props
  enableRowSelection?: boolean
  selectionMode?: 'single' | 'multiple'
  // Sorting props
  defaultSortColumn?: string
  defaultSortDirection?: 'asc' | 'desc'
  // Editing props
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
  // Callbacks
  onCellEdit?: (rowIndex: number, columnKey: string, newValue: string | number | boolean | null | undefined) => void
  onRowAdd?: (newRow: Record<string, string | number | boolean | null | undefined>) => void
  onRowDelete?: (rowIndex: number) => void
  onRowDuplicate?: (rowIndex: number) => void
  onDataChange?: (data: TData[]) => void
  onRowClick?: (row: TData) => void
  // Expose table API for external toolbars
  onTableReady?: (api: {
    previousPage: () => void
    nextPage: () => void
    gotoPage: (n: number) => void
    getPageIndex: () => number
    getPageCount: () => number
    getPageSize: () => number
    getTotalRows: () => number
    setGlobalFilter?: (value: string) => void
  }) => void
  onPaginationChange?: (info: { pageIndex: number; pageSize: number; totalRows: number; pageCount: number }) => void
}

function resolveDensityPadding(density: 'compact' | 'comfortable' | 'spacious', fallback: number): number {
  if (fallback !== 12) return fallback;
  if (density === 'compact') return 8;
  if (density === 'spacious') return 16;
  return fallback;
}

function escapeCsvValue(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (!/[",\n]/.test(str)) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

export function DataTable<TData extends TableData>({
  columns,
  data,
  enableExpand = false,
  renderDetail,
  rowCanExpand,
  searchPlaceholder = "Filtrar...",
  showColumnToggle = true,
  showPagination = true,
  pageSize = 10,
  maxHeight,
  serverSidePagination = false,
  serverTotalRows,
  pageIndex: controlledPageIndex,
  // Styling props with defaults
  headerBackground = '#f9fafb',
  headerTextColor = '#374151',
  rowHoverColor = '#f3f4f6',
  borderColor = '#e5e7eb',
  borderWidth = 1,
  showTopBorder = false,
  stickyHeader = false,
  rowHover = true,
  bordered = false,
  rounded = false,
  density = 'comfortable',
  emptyMessage = 'Nenhum resultado encontrado.',
  fontSize = 14,
  padding = 12,
  headerPadding,
  // Header typography props with defaults
  headerFontSize = 14,
  headerFontFamily = 'inherit',
  headerFontWeight = 'normal',
  headerLetterSpacing,
  headerTextAlign = 'left',
  columnOptions,
  // Cell typography props with defaults
  cellFontSize = 14,
  cellFontFamily = 'inherit',
  cellFontWeight = 'normal',
  cellTextColor = '#1f2937',
  cellLetterSpacing,
  cellTextAlign = 'left',
  enableZebraStripes = false,
  rowAlternateBgColor = '#fafafa',
  selectionColumnWidth = 48,
  // Search & filtering props with defaults
  enableSearch = true,
  enableSorting = true,
  enableColumnResize = true,
  enableExportCsv = false,
  // Row selection props with defaults
  enableRowSelection = false,
  selectionMode = 'single',
  // Sorting props with defaults
  defaultSortColumn,
  defaultSortDirection = 'asc',
  // Editing props with defaults
  editableMode = false,
  editableCells = 'none',
  editableRowActions = { allowAdd: false, allowDelete: false, allowDuplicate: false },
  validationRules = {},
  enableValidation = false,
  showValidationErrors = false,
  saveBehavior = 'onBlur',
  editTrigger = 'doubleClick',
  editingCellColor = '#fef3c7',
  validationErrorColor = '#fef2f2',
  modifiedCellColor = '#f0f9ff',
  newRowColor = '#f0fdf4',
  // Callbacks
  onCellEdit,
  onRowAdd,
  onRowDelete,
  onRowDuplicate,
  onDataChange,
  onRowClick,
  onTableReady,
  onPaginationChange: onExternalPaginationChange,
}: DataTableProps<TData>) {
  const pathname = usePathname()
  const isErpRoute = pathname?.startsWith('/erp')
  const resolvedPadding = resolveDensityPadding(density, padding)
  const resolvedHeaderPadding = resolveDensityPadding(density, headerPadding ?? padding)
  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSortColumn ? [{ id: defaultSortColumn, desc: defaultSortDirection === 'desc' }] : []
  )
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnSizing, setColumnSizing] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  
  // Editing state
  const [editingCell, setEditingCell] = React.useState<{ rowIndex: number; columnKey: string } | null>(null)
  const [editingValue, setEditingValue] = React.useState<string>('')
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})
  const [modifiedCells, setModifiedCells] = React.useState<Set<string>>(new Set())
  const [tableData, setTableData] = React.useState<TData[]>(data)
  const [newRows, setNewRows] = React.useState<Set<number>>(new Set())
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const baseHeaderPadding = resolvedHeaderPadding
  const effectiveHeaderBackground = isErpRoute ? 'rgb(252, 252, 252)' : headerBackground
  const effectiveHeaderPaddingY = isErpRoute ? Math.min(baseHeaderPadding, 6) : baseHeaderPadding
  const effectiveHeaderPaddingX = baseHeaderPadding
  
  // Update table data when external data changes
  React.useEffect(() => {
    setTableData(data)
  }, [data])

  React.useEffect(() => {
    const nextVisibility = columns.reduce((acc, column) => {
      const id = String(column.id ?? (typeof (column as { accessorKey?: unknown }).accessorKey === "string"
        ? (column as { accessorKey?: string }).accessorKey
        : ""))
      if (!id) return acc
      const meta = (column.meta || {}) as { visible?: boolean }
      if (meta.visible === false) acc[id] = false
      return acc
    }, {} as VisibilityState)
    setColumnVisibility((prev) => ({ ...nextVisibility, ...prev }))
  }, [columns])

  // Helper functions for editing
  const isCellEditable = (columnKey: string): boolean => {
    if (!editableMode) return false
    if (editableCells === 'all') return true
    if (editableCells === 'none') return false
    return Array.isArray(editableCells) && editableCells.includes(columnKey)
  }
  
  const validateCell = (columnKey: string, value: string | number | boolean | null | undefined): string | null => {
    if (!enableValidation || !validationRules[columnKey]) return null
    
    const rule = validationRules[columnKey]
    
    if (rule.required && (!value || value === '')) {
      return 'Este campo é obrigatório'
    }
    
    if (rule.type === 'number' && value && isNaN(Number(value))) {
      return 'Deve ser um número válido'
    }
    
    if (rule.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      return 'Deve ser um email válido'
    }
    
    if (rule.min !== undefined && value && String(value).length < rule.min) {
      return `Mínimo de ${rule.min} caracteres`
    }
    
    if (rule.max !== undefined && value && String(value).length > rule.max) {
      return `Máximo de ${rule.max} caracteres`
    }
    
    if (rule.pattern && value && !rule.pattern.test(String(value))) {
      return 'Formato inválido'
    }
    
    return null
  }
  
  const handleCellEdit = (rowIndex: number, columnKey: string, newValue: string | number | boolean | null | undefined) => {
    const newData = [...tableData]
    newData[rowIndex] = { ...newData[rowIndex], [columnKey]: newValue }
    setTableData(newData)
    
    // Mark cell as modified
    const cellId = `${rowIndex}-${columnKey}`
    setModifiedCells(prev => new Set([...prev, cellId]))
    
    // Validate
    if (enableValidation) {
      const error = validateCell(columnKey, newValue)
      setValidationErrors(prev => ({
        ...prev,
        [cellId]: error || ''
      }))
    }
    
    // Call callback
    onCellEdit?.(rowIndex, columnKey, newValue)
    onDataChange?.(newData)
  }
  
  const startEditing = (rowIndex: number, columnKey: string, currentValue: string | number | boolean | null | undefined) => {
    if (!isCellEditable(columnKey)) return
    
    setEditingCell({ rowIndex, columnKey })
    setEditingValue(String(currentValue || ''))
  }
  
  const saveEdit = () => {
    if (!editingCell) return
    
    const { rowIndex, columnKey } = editingCell
    handleCellEdit(rowIndex, columnKey, editingValue)
    setEditingCell(null)
    setEditingValue('')
  }
  
  const cancelEdit = () => {
    setEditingCell(null)
    setEditingValue('')
  }
  
  const addNewRow = React.useCallback(() => {
    if (!editableRowActions?.allowAdd) return
    
    const newRow = columns.reduce((acc, col) => {
      if (col.id && col.id !== 'select' && col.id !== 'actions') {
        ;(acc as Record<string, string | number | boolean | null | undefined>)[col.id] = ''
      }
      return acc
    }, {} as TData)
    
    const newData = [...tableData, newRow]
    setTableData(newData)
    setNewRows(prev => new Set([...prev, newData.length - 1]))
    
    onRowAdd?.(newRow as Record<string, string | number | boolean | null | undefined>)
    onDataChange?.(newData)
  }, [editableRowActions?.allowAdd, columns, tableData, onRowAdd, onDataChange])
  
  const deleteRow = React.useCallback((rowIndex: number) => {
    if (!editableRowActions?.allowDelete) return
    
    const newData = tableData.filter((_, index) => index !== rowIndex)
    setTableData(newData)
    
    // Clean up tracking sets
    setNewRows(prev => {
      const newSet = new Set<number>()
      Array.from(prev).forEach(index => {
        if (index < rowIndex) newSet.add(index)
        else if (index > rowIndex) newSet.add(index - 1)
      })
      return newSet
    })
    
    onRowDelete?.(rowIndex)
    onDataChange?.(newData)
  }, [editableRowActions?.allowDelete, tableData, onRowDelete, onDataChange])
  
  const duplicateRow = React.useCallback((rowIndex: number) => {
    if (!editableRowActions?.allowDuplicate) return
    
    const rowToDuplicate = { ...tableData[rowIndex] }
    const newData = [...tableData]
    newData.splice(rowIndex + 1, 0, rowToDuplicate)
    setTableData(newData)
    
    onRowDuplicate?.(rowIndex)
    onDataChange?.(newData)
  }, [editableRowActions?.allowDuplicate, tableData, onRowDuplicate, onDataChange])

  // Prepare columns with conditional selection column and actions
  const tableColumns = React.useMemo(() => {
    let cols = [...columns]
    
    if (enableExpand) {
      cols = [
        {
          id: 'expand',
          size: 32,
          header: '',
          enableHiding: false,
          cell: ({ row }) => {
            const isExpanded = expandedRows.has(row.id)
            const canExpand = rowCanExpand ? rowCanExpand(row.original as TData) : true
            if (!canExpand) return <span />
            return (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedRows(prev => {
                    const next = new Set(prev)
                    if (next.has(row.id)) next.delete(row.id)
                    else next.add(row.id)
                    return next
                  })
                }}
                title={isExpanded ? 'Recolher' : 'Expandir'}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            )
          },
        } as ColumnDef<TData>,
        ...cols,
      ]
    }

    if (enableRowSelection) {
      cols = [createSelectionColumn<TData>({ width: selectionColumnWidth }), ...cols]
    }
    
    if (editableMode && (editableRowActions?.allowDelete || editableRowActions?.allowDuplicate)) {
      cols = [...cols, createEditActionsColumn<TData>({
        allowDelete: editableRowActions.allowDelete,
        allowDuplicate: editableRowActions.allowDuplicate,
        onDelete: deleteRow,
        onDuplicate: duplicateRow
      })]
    }
    
    return cols
  }, [columns, enableRowSelection, editableMode, editableRowActions, deleteRow, duplicateRow])

  const isServer = !!serverSidePagination
  const controlledPagination = isServer
    ? { pageIndex: controlledPageIndex ?? 0, pageSize }
    : undefined

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
      sorting: defaultSortColumn ? [{ id: defaultSortColumn, desc: defaultSortDirection === 'desc' }] : [],
    },
    manualPagination: isServer,
    pageCount: isServer ? Math.max(1, Math.ceil(((serverTotalRows ?? tableData.length) || 0) / pageSize)) : undefined,
    enableSorting,
    enableColumnResizing: enableColumnResize,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    enableRowSelection: enableRowSelection,
    enableMultiRowSelection: selectionMode === 'multiple',
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServer ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      columnSizing,
      ...(controlledPagination ? { pagination: controlledPagination } : {}),
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const prev = table.getState().pagination
      const next = typeof updater === 'function' ? (updater as (old: PaginationState) => PaginationState)(prev) : updater
      const totalRowsSS = isServer ? (serverTotalRows ?? 0) : table.getFilteredRowModel().rows.length
      const pageCountSS = isServer
        ? Math.max(1, Math.ceil((totalRowsSS || 0) / next.pageSize))
        : table.getPageCount()
      onExternalPaginationChange?.({ pageIndex: next.pageIndex, pageSize: next.pageSize, totalRows: totalRowsSS, pageCount: pageCountSS })
    },
  })

  // (selection count callback removed to keep component simple)

  // Sync external pageSize changes with table
  React.useEffect(() => {
    if (table.getState().pagination.pageSize !== pageSize) {
      table.setPageSize(pageSize)
    }
  }, [pageSize])

  // Notify table API to parent
  React.useEffect(() => {
    if (onTableReady) {
      onTableReady({
        previousPage: () => table.previousPage(),
        nextPage: () => table.nextPage(),
        gotoPage: (n: number) => table.setPageIndex(n),
        getPageIndex: () => table.getState().pagination.pageIndex,
        getPageCount: () => table.getPageCount(),
        getPageSize: () => table.getState().pagination.pageSize,
        getTotalRows: () => table.getFilteredRowModel().rows.length,
        setGlobalFilter: (value: string) => table.setGlobalFilter(value),
      })
    }
  }, [onTableReady, table])

  // Emit pagination changes
  const pageIndex = table.getState().pagination.pageIndex
  const pageSizeState = table.getState().pagination.pageSize
  const totalRows = isServer ? (serverTotalRows ?? 0) : table.getFilteredRowModel().rows.length
  const pageCount = isServer
    ? Math.max(1, Math.ceil((totalRows || 0) / table.getState().pagination.pageSize))
    : table.getPageCount()
  React.useEffect(() => {
    onExternalPaginationChange?.({ pageIndex, pageSize: pageSizeState, totalRows, pageCount })
  }, [onExternalPaginationChange, pageIndex, pageSizeState, totalRows, pageCount])
  
  // Handle keyboard events for editing
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!editingCell) return
    
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }, [editingCell, editingValue])

  const canShowSearch = enableSearch
  const canShowColumnToggle = showColumnToggle
  const visibleLeafColumns = table.getVisibleLeafColumns()
  const hasFooter = table.getFooterGroups().some((group) =>
    group.headers.some((header) => header.column.columnDef.footer)
  )
  const exportCsv = React.useCallback(() => {
    const columnsToExport = visibleLeafColumns.filter((column) => column.id !== 'select' && column.id !== 'expand' && column.id !== 'edit-actions')
    const headerLine = columnsToExport.map((column) => {
      const header = column.columnDef.header
      if (typeof header === 'string') return escapeCsvValue(header)
      return escapeCsvValue(column.id)
    }).join(',')
    const bodyLines = table.getFilteredRowModel().rows.map((row) =>
      columnsToExport.map((column) => escapeCsvValue(row.getValue(column.id))).join(',')
    )
    const csv = [headerLine, ...bodyLines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'table-export.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }, [table, visibleLeafColumns])

  return (
    <div className="w-full h-full" style={{ minWidth: 0 }}>
      <div
        className="w-full h-full flex flex-col"
        style={{
          border: bordered ? `${borderWidth}px solid ${borderColor}` : undefined,
          borderRadius: rounded ? 12 : undefined,
          overflow: 'hidden',
        }}
      >
        {/* Table Content - flex-1 overflow-auto */}
        <div
          className="flex-1 overflow-auto"
          style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
        >
          <Table
            className=""
            style={{
              borderColor,
            }}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow 
                  key={headerGroup.id}
                  style={{ 
                    backgroundColor: effectiveHeaderBackground,
                    borderColor,
                    borderBottomWidth: borderWidth,
                  }}
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        style={{ 
                          color: headerTextColor,
                          padding: header.column.id === 'select' ? '4px' : `${effectiveHeaderPaddingY}px ${effectiveHeaderPaddingX}px`,
                          width: (columnOptions && columnOptions[header.column.id]?.widthMode === 'auto')
                            ? undefined
                            : (columnOptions && columnOptions[header.column.id]?.widthMode === 'fixed' && typeof columnOptions[header.column.id]?.fixedWidth === 'number')
                              ? columnOptions[header.column.id]!.fixedWidth
                              : header.getSize(),
                          minWidth: columnOptions?.[header.column.id]?.minWidth,
                          maxWidth: columnOptions?.[header.column.id]?.maxWidth,
                          position: stickyHeader ? 'sticky' : 'relative',
                          top: stickyHeader ? 0 : undefined,
                          zIndex: stickyHeader ? 2 : undefined,
                          fontSize: `${headerFontSize}px`,
                          fontFamily: headerFontFamily !== 'inherit' ? headerFontFamily : undefined,
                          fontWeight: headerFontWeight !== 'normal' ? headerFontWeight : undefined,
                          borderColor,
                          borderTopWidth: showTopBorder ? borderWidth : undefined,
                          letterSpacing: typeof headerLetterSpacing === 'number' ? `${headerLetterSpacing}px` : undefined,
                          textAlign: header.column.id === 'select'
                            ? 'center' as const
                            : ((header.column.columnDef.meta || {}) as { headerAlign?: 'left' | 'center' | 'right' }).headerAlign || headerTextAlign,
                          whiteSpace: columnOptions?.[header.column.id]?.headerNoWrap ? 'nowrap' : undefined,
                          overflow: columnOptions?.[header.column.id]?.headerNoWrap ? 'hidden' : undefined,
                          textOverflow: columnOptions?.[header.column.id]?.headerNoWrap ? 'ellipsis' : undefined,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              enableSorting && header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={enableSorting ? header.column.getToggleSortingHandler() : undefined}
                            title={((header.column.columnDef.meta || {}) as { headerTooltip?: string }).headerTooltip}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {enableSorting && header.column.getCanSort() && (
                              header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                              )
                            )}
                          </div>
                        )}
                        
                        {/* Column Resizer */}
                        {enableColumnResize && header.column.getCanResize() && (
                          <div
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              header.column.resetSize()
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              header.getResizeHandler()(e)
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation()
                              header.getResizeHandler()(e)
                            }}
                            className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`}
                            data-draggable="false"
                          />
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      rowHover ? "transition-colors" : "hover:bg-transparent",
                      newRows.has(row.index) && "bg-green-50"
                    )}
                    style={{ 
                      '--hover-color': rowHoverColor,
                      backgroundColor: enableZebraStripes && !newRows.has(row.index)
                        ? (row.index % 2 === 0 ? rowAlternateBgColor : undefined)
                        : undefined,
                      borderColor,
                      borderBottomWidth: borderWidth,
                    } as React.CSSProperties & { '--hover-color': string }}
                    onMouseEnter={(e) => {
                      if (rowHover && !newRows.has(row.index)) {
                        e.currentTarget.style.backgroundColor = rowHoverColor
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (rowHover && !newRows.has(row.index)) {
                        const base = enableZebraStripes ? (row.index % 2 === 0 ? rowAlternateBgColor : '') : ''
                        e.currentTarget.style.backgroundColor = base
                      }
                    }}
                    onClick={() => onRowClick?.(row.original as TData)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const rowIndex = row.index
                      const columnKey = cell.column.id
                      const cellId = `${rowIndex}-${columnKey}`
                      const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === columnKey
                      const isModified = modifiedCells.has(cellId)
                      const hasError = enableValidation && validationErrors[cellId]
                      const isNewRow = newRows.has(rowIndex)
                      
                      let backgroundColor = ''
                      if (isEditing) backgroundColor = editingCellColor
                      else if (hasError) backgroundColor = validationErrorColor
                      else if (isModified) backgroundColor = modifiedCellColor
                      else if (isNewRow) backgroundColor = newRowColor
                      
                      return (
                        <TableCell 
                          key={cell.id}
                          className={cn(
                            isCellEditable(columnKey) && "cursor-pointer hover:bg-gray-50",
                            hasError && showValidationErrors && "border-red-300"
                          )}
                          style={{ 
                            padding: columnKey === 'select' || columnKey === 'expand' ? '4px' : `${resolvedPadding}px`,
                            borderColor,
                            borderTopWidth: showTopBorder ? borderWidth : undefined,
                            fontSize: `${cellFontSize || fontSize}px`,
                            fontFamily: cellFontFamily !== 'inherit' ? cellFontFamily : undefined,
                            fontWeight: cellFontWeight !== 'normal' ? cellFontWeight : undefined,
                            color: cellTextColor,
                            backgroundColor,
                            position: 'relative',
                            letterSpacing: typeof cellLetterSpacing === 'number' ? `${cellLetterSpacing}px` : undefined,
                            textAlign: columnKey === 'select'
                              ? 'center' as const
                              : ((cell.column.columnDef.meta || {}) as { align?: 'left' | 'center' | 'right' }).align || cellTextAlign,
                            width: (columnOptions && columnOptions[columnKey]?.widthMode === 'auto')
                              ? undefined
                              : (columnOptions && columnOptions[columnKey]?.widthMode === 'fixed' && typeof columnOptions[columnKey]?.fixedWidth === 'number')
                                ? columnOptions[columnKey]!.fixedWidth
                                : undefined,
                            minWidth: columnOptions?.[columnKey]?.minWidth,
                            maxWidth: columnOptions?.[columnKey]?.maxWidth,
                            whiteSpace: columnOptions?.[columnKey]?.cellNoWrap ? 'nowrap' : undefined,
                            overflow: columnOptions?.[columnKey]?.cellNoWrap ? 'hidden' : undefined,
                            textOverflow: columnOptions?.[columnKey]?.cellNoWrap ? 'ellipsis' : undefined,
                          }}
                          onClick={(e) => {
                            if (editTrigger === 'click' && !isEditing) {
                              startEditing(rowIndex, columnKey, cell.getValue() as string | number | boolean | null | undefined)
                            }
                          }}
                          onDoubleClick={(e) => {
                            if (editTrigger === 'doubleClick' && !isEditing) {
                              startEditing(rowIndex, columnKey, cell.getValue() as string | number | boolean | null | undefined)
                            }
                          }}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={() => {
                                  if (saveBehavior === 'onBlur') {
                                    saveEdit()
                                  }
                                }}
                                className="h-6 text-xs border-0 p-0 focus:ring-0"
                                autoFocus
                              />
                              {saveBehavior === 'manual' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={saveEdit}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              {hasError && showValidationErrors && (
                                <div className="absolute -bottom-1 left-0 text-xs text-red-600 bg-white px-1 rounded shadow">
                                  {validationErrors[cellId]}
                                </div>
                              )}
                            </>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  {enableExpand && renderDetail && expandedRows.has(row.id) && (!rowCanExpand || rowCanExpand(row.original as TData)) && (
                    <TableRow>
                      <TableCell colSpan={tableColumns.length} style={{ padding: `${resolvedPadding}px` }}>
                        {renderDetail(row.original as TData)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={tableColumns.length} 
                    className="h-24 text-center"
                    style={{ 
                      padding: `${resolvedPadding}px`,
                      borderColor,
                      fontSize: `${cellFontSize || fontSize}px`,
                      fontFamily: cellFontFamily !== 'inherit' ? cellFontFamily : undefined,
                      fontWeight: cellFontWeight !== 'normal' ? cellFontWeight : undefined,
                      color: cellTextColor,
                    }}
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {hasFooter && (
              <TableFooter>
                {table.getFooterGroups().map((footerGroup) => (
                  <TableRow key={footerGroup.id} style={{ borderColor, borderBottomWidth: borderWidth }}>
                    {footerGroup.headers.map((header) => (
                      <TableCell
                        key={header.id}
                        style={{
                          padding: `${resolvedPadding}px`,
                          borderColor,
                          fontSize: `${cellFontSize || fontSize}px`,
                          fontFamily: cellFontFamily !== 'inherit' ? cellFontFamily : undefined,
                          fontWeight: '600',
                          color: cellTextColor,
                          textAlign: ((header.column.columnDef.meta || {}) as { align?: 'left' | 'center' | 'right' }).align || cellTextAlign,
                        }}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableFooter>
            )}
          </Table>
        </div>

        {/* Pagination - flex-shrink-0 */}
        {showPagination && (
          <div className="flex-shrink-0 flex items-center justify-between py-4 px-2">
            {/* Page Info - Left */}
            <div className="text-sm text-gray-600">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </div>

            {/* Rows per page - Center */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Rows per page</span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Navigation Arrows - Right */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// Helper function to create selection column
export function createSelectionColumn<TData>(options?: { width?: number }): ColumnDef<TData> {
  const width = options?.width ?? 48
  return {
    id: "select",
    size: width,
    minSize: width,
    maxSize: width,
    enableResizing: false,
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

// Helper function to create actions column
export function createActionsColumn<TData>(
  actions: Array<{
    label: string
    onClick: (row: TData) => void
  }>
): ColumnDef<TData> {
  return {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {actions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => action.onClick(row.original)}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
}

// Helper function to create edit actions column
export function createEditActionsColumn<TData>(options: {
  allowDelete?: boolean
  allowDuplicate?: boolean
  onDelete: (rowIndex: number) => void
  onDuplicate: (rowIndex: number) => void
}): ColumnDef<TData> {
  return {
    id: "edit-actions",
    header: "Ações",
    enableHiding: false,
    size: 80,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1">
          {options.allowDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => options.onDuplicate(row.index)}
              title="Duplicar linha"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          {options.allowDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              onClick={() => options.onDelete(row.index)}
              title="Excluir linha"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )
    },
  }
}

export default DataTable

// Helper function to create editable cell
export function createEditableCell<TData>(
  accessorKey: string,
  options?: {
    type?: 'text' | 'number' | 'email' | 'date'
    formatter?: (value: string | number | boolean | null | undefined) => string
  }
): ColumnDef<TData> {
  return {
    accessorKey,
    cell: ({ getValue }) => {
      const value = getValue() as string | number | boolean | null | undefined
      if (options?.formatter) {
        return options.formatter(value)
      }
      return String(value || '')
    },
  }
}
