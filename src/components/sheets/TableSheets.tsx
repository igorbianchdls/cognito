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
  Edit3,
  Type,
  Hash,
  Calendar,
  CheckCircle,
  DollarSign,
  Mail,
  Tag,
  Link
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

// Field type detection
type FieldType = 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'email' | 'url' | 'category'

// Get field type icon
const getFieldTypeIcon = (fieldType: FieldType, className = "h-3 w-3") => {
  switch (fieldType) {
    case 'text': return <Type className={className} />
    case 'number': return <Hash className={className} />
    case 'currency': return <DollarSign className={className} />
    case 'date': return <Calendar className={className} />
    case 'boolean': return <CheckCircle className={className} />
    case 'email': return <Mail className={className} />
    case 'url': return <Link className={className} />
    case 'category': return <Tag className={className} />
    default: return <Type className={className} />
  }
}

// Detect field type from data
const detectFieldType = <TData extends TableData>(data: TData[], field: string): FieldType => {
  if (!data.length) return 'text'
  
  const sampleValues = data.slice(0, 10).map(row => row[field]).filter(v => v != null && v !== '')
  if (sampleValues.length === 0) return 'text'
  
  // Email detection
  if (sampleValues.some(v => String(v).includes('@') && String(v).includes('.'))) return 'email'
  
  // URL detection
  if (sampleValues.some(v => String(v).startsWith('http'))) return 'url'
  
  // Boolean detection
  if (sampleValues.every(v => 
    v === true || v === false || v === 'true' || v === 'false' ||
    v === 'sim' || v === 'não' || v === '✓' || v === '✗'
  )) return 'boolean'
  
  // Currency detection
  if (sampleValues.some(v => {
    const str = String(v)
    return str.includes('R$') || str.includes('$') || /^\d+[,.]?\d{0,2}$/.test(str.replace(/[,\.]/g, ''))
  })) return 'currency'
  
  // Date detection
  if (sampleValues.some(v => {
    const date = new Date(String(v))
    return !isNaN(date.getTime()) && String(v).match(/\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/)
  })) return 'date'
  
  // Number detection
  if (sampleValues.every(v => !isNaN(Number(v)))) return 'number'
  
  // Category detection (repeated values)
  const uniqueValues = [...new Set(sampleValues)]
  if (uniqueValues.length <= Math.max(3, sampleValues.length * 0.3)) return 'category'
  
  return 'text'
}

