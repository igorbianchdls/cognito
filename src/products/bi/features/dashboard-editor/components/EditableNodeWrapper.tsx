'use client'

import { useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Copy, GripVertical, Pencil, X } from 'lucide-react'
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
  const showControls = canShowHighlight && (hovered || selected)
  const isStructuralNode = ['Container', 'Sidebar', 'Header', 'Card', 'SlicerCard'].includes(type)
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
    setActivatorNodeRef,
    attributes,
    listeners,
  } = useDraggable({
    id: `bi-node-drag:${dndIdBase}`,
    data: {
      kind: 'dashboard-node',
      path,
    },
    disabled: !dndEnabled || !canMove,
  })

  const accentRgb = '214,123,232'
  const highlightStyle = !canShowHighlight
    ? undefined
    : selected
    ? {
        outline: `1px solid rgba(${accentRgb},0.95)`,
        outlineOffset: 2,
        borderRadius: 6,
      }
    : hovered
      ? {
          outline: `1px solid rgba(${accentRgb},0.8)`,
          outlineOffset: 2,
          borderRadius: 6,
        }
      : undefined

  const controlsStyle = isStructuralNode
    ? ({
        position: 'absolute',
        left: '50%',
        top: -14,
        transform: 'translateX(-50%)',
        zIndex: 40,
      } as const)
    : ({
        position: 'absolute',
        right: 8,
        top: -10,
        zIndex: 40,
      } as const)

  const controlsShellStyle = isStructuralNode
    ? ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: '2px 4px',
        borderRadius: 999,
        border: `1px solid rgba(${accentRgb},0.42)`,
        backgroundColor: '#efc4f8',
        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.14)',
      } as const)
    : ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 2,
        borderRadius: 10,
        border: `1px solid rgba(${accentRgb},0.42)`,
        backgroundColor: '#efc4f8',
        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.14)',
      } as const)

  const actionButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: isStructuralNode ? 24 : 22,
    height: isStructuralNode ? 24 : 22,
    border: 0,
    borderRadius: isStructuralNode ? 999 : 8,
    background: 'transparent',
    color: '#2f1736',
    cursor: 'pointer',
  } as const

  return (
    <div
      ref={(node) => {
        setDroppableNodeRef(node)
        setDraggableNodeRef(node)
      }}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={highlightStyle}
    >
      {showControls ? (
        <div
          className="pointer-events-none"
          style={controlsStyle}
        >
          <div
            className="pointer-events-auto"
            style={controlsShellStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={setActivatorNodeRef}
              type="button"
              aria-label="Mover componente"
              title="Mover"
              style={actionButtonStyle}
              className="cursor-grab active:cursor-grabbing hover:bg-white/40"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={14} />
            </button>
            <button
              type="button"
              aria-label="Editar componente"
              title="Editar"
              style={actionButtonStyle}
              className="hover:bg-white/40"
              onClick={() => onAction(path, 'edit')}
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              aria-label="Duplicar componente"
              title="Duplicar"
              style={actionButtonStyle}
              className="hover:bg-white/40"
              onClick={() => onAction(path, 'duplicate')}
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              aria-label="Excluir componente"
              title="Excluir"
              style={actionButtonStyle}
              className="hover:bg-white/40"
              onClick={() => onAction(path, 'delete')}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : null}
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
