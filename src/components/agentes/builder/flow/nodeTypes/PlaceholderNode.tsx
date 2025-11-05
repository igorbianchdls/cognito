"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { StickyNote, RefreshCw, UserCheck, Wand2, ToggleLeft } from 'lucide-react'

function IconFor(kind: string) {
  switch (kind) {
    case 'nota': return <StickyNote className="w-4 h-4" />
    case 'loop': return <RefreshCw className="w-4 h-4" />
    case 'aprovacao': return <UserCheck className="w-4 h-4" />
    case 'transform': return <Wand2 className="w-4 h-4" />
    case 'setstate': return <ToggleLeft className="w-4 h-4" />
    default: return <StickyNote className="w-4 h-4" />
  }
}

export default function PlaceholderNode({ data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || data.block.kind
  const icon = IconFor(data.block.kind)
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
            {icon}
          </div>
          <div>
            <div className="text-xs text-gray-500">{data.block.kind}</div>
            <div className="text-sm font-medium">{name}</div>
          </div>
        </div>
        <div />
        <BlockActions />
      </BlockCard>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  )
}

