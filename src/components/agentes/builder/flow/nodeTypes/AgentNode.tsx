"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { CheckCircle2 } from 'lucide-react'
import { getVisualForBlock } from '../visuals'

export default function AgentNode({ id, data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || 'Agente'
  const visual = getVisualForBlock(data.block)
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg border" style={{ background: visual.badgeBg, color: visual.badgeColor, borderColor: 'rgba(0,0,0,0.06)' }}>{visual.icon}</div>
          <div>
            <div className="text-xs text-gray-500">Agente</div>
            <div className="text-sm font-medium">{name}</div>
          </div>
        </div>
        <div className="text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <BlockActions />
      </BlockCard>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  )
}
