'use client'

import type { RefObject } from 'react'

import { ReportRenderer } from '@/products/report/frontend/render/reportRegistry'

interface ReportPdfExportStageProps {
  height: number
  reportElementRef: RefObject<HTMLDivElement | null>
  tree: any
  width: number
}

export function ReportPdfExportStage({
  height,
  reportElementRef,
  tree,
  width,
}: ReportPdfExportStageProps) {
  if (!tree) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-20000px',
        top: 0,
        width,
        height,
        overflow: 'hidden',
      }}
    >
      <div
        ref={reportElementRef}
        className="overflow-hidden rounded-none border border-slate-200 bg-white"
        style={{ width, minWidth: width, height }}
      >
        <ReportRenderer tree={tree} />
      </div>
    </div>
  )
}
