"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, MoreHorizontal, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { TabelaUIState } from "@/stores/modulos/financeiroUiStore"

export type BasicTableProps<TData extends object> = {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  ui: TabelaUIState
  className?: string
}

export default function TabelaBasica<TData extends object>({ columns, data, ui, className }: BasicTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    ui.defaultSortColumn ? [{ id: ui.defaultSortColumn, desc: ui.defaultSortDirection === 'desc' }] : []
  )
  const [globalFilter, setGlobalFilter] = React.useState<string>("")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  React.useEffect(() => {
    // Keep sorting in sync when default changes
    if (ui.defaultSortColumn) {
      setSorting([{ id: ui.defaultSortColumn, desc: ui.defaultSortDirection === 'desc' }])
    } else {
      setSorting([])
    }
  }, [ui.defaultSortColumn, ui.defaultSortDirection])

  const selectionCol: ColumnDef<TData> | null = ui.enableRowSelection
    ? {
        id: "_select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
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
      }
    : null

  const cols = React.useMemo(() => (selectionCol ? [selectionCol, ...columns] : columns), [selectionCol, columns])

  const table = useReactTable({
    data,
    columns: cols,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: { pageSize: ui.pageSize },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: ui.enableRowSelection,
    enableMultiRowSelection: ui.selectionMode === 'multiple',
  })

  const headerStyles: React.CSSProperties = {
    backgroundColor: ui.headerBg,
    color: ui.headerText,
    fontSize: ui.headerFontSize,
  }
  const cellStyles: React.CSSProperties = {
    color: ui.cellText,
    fontSize: ui.cellFontSize,
  }

  return (
    <div className={cn("w-full px-4 md:px-6", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div className="flex items-center gap-2">
          {ui.enableSearch && (
            <Input
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Filtrar..."
              className="w-56"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {ui.enableColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Colunas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Visibilidade</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table.getAllLeafColumns().map((col) => {
                  // hide selection column from toggles
                  if (col.id === "_select") return null
                  return (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) => col.toggleVisibility(!!value)}
                    >
                      {col.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={headerStyles}
                    className={cn(
                      ui.stickyHeader && "sticky top-0 z-10",
                      "whitespace-nowrap"
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          header.column.getCanSort() && "cursor-pointer select-none",
                          "flex items-center gap-1"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: "▲", desc: "▼" }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={cellStyles}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {ui.showPagination && (
        <div className="flex items-center justify-between py-3">
          <div className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              «
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              »
            </Button>
          </div>
        </div>
      )}
    </div>
  )}

