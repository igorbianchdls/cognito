"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { MessageSquareText, CheckCircle2 } from 'lucide-react'

export default function ResponseNode({ data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || 'Resposta'
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 border border-green-200 text-green-700">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Resposta</div>
            <div className="text-sm font-medium">{name}</div>
          </div>
        </div>
        <div className="text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <BlockActions />
      </BlockCard>
      {/* Sem saída */}
    </div>
  )
}

