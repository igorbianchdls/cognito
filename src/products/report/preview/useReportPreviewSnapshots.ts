'use client'

import { RefObject, useEffect, useRef, useState } from 'react'

import { captureReportPreview } from '@/products/report/preview/captureReportPreview'
import type { ReportPreviewMap, ReportPreviewStatusMap } from '@/products/report/preview/types'

interface UseReportPreviewSnapshotsParams {
  activePageId: string
  captureKey: string
  reportElementRef: RefObject<HTMLDivElement | null>
}

export function useReportPreviewSnapshots({
  activePageId,
  captureKey,
  reportElementRef,
}: UseReportPreviewSnapshotsParams) {
  const [previewsByPageId, setPreviewsByPageId] = useState<ReportPreviewMap>({})
  const [statusByPageId, setStatusByPageId] = useState<ReportPreviewStatusMap>({})
  const lastCaptureKeyByPageIdRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!activePageId) return

    const reportElement = reportElementRef.current
    if (!reportElement) return

    const currentCaptureKey = lastCaptureKeyByPageIdRef.current[activePageId]
    if (currentCaptureKey === captureKey && previewsByPageId[activePageId]) return

    let cancelled = false

    setStatusByPageId((current) => ({ ...current, [activePageId]: 'capturing' }))

    const timeoutId = window.setTimeout(async () => {
      try {
        const preview = await captureReportPreview(reportElement)
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
  }, [activePageId, captureKey, previewsByPageId, reportElementRef])

  return {
    previewsByPageId,
    statusByPageId,
  }
}
