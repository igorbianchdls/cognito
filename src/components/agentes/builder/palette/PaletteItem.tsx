"use client"

import { cn } from "@/lib/utils"
import type { BlockKind } from "@/types/agentes/builder"
import * as React from 'react'

export default function PaletteItem({
  icon,
  label,
  badgeBg = '#EEF2FF',
  badgeColor = '#1F2937',
  kind,
  onAdd,
  meta,
}: {
  icon: React.ReactNode
  label: string
  badgeBg?: string
  badgeColor?: string
  kind: BlockKind
  onAdd: (payload: { kind: BlockKind; name?: string; toolId?: string }) => void
  meta?: { toolId?: string }
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-block-kind', String(kind))
    e.dataTransfer.setData('application/x-block-name', String(label))
    if (meta?.toolId) e.dataTransfer.setData('application/x-tool-id', String(meta.toolId))
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <button
      className={cn(
        'w-full px-3 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-gray-50 border border-transparent hover:border-gray-200 active:scale-[0.99] transition select-none',
      )}
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAdd({ kind, name: label, toolId: meta?.toolId })}
      type="button"
    >
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border"
        style={{ background: badgeBg, color: badgeColor, borderColor: 'rgba(0,0,0,0.06)' }}
      >
        {icon}
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  )
}
