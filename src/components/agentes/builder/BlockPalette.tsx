"use client"

import { Button } from "@/components/ui/button"
import { Bot, Wrench, GitBranch, MessageSquareText } from "lucide-react"
import type { BlockKind } from "@/types/agentes/builder"

export default function BlockPalette({ onAdd }: { onAdd: (kind: BlockKind) => void }) {
  return (
    <div className="p-3 space-y-2">
      <div className="px-2 pb-2 text-xs font-medium text-gray-600">Blocos</div>
      <div className="grid grid-cols-1 gap-2">
        <Button variant="outline" className="justify-start gap-2" onClick={() => onAdd('agente')}>
          <Bot className="w-4 h-4" /> Agente
        </Button>
        <Button variant="outline" className="justify-start gap-2" onClick={() => onAdd('ferramenta')}>
          <Wrench className="w-4 h-4" /> Ferramenta
        </Button>
        <Button variant="outline" className="justify-start gap-2" onClick={() => onAdd('condicao')}>
          <GitBranch className="w-4 h-4" /> Condição
        </Button>
        <Button variant="outline" className="justify-start gap-2" onClick={() => onAdd('resposta')}>
          <MessageSquareText className="w-4 h-4" /> Resposta
        </Button>
      </div>
    </div>
  )
}

