'use client'

import type { SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import { cssColorToHex, resolvePptxTheme } from '@/products/artifacts/slide/export/pptx/pptxTheme'
import type { PptxRenderContext, PptxSlide } from '@/products/artifacts/slide/export/pptx/pptxTypes'
import { getElementFrame, getElementText, getNumberProp, getStringProp, getStyle } from '@/products/artifacts/slide/export/pptx/pptxUtils'

function getDefaultFontSize(element: SlideElementModel) {
  if (element.kind === 'title') return 34
  if (element.kind === 'subtitle') return 17
  if (element.kind === 'footer') return 9
  if (element.kind === 'bullets') return 13
  return 12
}

export function renderPptxText(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const props = element.props
  const style = getStyle(element)
  const theme = resolvePptxTheme(context.deck.theme)
  const frame = getElementFrame(element, context, fallbackIndex, {
    h: element.kind === 'title' ? 0.78 : element.kind === 'subtitle' ? 0.5 : 0.36,
  })
  const text = getElementText(element)
  if (!text) return

  pptxSlide.addText(text, {
    ...frame,
    align: (getStringProp(props, 'align') as any) || 'left',
    breakLine: false,
    color: cssColorToHex(style.color || props.color, element.kind === 'subtitle' || element.kind === 'footer' ? theme.mutedText : theme.text),
    fit: 'shrink',
    fontFace: getStringProp(props, 'fontFace') || 'Aptos',
    fontSize: getNumberProp(props, 'fontSize') || getDefaultFontSize(element),
    bold: element.kind === 'title',
    margin: 0,
    valign: 'top',
    bullet: element.kind === 'bullets' ? { type: 'ul' } : undefined,
  } as any)
}

export function renderPptxHtmlText(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const text = getElementText(element)
  if (!text) return

  const theme = resolvePptxTheme(context.deck.theme)
  const frame = getElementFrame(element, context, fallbackIndex)
  const style = getStyle(element)
  pptxSlide.addText(text, {
    ...frame,
    color: cssColorToHex(style.color, theme.text),
    fit: 'shrink',
    fontFace: 'Aptos',
    fontSize: getNumberProp(style, 'fontSize') || 11,
    margin: 0,
    valign: 'top',
  } as any)
}
