"use client"

import { CheckCircle2, Webhook } from "lucide-react"
import NodeCard from "./NodeCard"
import NodeActions from "../NodeActions"

export default function TriggerNode({ index, selected, onSelect, onDelete, text }: { index: number; selected?: boolean; onSelect?: () => void; onDelete?: () => void; text?: string }) {
  return (
    <NodeCard selected={selected} onClick={onSelect}>
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
          <Webhook className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-gray-500">{index}. Trigger</div>
          <div className="text-sm font-medium">{text || 'New website form submission'}</div>
        </div>
      </div>
      <div className="text-green-600 flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <NodeActions onDelete={onDelete} />
    </NodeCard>
  )
}
