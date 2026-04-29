'use client'

import { useCallback, useRef, useState } from 'react'

import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'
import type { DashboardAppearanceOverrides } from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'
import {
  DashboardThumbnailCaptureSurface,
  type DashboardThumbnailCaptureRequest,
  type DashboardThumbnailCaptureResult,
} from '@/products/artifacts/dashboard/thumbnail/DashboardThumbnailCaptureSurface'
import { DASHBOARD_THUMBNAIL_SOURCE_PATH } from '@/products/artifacts/dashboard/thumbnail/dashboardThumbnailConstants'
import { persistDashboardThumbnail } from '@/products/artifacts/dashboard/thumbnail/persistDashboardThumbnail'

type PendingCapture = {
  resolve: (value: string | null) => void
  reject: (reason?: unknown) => void
}

export function useDashboardThumbnailGeneration() {
  const [captureRequest, setCaptureRequest] = useState<DashboardThumbnailCaptureRequest | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'persisting'>('idle')
  const nextCaptureKeyRef = useRef(1)
  const pendingCaptureRef = useRef<Map<number, PendingCapture>>(new Map())

  const handleCaptureComplete = useCallback((result: DashboardThumbnailCaptureResult) => {
    const pending = pendingCaptureRef.current.get(result.captureKey)
    if (!pending) return

    pendingCaptureRef.current.delete(result.captureKey)

    if (!result.ok) {
      setCaptureStatus('idle')
      setCaptureError(result.error)
      setCaptureRequest((current) => (current?.captureKey === result.captureKey ? null : current))
      pending.reject(new Error(result.error))
      return
    }

    setCaptureStatus('persisting')
    void persistDashboardThumbnail({
      artifactId: result.artifactId,
      thumbnailDataUrl: result.thumbnailDataUrl,
    })
      .then((persisted) => {
        setCaptureStatus('idle')
        setCaptureError(null)
        setCaptureRequest((current) => (current?.captureKey === result.captureKey ? null : current))
        pending.resolve(persisted.thumbnailDataUrl)
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Falha ao persistir thumbnail do dashboard'
        setCaptureStatus('idle')
        setCaptureError(message)
        setCaptureRequest((current) => (current?.captureKey === result.captureKey ? null : current))
        pending.reject(new Error(message))
      })
  }, [])

  const generateThumbnail = useCallback(({
    artifactId,
    source,
    appearanceOverrides,
  }: {
    artifactId: string
    source: string
    appearanceOverrides?: DashboardAppearanceOverrides
  }) => {
    const captureKey = nextCaptureKeyRef.current
    nextCaptureKeyRef.current += 1
    setCaptureStatus('capturing')
    setCaptureError(null)

    const files: ArtifactCodeFile[] = [
      {
        path: DASHBOARD_THUMBNAIL_SOURCE_PATH,
        name: 'dashboard.tsx',
        directory: 'app',
        extension: 'tsx',
        language: 'typescript',
        content: source,
      },
    ]

    setCaptureRequest({
      artifactId,
      captureKey,
      sourcePath: DASHBOARD_THUMBNAIL_SOURCE_PATH,
      files,
      appearanceOverrides,
    })

    return new Promise<string | null>((resolve, reject) => {
      pendingCaptureRef.current.set(captureKey, { resolve, reject })
    })
  }, [])

  return {
    captureError,
    captureStatus,
    generateThumbnail,
    thumbnailCaptureSurface: (
      <DashboardThumbnailCaptureSurface request={captureRequest} onComplete={handleCaptureComplete} />
    ),
  }
}
