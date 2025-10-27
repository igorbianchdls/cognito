"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export type FiltersState = {
  q: string
  status: 'todos' | 'ativo' | 'pausado' | 'rascunho'
  sort: 'recentes' | 'nome' | 'execucoes'
}

export function WorkflowFilters({ value, onChange, onCreate }: {
  value: FiltersState
  onChange: (v: FiltersState) => void
  onCreate?: () => void
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Buscar workflows..."
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
          />
        </div>
        <Select
          value={value.status}
          onValueChange={(v: any) => onChange({ ...value, status: v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={value.sort}
          onValueChange={(v: any) => onChange({ ...value, sort: v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="nome">Nome</SelectItem>
            <SelectItem value="execucoes">Execuções</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onCreate}>Criar workflow</Button>
      </div>
    </div>
  )
}

export default WorkflowFilters

