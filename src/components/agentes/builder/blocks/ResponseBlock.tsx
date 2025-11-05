"use client"

import { MessageSquareText, CheckCircle2 } from "lucide-react"
import BlockCard from "../BlockCard"
import BlockActions from "../BlockActions"

export default function ResponseBlock({ index, name = 'Resposta', selected, onSelect, onDelete, onDuplicate }: { index: number; name?: string; selected?: boolean; onSelect?: () => void; onDelete?: () => void; onDuplicate?: () => void }) {
  return (
    <BlockCard selected={selected} onClick={onSelect}>
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 border border-green-200 text-green-700">
          <MessageSquareText className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-gray-500">{index}. Resposta</div>
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

