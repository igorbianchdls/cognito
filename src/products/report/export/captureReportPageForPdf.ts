'use client'

import { toJpeg } from 'html-to-image'

export async function captureReportPageForPdf(element: HTMLElement): Promise<string> {
  return toJpeg(element, {
    backgroundColor: '#ffffff',
    cacheBust: true,
    canvasHeight: element.offsetHeight,
    canvasWidth: element.offsetWidth,
    pixelRatio: 1.5,
    quality: 0.95,
  })
}
