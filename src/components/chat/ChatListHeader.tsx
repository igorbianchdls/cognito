"use client"

import * as React from 'react'
import { Plus, Search } from 'lucide-react'

type Props = {
  value: string
  onChange: (v: string) => void
  count?: number
  selectMode?: boolean
  onToggleSelect?: () => void
  onNewChat?: () => void
}

export default function ChatListHeader({ value, onChange, count, selectMode, onToggleSelect, onNewChat }: Props) {
  return (
    <div className="px-3 mb-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 py-4">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#111827' }}>Conversas</h1>
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-2 rounded-lg h-9 px-3.5 bg-black text-white text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo bate-papo</span>
          </button>
        </div>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            value={value}
            onChange={(e)=> onChange(e.target.value)}
            placeholder="Procurar nas suas conversas..."
            className="w-full h-11 rounded-lg border bg-white pl-9 pr-3 text-sm placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {typeof count === 'number' && <span>{count} chats</span>}
          {onToggleSelect && (
            <button type="button" onClick={onToggleSelect} className="text-blue-600 hover:underline">
              {selectMode ? 'Cancelar' : 'Selecionar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
