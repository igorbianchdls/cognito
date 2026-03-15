'use client'

import { RefObject, useEffect, useRef, useState } from 'react'

import { captureSlidePreview } from '@/products/slide/preview/captureSlidePreview'
import type { SlidePreviewMap, SlidePreviewStatusMap } from '@/products/slide/preview/types'

interface UseSlidePreviewSnapshotsParams {
  activePageId: string
  captureKey: string
  slideElementRef: RefObject<HTMLDivElement | null>
}

export function useSlidePreviewSnapshots({
  activePageId,
  captureKey,
  slideElementRef,
}: UseSlidePreviewSnapshotsParams) {
  const [previewsByPageId, setPreviewsByPageId] = useState<SlidePreviewMap>({})
  const [statusByPageId, setStatusByPageId] = useState<SlidePreviewStatusMap>({})
  const lastCaptureKeyByPageIdRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!activePageId) return

    const slideElement = slideElementRef.current
    if (!slideElement) return

    const currentCaptureKey = lastCaptureKeyByPageIdRef.current[activePageId]
    if (currentCaptureKey === captureKey && previewsByPageId[activePageId]) return

    let cancelled = false

    setStatusByPageId((current) => ({ ...current, [activePageId]: 'capturing' }))

    const timeoutId = window.setTimeout(async () => {
      try {
        const preview = await captureSlidePreview(slideElement)
        if (cancelled) return

        lastCaptureKeyByPageIdRef.current[activePageId] = captureKey
        setPreviewsByPageId((current) => ({ ...current, [activePageId]: preview }))
        setStatusByPageId((current) => ({ ...current, [activePageId]: 'ready' }))
      } catch {
        if (cancelled) return
        setStatusByPageId((current) => ({ ...current, [activePageId]: 'error' }))
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [activePageId, captureKey, previewsByPageId, slideElementRef])

  return {
    previewsByPageId,
    statusByPageId,
  }
}
