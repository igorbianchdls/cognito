"use client"

import { CheckCircle2, Zap } from "lucide-react"
import NodeCard from "./NodeCard"
import NodeActions from "../NodeActions"

export default function ActionNode({ index, text = 'Add a new record', selected, onSelect, onDelete }: { index: number; text?: string; selected?: boolean; onSelect?: () => void; onDelete?: () => void }) {
  return (
    <NodeCard selected={selected} onClick={onSelect}>
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-gray-500">{index}. Action</div>
          <div className="text-sm font-medium">{text}</div>
        </div>
      </div>
      <div className="text-green-600 flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <NodeActions onDelete={onDelete} />
    </NodeCard>
  )
}
