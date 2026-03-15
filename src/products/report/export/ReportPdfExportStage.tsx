'use client'

import type { RefObject } from 'react'

import { registry } from '@/products/bi/json-render/registry'
import { Renderer } from '@/products/bi/json-render/renderer'

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
        <Renderer tree={tree} registry={registry} />
      </div>
    </div>
  )
}
