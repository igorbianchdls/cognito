"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { GitBranch, CheckCircle2 } from 'lucide-react'

export default function ConditionNode({ data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || 'Condição'
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 text-orange-700">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Condição</div>
            <div className="text-sm font-medium">{name}</div>
          </div>
        </div>
        <div className="text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <BlockActions />
      </BlockCard>
      {/* Duas saídas: verdadeiro e falso */}
      <div className="absolute -bottom-3 left-2 text-[10px] text-gray-500">Verdadeiro</div>
      <div className="absolute -bottom-3 right-2 text-[10px] text-gray-500">Falso</div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: 16 }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ right: 16 }} />
    </div>
  )
}

