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
import { 
  ArrowUpDown, 
  ChevronDown, 
  Download, 
  Trash2, 
  Calculator, 
  Search,
  Edit3
} from "lucide-react"

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
import { Input } from "@/components/ui/input"
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

interface TableSheetsProps<TData extends TableData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  searchPlaceholder?: string
  showColumnToggle?: boolean
  showPagination?: boolean
  showRowNumbers?: boolean
  showStats?: boolean
  showToolbar?: boolean
  editable?: boolean
  compactMode?: boolean
  pageSize?: number
  onCellEdit?: (rowIndex: number, field: string, value: unknown) => void
  onRowDelete?: (rowIndexes: number[]) => void
  onExport?: (format: 'csv' | 'excel') => void
}

export function TableSheets<TData extends TableData>({
  columns,
  data,
  searchPlaceholder = "Filtrar dados...",
  showColumnToggle = true,
  showPagination = true,
  showRowNumbers = true,
  showStats = true,
  showToolbar = true,
  editable = false,
  compactMode = true,
  pageSize = 50,
  onCellEdit,
  onRowDelete,
  onExport,
}: TableSheetsProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [editingCell, setEditingCell] = React.useState<{ rowIndex: number; field: string } | null>(null)

  // Add row numbers column if enabled
  const enhancedColumns = React.useMemo(() => {
    const cols: ColumnDef<TData>[] = []
    
    // Selection column
    cols.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    })

    // Row numbers column
    if (showRowNumbers) {
      cols.push({
        id: "rowNumber",
        header: "#",
        cell: ({ row }) => (
          <div className="text-center text-xs text-gray-500 font-mono">
            {row.index + 1}
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      })
    }

    // Add original columns with edit functionality
    const editableColumns = columns.map((col) => ({
      ...col,
      cell: editable ? ({ row, column }: { row: any; column: any }) => {
        const value = row.getValue(column.id)
        const isEditing = editingCell?.rowIndex === row.index && editingCell?.field === column.id
        
        if (isEditing) {
          return (
            <Input
              defaultValue={String(value || '')}
              className="h-8 border-none p-1"
              onBlur={(e) => {
                onCellEdit?.(row.index, column.id, e.target.value)
                setEditingCell(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onCellEdit?.(row.index, column.id, e.currentTarget.value)
                  setEditingCell(null)
                }
                if (e.key === 'Escape') {
                  setEditingCell(null)
                }
              }}
              autoFocus
            />
          )
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 p-1 rounded"
            onDoubleClick={() => setEditingCell({ rowIndex: row.index, field: column.id })}
          >
            {value}
          </div>
        )
      } : col.cell,
    }))

    return [...cols, ...editableColumns]
  }, [columns, showRowNumbers, editable, editingCell, onCellEdit])

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Calculate stats
  const selectedRows = table.getFilteredSelectedRowModel().rows.length
  const totalRows = table.getFilteredRowModel().rows.length
  const totalColumns = columns.length

  // Export functions
  const handleExport = (format: 'csv' | 'excel') => {
    if (onExport) {
      onExport(format)
    } else {
      // Default CSV export
      const headers = columns.map(col => col.id || '').join(',')
      const rows = data.map(row => 
        columns.map(col => {
          const accessorKey = (col as any).accessorKey || col.id
          const value = row[accessorKey as keyof TData]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : String(value || '')
        }).join(',')
      ).join('\n')
      
      const csvContent = [headers, rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'data.csv'
      link.click()
    }
  }

  const handleDeleteSelected = () => {
    const selectedIndexes = table.getSelectedRowModel().rows.map(row => row.index)
    if (onRowDelete && selectedIndexes.length > 0) {
      onRowDelete(selectedIndexes)
      setRowSelection({})
    }
  }

  const globalFilter = table.getState().globalFilter

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between py-2 px-1 border-b border-gray-200 bg-gray-50">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                className="pl-8 w-64"
              />
            </div>
            
            {/* Stats */}
            {showStats && (
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Calculator className="h-3 w-3" />
                  {totalRows.toLocaleString()} linhas × {totalColumns} colunas
                </span>
                {selectedRows > 0 && (
                  <span className="text-blue-600 font-medium">
                    {selectedRows} selecionada(s)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Delete selected */}
            {selectedRows > 0 && onRowDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir ({selectedRows})
              </Button>
            )}

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Formato</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Column toggle */}
            {showColumnToggle && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Colunas <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto border border-gray-200">
        <Table className={compactMode ? "text-sm" : ""}>
          <TableHeader className="sticky top-0 bg-white z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-2 border-gray-200">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      className="bg-gray-50 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                  className={`
                    hover:bg-gray-50 border-b border-gray-100
                    ${compactMode ? 'h-8' : 'h-10'}
                    ${row.getIsSelected() ? 'bg-blue-50' : ''}
                  `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className="border-r border-gray-100 last:border-r-0 p-1"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Edit3 className="h-8 w-8" />
                    <span>Nenhum dado encontrado</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between space-x-2 py-2 px-1 border-t border-gray-200 bg-gray-50">
          <div className="flex-1 text-xs text-gray-600">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()} • {totalRows.toLocaleString()} registros
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to create sortable header for sheets
export function createSortableHeader(title: string) {
  const SortableHeader = ({ column }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 p-1 text-xs font-semibold"
      >
        {title}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    )
  }
  
  SortableHeader.displayName = `SortableHeader-${title}`
  return SortableHeader
}

export default TableSheets