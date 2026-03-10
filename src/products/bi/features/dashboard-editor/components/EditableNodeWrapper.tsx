'use client'

import { useRef, useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Copy, Pencil, Trash2 } from 'lucide-react'
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
  const rootRef = useRef<HTMLDivElement | null>(null)
  const isTheme = type === 'Theme'
  const isRootNode = path.length === 0
  const isCompactNode = type === 'Title' || type === 'Subtitle' || type === 'CardTitle' || type === 'Icon'
  const canShowHighlight = !isTheme && !isRootNode
  const canDuplicate = !isTheme && !isRootNode
  const canDelete = !isTheme && !isRootNode
  const canEdit = !isTheme && !isRootNode
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

  const accentRgb = '113,215,247'
  const showHoverChrome = hovered || selected
  const showCompactToolbar = selected
  const showToolbar = isCompactNode ? showCompactToolbar : showHoverChrome
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
        rootRef.current = node
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
      {showToolbar && (
        <div className="pointer-events-none absolute left-2 top-2 z-40 flex items-center">
          <div
            className="pointer-events-auto inline-flex items-center gap-0.5 rounded-md px-1 py-1 shadow-sm"
            style={{
              backgroundColor: `rgba(${accentRgb},0.98)`,
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(14, 165, 233, 0.22)',
            }}
          >
            <button
              type="button"
              aria-label={`Editar componente ${type}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-white/95 transition hover:bg-white/18"
              onClick={(e) => {
                e.stopPropagation()
                if (!canEdit) return
                onAction(path, 'edit')
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Duplicar componente ${type}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-white/95 transition hover:bg-white/18 disabled:opacity-50"
              disabled={!canDuplicate}
              onClick={(e) => {
                e.stopPropagation()
                if (!canDuplicate) return
                onAction(path, 'duplicate')
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Excluir componente ${type}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-white/95 transition hover:bg-white/18 disabled:opacity-50"
              disabled={!canDelete}
              onClick={(e) => {
                e.stopPropagation()
                if (!canDelete) return
                onAction(path, 'delete')
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
