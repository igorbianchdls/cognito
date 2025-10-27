"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { WorkflowSummary, WorkflowCategory } from "@/app/workflows/types"
import CategoryIconBadge from "@/components/workflows/CategoryIconBadge"
import { Banknote, ShoppingCart, Megaphone, Wrench, Users, Headphones, MoreHorizontal, Heart } from "lucide-react"

type Props = {
  workflow: WorkflowSummary
  onOpen?: (id: string) => void
  onDuplicate?: (id: string) => void
  onRename?: (id: string) => void
  onDelete?: (id: string) => void
}

function formatDateRelative(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diff = Math.max(0, now.getTime() - date.getTime())
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 60) return `atualizado há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `atualizado há ${hours} h`
  const days = Math.floor(hours / 24)
  return `atualizado há ${days} d`
}

function StatusBadge({ status }: { status: WorkflowSummary["status"] }) {
  const styles =
    status === "ativo"
      ? "bg-green-100 text-green-700 border-green-200"
      : status === "pausado"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-gray-100 text-gray-700 border-gray-200"
  const label =
    status === "ativo" ? "Ativo" : status === "pausado" ? "Pausado" : "Rascunho"
  return <Badge className={cn("border", styles)}>{label}</Badge>
}

function categoryVisuals(category?: WorkflowCategory) {
  switch (category) {
    case 'financeiro':
      return { tone: 'green' as const, icon: <Banknote /> }
    case 'vendas':
      return { tone: 'amber' as const, icon: <ShoppingCart /> }
    case 'marketing':
      return { tone: 'violet' as const, icon: <Megaphone /> }
    case 'operacoes':
      return { tone: 'slate' as const, icon: <Wrench /> }
    case 'crm':
      return { tone: 'blue' as const, icon: <Users /> }
    case 'suporte':
      return { tone: 'indigo' as const, icon: <Headphones /> }
    case 'outros':
      return { tone: 'gray' as const, icon: <MoreHorizontal /> }
    default:
      return { tone: 'lime' as const, icon: <Heart /> }
  }
}

export function WorkflowCard({ workflow, onOpen, onDuplicate, onRename, onDelete }: Props) {
  return (
    <Card className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CategoryIconBadge {...categoryVisuals(workflow.category)} ariaLabel={workflow.category || 'categoria'} className="mb-2" />
          <h3 className="text-base font-semibold line-clamp-2 break-words" title={workflow.name}>
            {workflow.name}
          </h3>
          {workflow.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {workflow.description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Mais ações" className="text-gray-500 hover:text-gray-700">
              ⋯
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onOpen?.(workflow.id)}>Abrir</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(workflow.id)}>Duplicar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename?.(workflow.id)}>Renomear</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(workflow.id)}>
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2 truncate">
          {/* Status badge movido para a linha inferior (substitui hashtags) */}
          <StatusBadge status={workflow.status} />
        </div>
        <span>{formatDateRelative(workflow.updatedAt)}</span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="text-xs text-muted-foreground">
          {workflow.runs ? `${workflow.runs} execuções` : 'Sem execuções'}
        </div>
        <Button size="sm" variant="outline" onClick={() => onOpen?.(workflow.id)}>
          Abrir
        </Button>
      </div>
    </Card>
  )
}

export default WorkflowCard
