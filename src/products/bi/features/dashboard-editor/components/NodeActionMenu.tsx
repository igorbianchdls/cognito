'use client'

import type { NodeMenuAction } from '@/products/bi/features/dashboard-editor/types/editor-types'

type NodeActionMenuProps = {
  canDuplicate?: boolean
  canDelete?: boolean
  onAction: (action: NodeMenuAction) => void
}

export default function NodeActionMenu({
  canDuplicate = true,
  canDelete = true,
  onAction,
}: NodeActionMenuProps) {
  return (
    <div
      className="absolute right-0 top-7 z-50 min-w-[140px] rounded-md border border-gray-200 bg-white p-1 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onAction('edit')}
        className="block w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={() => onAction('duplicate')}
        disabled={!canDuplicate}
        className="block w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Duplicar
      </button>
      <button
        type="button"
        onClick={() => onAction('delete')}
        disabled={!canDelete}
        className="block w-full rounded px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Excluir
      </button>
    </div>
  )
}

