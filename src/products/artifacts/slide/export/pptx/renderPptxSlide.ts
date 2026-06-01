'use client'

import type { SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import { PPTX_COMPONENT_RENDERERS } from '@/products/artifacts/slide/export/pptx/pptxComponentRegistry'
import { resolvePptxTheme } from '@/products/artifacts/slide/export/pptx/pptxTheme'
import type { PptxRenderContext, PptxSlide } from '@/products/artifacts/slide/export/pptx/pptxTypes'

function renderElement(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  if (element.kind === 'query' || element.kind === 'container') {
    element.children.forEach((child, childIndex) => renderElement(pptxSlide, child, context, fallbackIndex + childIndex))
    return
  }

  const renderer = PPTX_COMPONENT_RENDERERS[element.kind]
  if (renderer) {
    renderer(pptxSlide, element, context, fallbackIndex)
    if (element.kind === 'card') {
      element.children.forEach((child, childIndex) => renderElement(pptxSlide, child, context, fallbackIndex + childIndex))
    }
    return
  }

  element.children.forEach((child, childIndex) => renderElement(pptxSlide, child, context, fallbackIndex + childIndex))
}

export function renderPptxSlide(pptxSlide: PptxSlide, context: PptxRenderContext) {
  const theme = resolvePptxTheme(context.deck.theme)
  pptxSlide.background = { color: theme.background }
  context.slide.elements.forEach((element, index) => renderElement(pptxSlide, element, context, index))
}
