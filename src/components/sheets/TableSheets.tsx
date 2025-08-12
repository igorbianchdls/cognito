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
  editable?: boolean
  pageSize?: number
  onCellEdit?: (rowIndex: number, field: string, value: unknown) => void
  filters?: { column: string; operator: string; value: string }[]
  sorting?: { column: string; direction: 'asc' | 'desc' }[]
}

export function TableSheets<TData extends TableData>({
  columns,
  data,
  editable = false,
  pageSize = 50,
  onCellEdit,
  filters = [],
  sorting = [],
}: TableSheetsProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [editingCell, setEditingCell] = React.useState<{ rowIndex: number; field: string } | null>(null)

  // Enhanced columns with row numbers (Baserow style)
  const enhancedColumns = React.useMemo(() => {
    const cols: ColumnDef<TData>[] = []
    
    // Row numbers column (always show in Baserow style)
    cols.push({
      id: "rowNumber",
      header: () => <div className="w-full text-center text-xs font-medium text-gray-500">#</div>,
      cell: ({ row }) => (
        <div className="w-full text-center text-xs text-gray-400 font-mono py-2">
          {row.index + 1}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    })

    // Add original columns with minimal edit functionality
    const editableColumns = columns.map((col) => ({
      ...col,
      cell: editable ? ({ row, column }: { row: { index: number; getValue: (id: string) => unknown }; column: { id: string } }) => {
        const value = row.getValue(column.id)
        const isEditing = editingCell?.rowIndex === row.index && editingCell?.field === column.id
        
        if (isEditing) {
          return (
            <Input
              defaultValue={String(value || '')}
              className="h-full border-none bg-white shadow-none p-2 text-sm"
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
            className="w-full h-full p-2 text-sm cursor-cell hover:bg-blue-50"
            onDoubleClick={() => setEditingCell({ rowIndex: row.index, field: column.id })}
          >
            {String(value || '')}
          </div>
        )
      } : col.cell,
    }))

    return [...cols, ...editableColumns]
  }, [columns, editable, editingCell, onCellEdit])

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
    onSortingChange: setInternalSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: internalSorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Calculate stats for footer
  const totalRows = table.getFilteredRowModel().rows.length

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Ultra-clean table (Baserow style) */}
      <div className="flex-1 overflow-auto">
        <Table className="border-collapse">
          <TableHeader className="sticky top-0 bg-gray-50 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-0">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      className="bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-200 last:border-r-0 px-3 py-3 h-10"
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
                  className="hover:bg-gray-50 border-0 h-10 group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className="border-r border-gray-200 last:border-r-0 border-b border-gray-200 px-0 py-0 text-sm"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={enhancedColumns.length} className="h-32 text-center border-r border-gray-200 border-b border-gray-200">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Edit3 className="h-6 w-6" />
                    </div>
                    <span className="text-sm">No data available</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Baserow-style footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>{totalRows} rows</span>
          <button className="text-gray-500 hover:text-gray-700">Summarize</button>
          <button className="text-gray-500 hover:text-gray-700">Row height</button>
        </div>
        <div className="flex items-center gap-2">
          <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-6 w-6 p-0"
          >
            ‹
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-6 w-6 p-0"
          >
            ›
          </Button>
        </div>
      </div>
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