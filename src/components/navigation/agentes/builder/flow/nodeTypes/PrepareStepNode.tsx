"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { getVisualForBlock } from '../visuals'
import NodeHeader from '../NodeHeader'

export default function PrepareStepNode({ data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || 'PrepareStep'
  const visual = getVisualForBlock(data.block)
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <NodeHeader icon={visual.icon} badgeBg={visual.badgeBg} badgeColor={visual.badgeColor} description="PrepareStep" title={name} />
        <BlockActions />
      </BlockCard>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  )
}
