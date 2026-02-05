"use client"

import { useMemo, useRef, useState } from 'react'
import DriveViewerToolbar from './DriveViewerToolbar'
import DriveViewerContent, { ViewerHandlers } from './DriveViewerContent'
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

  const handlersRef = useRef<ViewerHandlers>({})
  const [zoomText, setZoomText] = useState<string | undefined>(undefined)
  useViewerShortcuts({ onClose, onPrev: goPrev, onNext: goNext, onTogglePlay: () => handlersRef.current.togglePlay?.() })

  return (
    <div className="fixed inset-0 z-50 grid grid-rows-[auto_1fr] bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="pointer-events-none mx-auto mt-4 max-w-[1400px] px-4" onClick={(e)=> e.stopPropagation()}>
        <div className="pointer-events-auto">
          <DriveViewerToolbar
            title={current?.name}
            countText={countText}
            onClose={onClose}
            onPrev={goPrev}
            onNext={goNext}
            onZoomIn={() => { handlersRef.current.zoomIn?.(); const z = handlersRef.current.getZoomText?.(); if (z) setZoomText(z) }}
            onZoomOut={() => { handlersRef.current.zoomOut?.(); const z = handlersRef.current.getZoomText?.(); if (z) setZoomText(z) }}
            onZoomReset={() => { handlersRef.current.resetZoom?.(); const z = handlersRef.current.getZoomText?.(); if (z) setZoomText(z) }}
            onRotate={() => handlersRef.current.rotate?.()}
            onDownload={() => { if (current?.url) { try { const a = document.createElement('a'); a.href = current.url; a.download = current.name || 'download'; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); } catch { window.open(current.url!, '_blank', 'noopener'); } } }}
            zoomText={zoomText}
          />
        </div>
      </div>
      <div className="min-h-0 overflow-hidden" onClick={(e)=> e.stopPropagation()}>
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-center px-4 py-6">
          {/* side arrows */}
          <button onClick={goPrev} className="absolute left-0 top-1/2 z-[60] -translate-y-1/2 rounded-r-md bg-black/30 p-2 text-white hover:bg-black/40">‹</button>
          <button onClick={goNext} className="absolute right-0 top-1/2 z-[60] -translate-y-1/2 rounded-l-md bg-black/30 p-2 text-white hover:bg-black/40">›</button>
          <div className="relative h-[84vh] w-full overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl ring-1 ring-white/10">
            <DriveViewerContent mime={current?.mime} url={current?.url} name={current?.name} register={(h) => { handlersRef.current = h; const z = h.getZoomText?.(); if (z) setZoomText(z); }} />
          </div>
        </div>
      </div>
    </div>
  )
}
