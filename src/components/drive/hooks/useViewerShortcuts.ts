import { useEffect } from 'react'

type Handlers = {
  onClose?: () => void
  onPrev?: () => void
  onNext?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void
  onTogglePlay?: () => void
}

export function useViewerShortcuts(h: Handlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') h.onClose?.()
      else if (e.key === 'ArrowLeft') h.onPrev?.()
      else if (e.key === 'ArrowRight') h.onNext?.()
      else if (e.key === '+') h.onZoomIn?.()
      else if (e.key === '-') h.onZoomOut?.()
      else if (e.key === '0') h.onZoomReset?.()
      else if (e.key === ' ') { e.preventDefault(); h.onTogglePlay?.() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [h])
}

