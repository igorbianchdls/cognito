'use client'

import { useEffect, useRef, useState } from 'react'
import NodeActionMenu from '@/products/bi/features/dashboard-editor/components/NodeActionMenu'
import type { JsonNodePath, NodeMenuAction } from '@/products/bi/features/dashboard-editor/types/editor-types'

type EditableNodeWrapperProps = {
  path: JsonNodePath
  type: string
  selected: boolean
  onAction: (path: JsonNodePath, action: NodeMenuAction) => void
  children: React.ReactNode
}

export default function EditableNodeWrapper({
  path,
  type,
  selected,
  onAction,
  children,
}: EditableNodeWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const isTheme = type === 'Theme'
  const isRootNode = path.length === 0
  const canDuplicate = !isTheme && !isRootNode
  const canDelete = !isTheme && !isRootNode

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current) return
      if (rootRef.current.contains(event.target as Node)) return
      setMenuOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
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
      {(hovered || menuOpen || selected) && (
        <div className="pointer-events-none absolute right-2 top-2 z-40 flex items-center">
          <button
            type="button"
            aria-label={`Ações do componente ${type}`}
            className="pointer-events-auto rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((prev) => !prev)
            }}
          >
            ...
          </button>
          {menuOpen && (
            <NodeActionMenu
              canDuplicate={canDuplicate}
              canDelete={canDelete}
              onAction={(action) => {
                setMenuOpen(false)
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
