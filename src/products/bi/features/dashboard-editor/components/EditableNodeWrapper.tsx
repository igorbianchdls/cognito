'use client'

import type { DragEvent as ReactDragEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import NodeActionMenu from '@/products/bi/features/dashboard-editor/components/NodeActionMenu'
import NodeMoveMenu from '@/products/bi/features/dashboard-editor/components/NodeMoveMenu'
import type {
  NodeDropPlacement,
  JsonNodePath,
  NodeMenuAction,
  NodeMoveDirection,
} from '@/products/bi/features/dashboard-editor/types/editor-types'

const DRAG_PATH_MIME = 'application/x-bi-node-path'

type EditableNodeWrapperProps = {
  path: JsonNodePath
  type: string
  selected: boolean
  siblingAxis?: 'horizontal' | 'vertical'
  onAction: (path: JsonNodePath, action: NodeMenuAction) => void
  onMove: (path: JsonNodePath, direction: NodeMoveDirection) => void
  onDropReorder: (sourcePath: JsonNodePath, targetPath: JsonNodePath, placement: NodeDropPlacement) => void
  children: React.ReactNode
}

export default function EditableNodeWrapper({
  path,
  type,
  selected,
  siblingAxis = 'vertical',
  onAction,
  onMove,
  onDropReorder,
  children,
}: EditableNodeWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [moveMenuOpen, setMoveMenuOpen] = useState(false)
  const [dropPlacement, setDropPlacement] = useState<NodeDropPlacement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const isTheme = type === 'Theme'
  const isRootNode = path.length === 0
  const canDuplicate = !isTheme && !isRootNode
  const canDelete = !isTheme && !isRootNode
  const canMove = !isTheme && !isRootNode
  const canMoveUp = canMove && path[path.length - 1] > 0
  const canMoveDown = canMove

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current) return
      if (rootRef.current.contains(event.target as Node)) return
      setActionMenuOpen(false)
      setMoveMenuOpen(false)
      setDropPlacement(null)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setActionMenuOpen(false)
      setMoveMenuOpen(false)
      setDropPlacement(null)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  function parseDraggedPath(event: ReactDragEvent): JsonNodePath | null {
    const raw = event.dataTransfer.getData(DRAG_PATH_MIME) || event.dataTransfer.getData('text/plain')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.some((v) => !Number.isInteger(v))) return null
      return parsed as JsonNodePath
    } catch {
      return null
    }
  }

  function isSameParentPath(a: JsonNodePath, b: JsonNodePath) {
    if (a.length !== b.length) return false
    return a.slice(0, -1).every((v, i) => v === b[i])
  }

  function getPlacementFromPointer(event: ReactDragEvent<HTMLDivElement>): NodeDropPlacement {
    const rect = event.currentTarget.getBoundingClientRect()
    if (siblingAxis === 'horizontal') {
      const midX = rect.left + rect.width / 2
      return event.clientX < midX ? 'before' : 'after'
    }
    const midY = rect.top + rect.height / 2
    return event.clientY < midY ? 'before' : 'after'
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragOver={(e) => {
        const sourcePath = parseDraggedPath(e)
        if (!sourcePath) return
        if (!isSameParentPath(sourcePath, path)) return
        if (sourcePath.every((v, i) => path[i] === v)) return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
        const nextPlacement = getPlacementFromPointer(e)
        if (nextPlacement !== dropPlacement) setDropPlacement(nextPlacement)
      }}
      onDragLeave={(e) => {
        const nextTarget = e.relatedTarget as Node | null
        if (nextTarget && rootRef.current?.contains(nextTarget)) return
        setDropPlacement(null)
      }}
      onDrop={(e) => {
        const sourcePath = parseDraggedPath(e)
        const placement = dropPlacement ?? getPlacementFromPointer(e)
        setDropPlacement(null)
        if (!sourcePath) return
        if (!isSameParentPath(sourcePath, path)) return
        if (sourcePath.every((v, i) => path[i] === v)) return
        e.preventDefault()
        e.stopPropagation()
        onDropReorder(sourcePath, path, placement)
      }}
      style={{
        outline: selected ? '2px solid rgba(59,130,246,0.7)' : undefined,
        outlineOffset: 2,
        borderRadius: selected ? 6 : undefined,
      }}
    >
      {dropPlacement && (
        <div
          className="pointer-events-none absolute z-30 rounded bg-blue-500/80"
          style={
            siblingAxis === 'horizontal'
              ? dropPlacement === 'before'
                ? { left: -2, top: 6, bottom: 6, width: 3 }
                : { right: -2, top: 6, bottom: 6, width: 3 }
              : dropPlacement === 'before'
                ? { left: 6, right: 6, top: -2, height: 3 }
                : { left: 6, right: 6, bottom: -2, height: 3 }
          }
        />
      )}
      {(hovered || actionMenuOpen || moveMenuOpen || selected) && (
        <div className="pointer-events-none absolute left-2 top-2 z-40 flex items-center">
          <button
            type="button"
            aria-label={`Mover componente ${type}`}
            className="pointer-events-auto cursor-grab active:cursor-grabbing rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canMove}
            draggable={canMove}
            onDragStart={(e) => {
              if (!canMove) return
              e.stopPropagation()
              setActionMenuOpen(false)
              setMoveMenuOpen(false)
              setDropPlacement(null)
              const payload = JSON.stringify(path)
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData(DRAG_PATH_MIME, payload)
              e.dataTransfer.setData('text/plain', payload)
            }}
            onDragEnd={() => {
              setDropPlacement(null)
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (!canMove) return
              setMoveMenuOpen((prev) => {
                const next = !prev
                if (next) setActionMenuOpen(false)
                return next
              })
            }}
          >
            ::
          </button>
          {moveMenuOpen && (
            <NodeMoveMenu
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMove={(direction) => {
                setMoveMenuOpen(false)
                onMove(path, direction)
              }}
            />
          )}
        </div>
      )}
      {(hovered || actionMenuOpen || moveMenuOpen || selected) && (
        <div className="pointer-events-none absolute right-2 top-2 z-40 flex items-center">
          <button
            type="button"
            aria-label={`Ações do componente ${type}`}
            className="pointer-events-auto rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation()
              setActionMenuOpen((prev) => {
                const next = !prev
                if (next) setMoveMenuOpen(false)
                return next
              })
            }}
          >
            ...
          </button>
          {actionMenuOpen && (
            <NodeActionMenu
              canDuplicate={canDuplicate}
              canDelete={canDelete}
              onAction={(action) => {
                setActionMenuOpen(false)
                onAction(path, action)
              }}
            />
          )}
        </div>
      )}
      {children}
    </div>
  )
}
