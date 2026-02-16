"use client"

import { useMemo } from "react"
import { Table as TableIcon } from "lucide-react"

import TabsNav, { type Opcao } from "@/products/erp/frontend/components/TabsNav"
import type { TableRow } from "@/products/airtable/frontend/features/table-view/types"

type AirtableTableTabsProps = {
  tables: TableRow[]
  selectedTableId: string
  onSelectTable: (tableId: string) => void
}

export default function AirtableTableTabs({ tables, selectedTableId, onSelectTable }: AirtableTableTabsProps) {
  const options: Opcao[] = useMemo(
    () =>
      tables.map((t) => ({
        value: t.id,
        label: t.name,
        icon: <TableIcon className="h-4 w-4" />,
      })),
    [tables]
  )

  return (
    <div className="pt-0">
      {options.length > 0 ? (
        <TabsNav
          options={options}
          value={selectedTableId}
          onValueChange={onSelectTable}
          fontFamily="var(--font-geist-sans)"
          fontSize={15}
          fontWeight="400"
          color="rgb(99, 99, 99)"
          letterSpacing={-0.3}
          iconSize={16}
          labelOffsetY={8}
          startOffset={22}
          activeColor="rgb(41, 41, 41)"
          activeFontWeight="500"
          activeBorderColor="rgb(41, 41, 41)"
          className="px-0 md:px-0"
        />
      ) : (
        <div className="text-sm text-muted-foreground">Nenhuma tabela ainda. Clique em "Nova tabela".</div>
      )}
    </div>
  )
}