// Format category values with colors
const getCategoryColor = (value: string): string => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800', 
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800'
  ]
  const hash = value.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return colors[hash % colors.length]
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
        <div className="w-full text-center text-xs text-gray-400 font-mono py-3">
          {row.index + 1}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    })

    // Add original columns with enhanced functionality
    const editableColumns = columns.map((col, index) => {
      // Safe way to get field identifier - use multiple methods
      const fieldId = (col as unknown as { accessorKey?: string; id?: string }).accessorKey || 
                     (col as unknown as { accessorKey?: string; id?: string }).id || 
                     `column-${index}`
      const fieldType = detectFieldType(data, fieldId)
      
      return {
        ...col,
        header: ({ column }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => {
          const headerText = typeof col.header === 'string' ? col.header : 
                            typeof col.header === 'function' ? 'Column' : 
                            fieldId || 'Column'
          
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2 text-left font-medium text-gray-700 hover:bg-gray-100 justify-start w-full"
            >
              <div className="flex items-center gap-2">
                {getFieldTypeIcon(fieldType, "h-4 w-4 text-gray-500")}
                <span className="text-sm">{headerText}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </div>
            </Button>
          )
        },
        cell: editable ? ({ row, column }: { row: { index: number; getValue: (id: string) => unknown }; column: { id: string } }) => {
        const value = row.getValue(column.id)
        const isEditing = editingCell?.rowIndex === row.index && editingCell?.field === column.id
        
          if (isEditing) {
            return (
              <Input
                defaultValue={String(value || '')}
                className="h-full border-none bg-white shadow-none p-3 text-sm"
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
          
          // Format cell content based on field type
          const formatCellValue = (val: unknown, type: FieldType): React.ReactNode => {
            if (val === null || val === undefined || val === '') return <span className="text-gray-400">—</span>
            
            switch (type) {
              case 'category':
                return (
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(String(val))}`}>
                    {String(val)}
                  </span>
                )
              case 'boolean':
                return (
                  <span className={`font-bold ${val ? 'text-green-600' : 'text-red-600'}`}>
                    {val ? '✓' : '✗'}
                  </span>
                )
              case 'currency':
                const num = Number(val)
                return isNaN(num) ? String(val) : 
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
              case 'date':
                const date = new Date(String(val))
                return isNaN(date.getTime()) ? String(val) : date.toLocaleDateString('pt-BR')
              case 'number':
                const numVal = Number(val)
                return isNaN(numVal) ? String(val) : numVal.toLocaleString('pt-BR')
              case 'email':
                return <a href={`mailto:${val}`} className="text-blue-600 hover:underline">{String(val)}</a>
              case 'url':
                return <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{String(val)}</a>
              default:
                return String(val)
            }
          }
          
          return (
            <div
              className="w-full h-full p-3 text-sm cursor-cell hover:bg-blue-50 flex items-center"
              onDoubleClick={() => setEditingCell({ rowIndex: row.index, field: column.id })}
            >
              {formatCellValue(value, fieldType)}
            </div>
          )
        } : ({ row, column }: { row: { getValue: (id: string) => unknown }; column: { id: string } }) => {
          const value = row.getValue(column.id)
          
          // Same formatting logic for non-editable cells
          const formatCellValue = (val: unknown, type: FieldType): React.ReactNode => {
            if (val === null || val === undefined || val === '') return <span className="text-gray-400">—</span>
            
            switch (type) {
              case 'category':
                return (
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(String(val))}`}>
                    {String(val)}
                  </span>
                )
              case 'boolean':
                return (
                  <span className={`font-bold ${val ? 'text-green-600' : 'text-red-600'}`}>
                    {val ? '✓' : '✗'}
                  </span>
                )
              case 'currency':
                const num = Number(val)
                return isNaN(num) ? String(val) : 
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
              case 'date':
                const date = new Date(String(val))
                return isNaN(date.getTime()) ? String(val) : date.toLocaleDateString('pt-BR')
              case 'number':
                const numVal = Number(val)
                return isNaN(numVal) ? String(val) : numVal.toLocaleString('pt-BR')
              case 'email':
                return <a href={`mailto:${val}`} className="text-blue-600 hover:underline">{String(val)}</a>
              case 'url':
                return <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{String(val)}</a>
              default:
                return String(val)
            }
          }
          
          return (
            <div className="w-full h-full p-3 text-sm flex items-center">
              {formatCellValue(value, fieldType)}
            </div>
          )
        }
      }
    }) as ColumnDef<TData>[]

    return [...cols, ...editableColumns]
  }, [columns, data, editable, editingCell, onCellEdit])

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
                      className="bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-200 last:border-r-0 px-0 py-0 h-12"
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
                  className="hover:bg-gray-50 border-0 h-12 group"
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
                <TableCell colSpan={enhancedColumns.length} className="h-40 text-center border-r border-gray-200 border-b border-gray-200">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <Edit3 className="h-8 w-8" />
                    </div>
                    <span className="text-sm font-medium">No data available</span>
                    <span className="text-xs text-gray-500">Import a dataset or add some data to get started</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Baserow-style footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-6">
          <span className="font-medium">{totalRows} rows</span>
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <Calculator className="h-3 w-3" />
              Summarize
            </button>
            <button className="text-gray-500 hover:text-gray-700">Row height</button>
            <button className="text-gray-500 hover:text-gray-700">Export</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 w-7 p-0 hover:bg-gray-200"
            >
              ‹
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 w-7 p-0 hover:bg-gray-200"
            >
              ›
            </Button>
          </div>
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