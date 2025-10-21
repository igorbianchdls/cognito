"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import DataTable, { type TableData } from "@/components/widgets/Table"

interface TabelaDadosProps<TData extends TableData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
  className?: string
}

export default function TabelaDados<TData extends TableData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Nenhum registro encontrado",
  className,
}: TabelaDadosProps<TData>) {
  return (
    <div className={`w-full px-4 pb-4 md:px-6 md:pb-6 ${className ?? ""}`}>
      <div className="border rounded-md bg-background">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </div>
    </div>
  )
}

