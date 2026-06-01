'use client'

import type { SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import type { PptxRenderContext, PptxSlide } from '@/products/artifacts/slide/export/pptx/pptxTypes'
import { getElementFrame, getStringProp } from '@/products/artifacts/slide/export/pptx/pptxUtils'

export function renderPptxImage(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const src = getStringProp(element.props, 'src')
  if (!src) return

  const frame = getElementFrame(element, context, fallbackIndex, { w: 3.6, h: 2.2 })
  const imageProps = src.startsWith('data:') ? { data: src } : { path: src }
  pptxSlide.addImage({
    ...imageProps,
    ...frame,
    altText: getStringProp(element.props, 'alt') || '',
  } as any)
}
