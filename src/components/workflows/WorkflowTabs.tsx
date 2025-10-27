"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { WorkflowCategory } from "@/app/workflows/types"
import { Banknote, ShoppingCart, Megaphone, Wrench, Users, Headphones, MoreHorizontal, Layers } from "lucide-react"

export type WorkflowTabsValue = WorkflowCategory | 'todos'

export function WorkflowTabs({
  value,
  onChange,
}: {
  value: WorkflowTabsValue
  onChange: (v: WorkflowTabsValue) => void
}) {
  const options: { value: WorkflowTabsValue; label: string; icon: React.ReactNode }[] = [
    { value: 'todos', label: 'Todos', icon: <Layers className="w-4 h-4" /> },
    { value: 'financeiro', label: 'Financeiro', icon: <Banknote className="w-4 h-4" /> },
    { value: 'vendas', label: 'Vendas', icon: <ShoppingCart className="w-4 h-4" /> },
    { value: 'marketing', label: 'Marketing', icon: <Megaphone className="w-4 h-4" /> },
    { value: 'operacoes', label: 'Operações', icon: <Wrench className="w-4 h-4" /> },
    { value: 'crm', label: 'CRM', icon: <Users className="w-4 h-4" /> },
    { value: 'suporte', label: 'Suporte', icon: <Headphones className="w-4 h-4" /> },
    { value: 'outros', label: 'Outros', icon: <MoreHorizontal className="w-4 h-4" /> },
  ]

  return (
    <div className="w-full">
      <Tabs value={value} onValueChange={(v) => onChange(v as WorkflowTabsValue)} className="w-full">
        <TabsList className="w-full" variant="underline">
          {options.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value} variant="underline">
              <span className="flex items-center gap-2">
                {opt.icon}
                <span>{opt.label}</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

export default WorkflowTabs

