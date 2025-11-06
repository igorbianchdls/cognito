"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { getVisualForBlock } from '../visuals'

export default function StepNode({ data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || 'Step'
  const visual = getVisualForBlock(data.block)
  const desc = 'Step'
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <div className="flex items-center justify-between mb-1">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg border" style={{ background: visual.badgeBg, color: visual.badgeColor, borderColor: 'rgba(0,0,0,0.06)' }}>{visual.icon}</div>
          <div className="text-[11px] text-gray-500">{desc}</div>
        </div>
        <div className="text-base font-semibold text-gray-900">{name}</div>
        <BlockActions />
      </BlockCard>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  )
}
