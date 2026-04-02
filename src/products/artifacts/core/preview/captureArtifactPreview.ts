'use client'

import { toPng } from 'html-to-image'

export async function captureArtifactPreview(element: HTMLElement): Promise<string> {
  return toPng(element, {
    backgroundColor: '#ffffff',
    cacheBust: true,
    canvasHeight: element.offsetHeight,
    canvasWidth: element.offsetWidth,
    pixelRatio: 1,
  })
}
