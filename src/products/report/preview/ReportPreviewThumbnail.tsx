'use client'

import type { ReportPreviewData } from '@/products/report/preview/types'

interface ReportPreviewThumbnailProps {
  alt: string
  height: number
  selected: boolean
  preview?: ReportPreviewData
  width: number
}

export function ReportPreviewThumbnail({ alt, height, preview, selected, width }: ReportPreviewThumbnailProps) {
  return (
    <div
      className={`mb-2 overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
        selected ? 'border-[3px] border-[#0075E2]' : 'border border-slate-300'
      }`}
    >
      {preview ? (
        <div
          aria-label={alt}
          className="overflow-hidden bg-white"
          style={{ width, height }}
        >
          <div
            className="origin-top-left pointer-events-none select-none"
            style={{
              width: 794,
              height: 1123,
              transform: `scale(${width / 794})`,
            }}
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        </div>
      ) : (
        <div className="bg-white" aria-hidden="true" style={{ width, height }} />
      )}
    </div>
  )
}
