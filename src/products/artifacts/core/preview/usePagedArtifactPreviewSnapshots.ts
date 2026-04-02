'use client'

import { RefObject, useEffect, useRef, useState } from 'react'

import { captureArtifactPreview } from '@/products/artifacts/core/preview/captureArtifactPreview'
import type { ArtifactPreviewMap, ArtifactPreviewStatusMap } from '@/products/artifacts/core/preview/types'

interface UsePagedArtifactPreviewSnapshotsParams {
  activePageId: string
  captureKey: string
  elementRef: RefObject<HTMLDivElement | null>
}

export function usePagedArtifactPreviewSnapshots({
  activePageId,
  captureKey,
  elementRef,
}: UsePagedArtifactPreviewSnapshotsParams) {
  const [previewsByPageId, setPreviewsByPageId] = useState<ArtifactPreviewMap>({})
  const [statusByPageId, setStatusByPageId] = useState<ArtifactPreviewStatusMap>({})
  const lastCaptureKeyByPageIdRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!activePageId) return

    const artifactElement = elementRef.current
    if (!artifactElement) return

    const currentCaptureKey = lastCaptureKeyByPageIdRef.current[activePageId]
    if (currentCaptureKey === captureKey && previewsByPageId[activePageId]) return

    let cancelled = false

    setStatusByPageId((current) => ({ ...current, [activePageId]: 'capturing' }))

    const timeoutId = window.setTimeout(async () => {
      try {
        const preview = await captureArtifactPreview(artifactElement)
        if (cancelled) return

        lastCaptureKeyByPageIdRef.current[activePageId] = captureKey
        setPreviewsByPageId((current) => ({ ...current, [activePageId]: preview }))
        setStatusByPageId((current) => ({ ...current, [activePageId]: 'ready' }))
      } catch {
        if (cancelled) return
        setStatusByPageId((current) => ({ ...current, [activePageId]: 'error' }))
      }
    }, 1200)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [activePageId, captureKey, previewsByPageId, elementRef])

  return {
    previewsByPageId,
    statusByPageId,
  }
}
