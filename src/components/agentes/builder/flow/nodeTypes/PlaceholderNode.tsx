"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { getVisualForBlock } from '../visuals'

export default function PlaceholderNode({ data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || data.block.kind
  const visual = getVisualForBlock(data.block)
  const subtitle = data.block.kind.charAt(0).toUpperCase() + data.block.kind.slice(1)
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg border" style={{ background: visual.badgeBg, color: visual.badgeColor, borderColor: 'rgba(0,0,0,0.06)' }}>{visual.icon}</div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{name}</div>
            <div className="text-xs text-gray-500">{subtitle}</div>
          </div>
        </div>
        <div />
        <BlockActions />
      </BlockCard>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  )
}
