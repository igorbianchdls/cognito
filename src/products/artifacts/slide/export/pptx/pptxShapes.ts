'use client'

import type { SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import { cssColorToHex, resolvePptxTheme } from '@/products/artifacts/slide/export/pptx/pptxTheme'
import type { PptxRenderContext, PptxSlide } from '@/products/artifacts/slide/export/pptx/pptxTypes'
import { getElementFrame, getElementText, getNumberProp, getStringProp, getStyle } from '@/products/artifacts/slide/export/pptx/pptxUtils'

export function renderPptxShape(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const props = element.props
  const theme = resolvePptxTheme(context.deck.theme)
  const style = getStyle(element)
  const frame = getElementFrame(element, context, fallbackIndex, { w: 2, h: 1 })
  const shape = getStringProp(props, 'shape') || 'rect'

  pptxSlide.addShape(shape as any, {
    ...frame,
    fill: { color: cssColorToHex(style.backgroundColor || props.fill, 'FFFFFF'), transparency: props.fill ? 0 : 100 },
    line: { color: cssColorToHex(props.stroke, theme.border), transparency: props.stroke ? 0 : 100, width: 1 },
    radius: getNumberProp(props, 'radius'),
  } as any)
}

export function renderPptxCard(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const theme = resolvePptxTheme(context.deck.theme)
  const frame = getElementFrame(element, context, fallbackIndex, { w: 3.1, h: 1.15 })
  pptxSlide.addShape('roundRect' as any, {
    ...frame,
    fill: { color: theme.surface },
    line: { color: theme.border, width: 0.75 },
  } as any)
}

export function renderPptxStat(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const props = element.props
  const theme = resolvePptxTheme(context.deck.theme)
  const frame = getElementFrame(element, context, fallbackIndex, { w: 2.6, h: 1.2 })

  pptxSlide.addShape('roundRect' as any, {
    ...frame,
    fill: { color: 'FFFFFF' },
    line: { color: theme.border, width: 0.75 },
  } as any)

  const label = getStringProp(props, 'label')
  const value = getStringProp(props, 'value') || getElementText(element)
  const delta = getStringProp(props, 'delta')
  if (label) pptxSlide.addText(label, { x: frame.x + 0.12, y: frame.y + 0.12, w: frame.w - 0.24, h: 0.22, fontSize: 8, color: theme.mutedText, margin: 0 } as any)
  if (value) pptxSlide.addText(value, { x: frame.x + 0.12, y: frame.y + 0.4, w: frame.w - 0.24, h: 0.38, fontSize: 22, bold: true, color: theme.text, margin: 0 } as any)
  if (delta) pptxSlide.addText(delta, { x: frame.x + 0.12, y: frame.y + 0.84, w: frame.w - 0.24, h: 0.22, fontSize: 8, color: '3B7D4F', margin: 0 } as any)
}
