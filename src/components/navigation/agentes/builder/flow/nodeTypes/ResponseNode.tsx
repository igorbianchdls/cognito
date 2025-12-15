"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { getVisualForBlock } from '../visuals'
import NodeHeader from '../NodeHeader'

export default function ResponseNode({ data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || 'Resposta'
  const visual = getVisualForBlock(data.block)
  const desc = 'Resposta'
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <NodeHeader icon={visual.icon} badgeBg={visual.badgeBg} badgeColor={visual.badgeColor} description={desc} title={name} />
        <BlockActions />
      </BlockCard>
      {/* Sem saída */}
    </div>
  )
}
