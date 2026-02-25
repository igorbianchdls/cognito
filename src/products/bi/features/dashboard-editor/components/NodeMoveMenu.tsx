'use client'

import type { NodeMoveDirection } from '@/products/bi/features/dashboard-editor/types/editor-types'

type NodeMoveMenuProps = {
  canMoveUp?: boolean
  canMoveDown?: boolean
  onMove: (direction: NodeMoveDirection) => void
}

export default function NodeMoveMenu({
  canMoveUp = true,
  canMoveDown = true,
  onMove,
}: NodeMoveMenuProps) {
  return (
    <div
      className="pointer-events-auto absolute left-0 top-7 z-50 min-w-[140px] rounded-md border border-gray-200 bg-white p-1 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onMove('up')}
        disabled={!canMoveUp}
        className="block w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Mover acima
      </button>
      <button
        type="button"
        onClick={() => onMove('down')}
        disabled={!canMoveDown}
        className="block w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Mover abaixo
      </button>
    </div>
  )
}
