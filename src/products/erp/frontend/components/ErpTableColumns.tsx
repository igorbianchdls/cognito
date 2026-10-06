'use client'

import { useState } from 'react'
import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ErpColumnOption = { id: string; label: string; defaultVisible?: boolean; locked?: boolean }

export function getErpColumnVisibility(columns: ErpColumnOption[], overrides: Record<string, boolean> = {}) {
  return Object.fromEntries(columns.map(column => [column.id, column.locked || (overrides[column.id] ?? column.defaultVisible !== false)]))
}

export function useErpTableColumns(columns: ErpColumnOption[], scope: string) {
  const [state, setState] = useState<{ scope: string; overrides: Record<string, boolean> }>({ scope, overrides: {} })
  const overrides = state.scope === scope ? state.overrides : {}
  const visibility = getErpColumnVisibility(columns, overrides)
  return {
    columns,
    visibility,
    setVisible: (id: string, visible: boolean) => setState(current => ({
      scope, overrides: { ...(current.scope === scope ? current.overrides : {}), [id]: visible },
    })),
    reset: () => setState({ scope, overrides: {} }),
  }
}

export function ErpColumnSelector({ columns, visibility, setVisible, reset }: ReturnType<typeof useErpTableColumns>) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="icon" className="erp-workspace-column-trigger" aria-label="Configurar colunas" title="Configurar colunas"><Columns3 className="size-4" /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>Colunas da tabela</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {columns.map(column => <DropdownMenuCheckboxItem key={column.id} checked={visibility[column.id]} disabled={column.locked}
        onSelect={event => event.preventDefault()} onCheckedChange={checked => setVisible(column.id, checked)}>{column.label}</DropdownMenuCheckboxItem>)}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={reset}>Restaurar padrão</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
}
