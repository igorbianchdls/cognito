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
import {
  Banknote,
  ShoppingCart,
  Megaphone,
  Wrench,
  Users,
  Headphones,
  MoreHorizontal,
  Heart,
  Receipt,
  FileText,
  Barcode,
  ScanText,
  ShieldAlert,
  TrendingUp,
  Package,
  Truck,
  Percent,
  BadgeDollarSign,
  Handshake,
} from "lucide-react"

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

function getWorkflowVisuals(w: WorkflowSummary) {
  const tags = (w.tags || []).map(t => t.toLowerCase())
  const has = (t: string) => tags.includes(t)

  // Overrides por visualKey (se adotarmos depois)
  // if (w.visualKey === '...') return { tone: '...', icon: <.../> }

  // Financeiro: regras por tag
  if (w.category === 'financeiro') {
    if (has('nfe')) return { tone: 'orange' as const, icon: <Receipt /> }
    if (has('ap')) return { tone: 'emerald' as const, icon: <FileText /> }
    if (has('ar')) return { tone: 'green' as const, icon: <Banknote /> }
    if (has('conciliação') || has('conciliacao') || has('bancos')) return { tone: 'indigo' as const, icon: <Barcode /> }
    if (has('boletos')) return { tone: 'sky' as const, icon: <Barcode /> }
    if (has('ocr')) return { tone: 'cyan' as const, icon: <ScanText /> }
    if (has('despesas')) return { tone: 'violet' as const, icon: <FileText /> }
    if (has('auditoria') || has('fraude')) return { tone: 'rose' as const, icon: <ShieldAlert /> }
    if (has('fluxo') || has('forecast')) return { tone: 'purple' as const, icon: <TrendingUp /> }
    return { tone: 'green' as const, icon: <Banknote /> }
  }

  // Vendas
  if (w.category === 'vendas') {
    if (has('pedido') || has('expedicao')) return { tone: 'slate' as const, icon: <Package /> }
    if (has('crm') || has('proposta') || has('contrato')) return { tone: 'blue' as const, icon: <Handshake /> }
    if (has('descontos')) return { tone: 'blue' as const, icon: <Percent /> }
    if (has('comissoes')) return { tone: 'amber' as const, icon: <BadgeDollarSign /> }
    return { tone: 'amber' as const, icon: <ShoppingCart /> }
  }

  // Marketing
  if (w.category === 'marketing') {
    return { tone: 'teal' as const, icon: <Megaphone /> }
  }

  // Operações
  if (w.category === 'operacoes') {
    if (has('wms') || has('tms') || has('logistica')) return { tone: 'slate' as const, icon: <Truck /> }
    return { tone: 'slate' as const, icon: <Wrench /> }
  }

  // CRM/Suporte
  if (w.category === 'crm') return { tone: 'blue' as const, icon: <Users /> }
  if (w.category === 'suporte') return { tone: 'indigo' as const, icon: <Headphones /> }
  if (w.category === 'outros') return { tone: 'gray' as const, icon: <MoreHorizontal /> }
  return { tone: 'lime' as const, icon: <Heart /> }
}

export function WorkflowCard({ workflow, onOpen, onDuplicate, onRename, onDelete }: Props) {
  return (
    <Card className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CategoryIconBadge {...getWorkflowVisuals(workflow)} ariaLabel={workflow.category || 'categoria'} className="mb-2" />
          <h3 className="text-base font-semibold line-clamp-2 break-words" title={workflow.name}>
            {workflow.name}
          </h3>
          {workflow.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
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
