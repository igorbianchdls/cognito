'use client'

import { useEffect, useRef, useState } from 'react'

import { captureArtifactPreview } from '@/products/artifacts/core/preview/captureArtifactPreview'
import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'
import { parseDashboardJsxToTree } from '@/products/artifacts/dashboard/parser/dashboardJsxParser'
import { DashboardRenderer } from '@/products/artifacts/dashboard/renderer/dashboardRenderer'
import type { DashboardAppearanceOverrides } from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'
import {
  DASHBOARD_THUMBNAIL_CAPTURE_DELAY_MS,
  DASHBOARD_THUMBNAIL_CAPTURE_HEIGHT,
  DASHBOARD_THUMBNAIL_CAPTURE_WIDTH,
} from '@/products/artifacts/dashboard/thumbnail/dashboardThumbnailConstants'

export type DashboardThumbnailCaptureRequest = {
  artifactId: string
  captureKey: number
  sourcePath: string
  files: ArtifactCodeFile[]
  appearanceOverrides?: DashboardAppearanceOverrides
}

export type DashboardThumbnailCaptureResult =
  | {
      artifactId: string
      captureKey: number
      ok: true
      thumbnailDataUrl: string
    }
  | {
      artifactId: string
      captureKey: number
      ok: false
      error: string
    }

export function DashboardThumbnailCaptureSurface({
  request,
  onComplete,
}: {
  request: DashboardThumbnailCaptureRequest | null
  onComplete: (result: DashboardThumbnailCaptureResult) => void
}) {
  const [tree, setTree] = useState<any>(null)
  const [loadedCaptureKey, setLoadedCaptureKey] = useState<number | null>(null)
  const surfaceRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!request) {
      setTree(null)
      setLoadedCaptureKey(null)
      return
    }

    const activeRequest = request
    let cancelled = false

    async function run() {
      try {
        setTree(null)
        setLoadedCaptureKey(null)
        const nextTree = await parseDashboardJsxToTree(activeRequest.sourcePath, activeRequest.files)
        if (cancelled) return
        setTree(nextTree)
        setLoadedCaptureKey(activeRequest.captureKey)
      } catch (error) {
        if (cancelled) return
        onComplete({
          artifactId: activeRequest.artifactId,
          captureKey: activeRequest.captureKey,
          ok: false,
          error: error instanceof Error ? error.message : 'Falha ao compilar thumbnail do dashboard',
        })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [request, onComplete])

  useEffect(() => {
    if (!request || !tree || loadedCaptureKey !== request.captureKey) return

    const activeRequest = request
    const surfaceElement = surfaceRef.current
    if (!surfaceElement) return

    let cancelled = false

    const timeoutId = window.setTimeout(async () => {
      try {
        const thumbnailDataUrl = await captureArtifactPreview(surfaceElement)
        if (cancelled) return
        onComplete({
          artifactId: activeRequest.artifactId,
          captureKey: activeRequest.captureKey,
          ok: true,
          thumbnailDataUrl,
        })
      } catch (error) {
        if (cancelled) return
        onComplete({
          artifactId: activeRequest.artifactId,
          captureKey: activeRequest.captureKey,
          ok: false,
          error: error instanceof Error ? error.message : 'Falha ao capturar thumbnail do dashboard',
        })
      }
    }, DASHBOARD_THUMBNAIL_CAPTURE_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [request, tree, loadedCaptureKey, onComplete])

  if (!request || !tree) return null
  const activeRequest = request

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-[-20000px] top-0 opacity-0"
      style={{ width: DASHBOARD_THUMBNAIL_CAPTURE_WIDTH }}
    >
      <div
        ref={surfaceRef}
        className="overflow-hidden bg-white"
        style={{
          width: DASHBOARD_THUMBNAIL_CAPTURE_WIDTH,
          minWidth: DASHBOARD_THUMBNAIL_CAPTURE_WIDTH,
          height: DASHBOARD_THUMBNAIL_CAPTURE_HEIGHT,
        }}
      >
        <DashboardRenderer tree={tree} appearanceOverrides={activeRequest.appearanceOverrides} />
      </div>
    </div>
  )
}
