'use client'

import type { SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import { resolvePptxTheme } from '@/products/artifacts/slide/export/pptx/pptxTheme'
import type { PptxRenderContext, PptxSlide } from '@/products/artifacts/slide/export/pptx/pptxTypes'
import { getElementFrame, getElementText } from '@/products/artifacts/slide/export/pptx/pptxUtils'

export function renderPptxFallbackBox(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const theme = resolvePptxTheme(context.deck.theme)
  const frame = getElementFrame(element, context, fallbackIndex, { w: 5.2, h: 0.8 })
  const text = getElementText(element) || `${element.sourceType} sem fallback visual`

  pptxSlide.addShape('roundRect' as any, {
    ...frame,
    fill: { color: theme.surface },
    line: { color: theme.border, width: 0.75 },
  } as any)
  pptxSlide.addText(text, {
    x: frame.x + 0.12,
    y: frame.y + 0.12,
    w: frame.w - 0.24,
    h: frame.h - 0.24,
    color: theme.text,
    fit: 'shrink',
    fontFace: 'Aptos',
    fontSize: 10,
    margin: 0,
    valign: 'top',
  } as any)
}
