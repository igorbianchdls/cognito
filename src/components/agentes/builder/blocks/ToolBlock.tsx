"use client"

import { Wrench, CheckCircle2 } from "lucide-react"
import BlockCard from "../BlockCard"
import BlockActions from "../BlockActions"

export default function ToolBlock({ index, name = 'Ferramenta', selected, onSelect, onDelete, onDuplicate }: { index: number; name?: string; selected?: boolean; onSelect?: () => void; onDelete?: () => void; onDuplicate?: () => void }) {
  return (
    <BlockCard selected={selected} onClick={onSelect}>
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">
          <Wrench className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-gray-500">{index}. Ferramenta</div>
          <div className="text-sm font-medium">{name}</div>
        </div>
      </div>
      <div className="text-green-600 flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <BlockActions onDelete={onDelete} onDuplicate={onDuplicate} />
    </BlockCard>
  )
}

