'use client'

import { useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type {
  NodeDropPlacement,
  JsonNodePath,
  NodeMenuAction,
  NodeMoveDirection,
} from '@/products/bi/features/dashboard-editor/types/editor-types'

type EditableNodeWrapperProps = {
  path: JsonNodePath
  type: string
  selected: boolean
  siblingAxis?: 'horizontal' | 'vertical'
  onAction: (path: JsonNodePath, action: NodeMenuAction) => void
  onMove: (path: JsonNodePath, direction: NodeMoveDirection) => void
  dnd?: {
    enabled?: boolean
    showDropIndicator?: boolean
    dropPlacement?: NodeDropPlacement | null
  }
  children: React.ReactNode
}

export default function EditableNodeWrapper({
  path,
  type,
  selected,
  siblingAxis = 'vertical',
  onAction,
  dnd,
  children,
}: EditableNodeWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const isTheme = type === 'Theme'
  const isRootNode = path.length === 0
  const canShowHighlight = !isTheme && !isRootNode
  const canMove = !isTheme && !isRootNode
  const dndEnabled = Boolean(dnd?.enabled)
  const dndIdBase = path.length ? path.join('.') : 'root'
  const {
    setNodeRef: setDroppableNodeRef,
  } = useDroppable({
    id: `bi-node-drop:${dndIdBase}`,
    data: {
      kind: 'dashboard-node-target',
      path,
      siblingAxis,
    },
    disabled: !dndEnabled || isRootNode,
  })
  const {
    setNodeRef: setDraggableNodeRef,
  } = useDraggable({
    id: `bi-node-drag:${dndIdBase}`,
    data: {
      kind: 'dashboard-node',
      path,
    },
    disabled: !dndEnabled || !canMove,
  })

  const accentRgb = '37,99,235'
  const highlightStyle = !canShowHighlight
    ? undefined
    : selected
    ? {
        outline: `2px solid rgba(${accentRgb},0.98)`,
        outlineOffset: 2,
        borderRadius: 6,
        boxShadow: `0 0 0 1px rgba(${accentRgb},0.22) inset`,
        backgroundColor: `rgba(${accentRgb},0.08)`,
      }
    : hovered
      ? {
          outline: `1px solid rgba(${accentRgb},0.92)`,
          outlineOffset: 2,
          borderRadius: 6,
          boxShadow: `0 0 0 1px rgba(${accentRgb},0.16) inset`,
          backgroundColor: `rgba(${accentRgb},0.04)`,
        }
      : undefined

  return (
    <div
      ref={(node) => {
        setDroppableNodeRef(node)
        setDraggableNodeRef(node)
      }}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        if (isRootNode || isTheme) return
        onAction(path, 'edit')
      }}
      style={highlightStyle}
    >
      {dnd?.showDropIndicator && dnd.dropPlacement && (
        <div
          className="pointer-events-none absolute z-30 rounded bg-blue-500/80"
          style={
            siblingAxis === 'horizontal'
              ? dnd.dropPlacement === 'before'
                ? { left: -2, top: 6, bottom: 6, width: 3 }
                : { right: -2, top: 6, bottom: 6, width: 3 }
              : dnd.dropPlacement === 'before'
                ? { left: 6, right: 6, top: -2, height: 3 }
                : { left: 6, right: 6, bottom: -2, height: 3 }
          }
        />
      )}
      {children}
    </div>
  )
}
