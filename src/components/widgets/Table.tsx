"use client"

import * as React from "react"
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
} from "@tanstack/react-table"
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2, Copy, X, Check } from "lucide-react"

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
  searchPlaceholder?: string
  showColumnToggle?: boolean
  showPagination?: boolean
  pageSize?: number
  // Styling props
  headerBackground?: string
  headerTextColor?: string
  rowHoverColor?: string
  borderColor?: string
  borderWidth?: number
  fontSize?: number
  padding?: number
  // Header typography props
  headerFontSize?: number
  headerFontFamily?: string
  headerFontWeight?: string
  headerLetterSpacing?: number
  // Cell typography props
  cellFontSize?: number
  cellFontFamily?: string
  cellFontWeight?: string
  cellTextColor?: string
  cellLetterSpacing?: number
  // Zebra rows
  enableZebraStripes?: boolean
  rowAlternateBgColor?: string
  // Selection column
  selectionColumnWidth?: number
  // Search & filtering props
  enableSearch?: boolean
  enableFiltering?: boolean
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
}

export function DataTable<TData extends TableData>({
  columns,
  data,
  searchPlaceholder = "Filtrar...",
  showColumnToggle = true,
  showPagination = true,
  pageSize = 10,
  // Styling props with defaults
  headerBackground = '#f9fafb',
  headerTextColor = '#374151',
  rowHoverColor = '#f3f4f6',
  borderColor = '#e5e7eb',
  borderWidth = 1,
  fontSize = 14,
  padding = 12,
  // Header typography props with defaults
  headerFontSize = 14,
  headerFontFamily = 'inherit',
  headerFontWeight = 'normal',
  headerLetterSpacing,
  // Cell typography props with defaults
  cellFontSize = 14,
  cellFontFamily = 'inherit',
  cellFontWeight = 'normal',
  cellTextColor = '#1f2937',
  cellLetterSpacing,
  enableZebraStripes = false,
  rowAlternateBgColor = '#fafafa',
  selectionColumnWidth = 48,
  // Search & filtering props with defaults
  enableSearch = true,
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
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSortColumn ? [{ id: defaultSortColumn, desc: defaultSortDirection === 'desc' }] : []
  )
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnSizing, setColumnSizing] = React.useState({})
  
  // Editing state
  const [editingCell, setEditingCell] = React.useState<{ rowIndex: number; columnKey: string } | null>(null)
  const [editingValue, setEditingValue] = React.useState<string>('')
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})
  const [modifiedCells, setModifiedCells] = React.useState<Set<string>>(new Set())
  const [tableData, setTableData] = React.useState<TData[]>(data)
  const [newRows, setNewRows] = React.useState<Set<number>>(new Set())
  
  // Update table data when external data changes
  React.useEffect(() => {
    setTableData(data)
  }, [data])

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

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
      sorting: defaultSortColumn ? [{ id: defaultSortColumn, desc: defaultSortDirection === 'desc' }] : [],
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    enableRowSelection: enableRowSelection,
    enableMultiRowSelection: selectionMode === 'multiple',
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing,
    },
  })

  const globalFilter = table.getState().globalFilter
  
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

  return (
    <div className="w-full h-full" style={{ minWidth: 0 }}>
      <div className="w-full h-full flex flex-col">

        {/* Table Content - flex-1 overflow-auto */}
        <div className="flex-1 overflow-auto">
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
                    backgroundColor: headerBackground,
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
                          padding: header.column.id === 'select' ? '4px' : `${padding}px`,
                          width: header.getSize(),
                          position: 'relative',
                          fontSize: `${headerFontSize}px`,
                          fontFamily: headerFontFamily !== 'inherit' ? headerFontFamily : undefined,
                          fontWeight: headerFontWeight !== 'normal' ? headerFontWeight : undefined,
                          borderColor,
                          letterSpacing: typeof headerLetterSpacing === 'number' ? `${headerLetterSpacing}px` : undefined,
                          textAlign: header.column.id === 'select' ? 'center' as const : undefined,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        
                        {/* Column Resizer */}
                        {header.column.getCanResize() && (
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
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
                      if (!newRows.has(row.index)) {
                        e.currentTarget.style.backgroundColor = rowHoverColor
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!newRows.has(row.index)) {
                        const base = enableZebraStripes ? (row.index % 2 === 0 ? rowAlternateBgColor : '') : ''
                        e.currentTarget.style.backgroundColor = base
                      }
                    }}
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
                            padding: columnKey === 'select' ? '4px' : `${padding}px`,
                            borderColor,
                            fontSize: `${cellFontSize || fontSize}px`,
                            fontFamily: cellFontFamily !== 'inherit' ? cellFontFamily : undefined,
                            fontWeight: cellFontWeight !== 'normal' ? cellFontWeight : undefined,
                            color: cellTextColor,
                            backgroundColor,
                            position: 'relative',
                            letterSpacing: typeof cellLetterSpacing === 'number' ? `${cellLetterSpacing}px` : undefined,
                            textAlign: columnKey === 'select' ? 'center' as const : undefined,
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
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={tableColumns.length} 
                    className="h-24 text-center"
                    style={{ 
                      padding: `${padding}px`,
                      borderColor,
                      fontSize: `${cellFontSize || fontSize}px`,
                      fontFamily: cellFontFamily !== 'inherit' ? cellFontFamily : undefined,
                      fontWeight: cellFontWeight !== 'normal' ? cellFontWeight : undefined,
                      color: cellTextColor,
                    }}
                  >
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
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
