'use client'

import { useEffect, useRef, useState } from 'react'
import NodeActionMenu from '@/products/bi/features/dashboard-editor/components/NodeActionMenu'
import NodeMoveMenu from '@/products/bi/features/dashboard-editor/components/NodeMoveMenu'
import type {
  JsonNodePath,
  NodeMenuAction,
  NodeMoveDirection,
} from '@/products/bi/features/dashboard-editor/types/editor-types'

type EditableNodeWrapperProps = {
  path: JsonNodePath
  type: string
  selected: boolean
  onAction: (path: JsonNodePath, action: NodeMenuAction) => void
  onMove: (path: JsonNodePath, direction: NodeMoveDirection) => void
  children: React.ReactNode
}

export default function EditableNodeWrapper({
  path,
  type,
  selected,
  onAction,
  onMove,
  children,
}: EditableNodeWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [moveMenuOpen, setMoveMenuOpen] = useState(false)
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
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setActionMenuOpen(false)
      setMoveMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        outline: selected ? '2px solid rgba(59,130,246,0.7)' : undefined,
        outlineOffset: 2,
        borderRadius: selected ? 6 : undefined,
      }}
    >
      {(hovered || actionMenuOpen || moveMenuOpen || selected) && (
        <div className="pointer-events-none absolute left-2 top-2 z-40 flex items-center">
          <button
            type="button"
            aria-label={`Mover componente ${type}`}
            className="pointer-events-auto rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canMove}
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
