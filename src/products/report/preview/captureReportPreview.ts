'use client'

import type { ReportPreviewData } from '@/products/report/preview/types'

function copyCanvasPixels(source: ParentNode, target: ParentNode) {
  const sourceCanvases = Array.from(source.querySelectorAll('canvas'))
  const targetCanvases = Array.from(target.querySelectorAll('canvas'))

  sourceCanvases.forEach((sourceCanvas, index) => {
    const targetCanvas = targetCanvases[index]
    if (!targetCanvas) return

    targetCanvas.width = sourceCanvas.width
    targetCanvas.height = sourceCanvas.height

    const context = targetCanvas.getContext('2d')
    if (!context) return

    context.drawImage(sourceCanvas, 0, 0)
  })
}

export async function captureReportPreview(element: HTMLElement): Promise<ReportPreviewData> {
  const clone = element.cloneNode(true) as HTMLDivElement
  copyCanvasPixels(element, clone)
  return {
    html: clone.innerHTML,
  }
}
