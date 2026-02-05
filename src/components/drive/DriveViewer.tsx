"use client"

import { useMemo } from 'react'
import DriveViewerToolbar from './DriveViewerToolbar'
import DriveViewerContent from './DriveViewerContent'
import { useViewerShortcuts } from './hooks/useViewerShortcuts'
import type { DriveItem } from './types'

export default function DriveViewer({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: DriveItem[]
  index: number
  onClose: () => void
  onNavigate: (nextIndex: number) => void
}) {
  const current = items[index]
  const countText = useMemo(() => `${index + 1} de ${items.length}`, [index, items.length])

  const goPrev = () => onNavigate(Math.max(0, index - 1))
  const goNext = () => onNavigate(Math.min(items.length - 1, index + 1))

  useViewerShortcuts({ onClose, onPrev: goPrev, onNext: goNext })

  return (
    <div className="fixed inset-0 z-50 grid grid-rows-[auto_1fr] bg-black/70 backdrop-blur-sm">
      <div className="pointer-events-none mx-auto mt-4 max-w-[1400px] px-4">
        <div className="pointer-events-auto">
          <DriveViewerToolbar
            title={current?.name}
            countText={countText}
            onClose={onClose}
            onPrev={goPrev}
            onNext={goNext}
          />
        </div>
      </div>
      <div className="min-h-0 overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-center px-4 py-6">
          <div className="relative h-[84vh] w-full overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl ring-1 ring-white/10">
            <DriveViewerContent mime={current?.mime} url={current?.url} name={current?.name} />
          </div>
        </div>
      </div>
    </div>
  )
}

