'use client'

import type PptxGenJS from 'pptxgenjs'

import type { ReportElementModel, ReportPageModel } from '@/products/artifacts/report/model/reportModel'
import {
  cssColorToHex,
  cssPxToPt,
  getElementStyle,
  getFrameIn,
  getNumber,
  stripQueryTokens,
} from '@/products/artifacts/report/export/pptx/reportPptxUtils'

type PptxSlide = PptxGenJS.Slide

const TEXT_COLOR = '263145'
const MUTED_TEXT_COLOR = '51607A'
const BORDER_COLOR = 'E7ECF3'
const SURFACE_COLOR = 'FFFFFF'
const CALLOUT_COLOR = 'F8FAFD'

function isHeading(element: ReportElementModel) {
  const type = element.sourceType.toLowerCase()
  const dataUi = typeof element.props['data-ui'] === 'string' ? element.props['data-ui'] : ''
  return ['h1', 'h2', 'h3'].includes(type) || dataUi === 'title'
}

function renderText(pptxSlide: PptxSlide, element: ReportElementModel) {
  const style = getElementStyle(element)
  const frame = getFrameIn(element.frame)
  const fontSizePx = getNumber(style.fontSize, isHeading(element) ? 30 : 14)
  const color = cssColorToHex(style.color, element.sourceType === 'p' || element.sourceType === 'li' ? MUTED_TEXT_COLOR : TEXT_COLOR)
  const text = stripQueryTokens(element.text || '')
  if (!text.trim()) return

  pptxSlide.addText(text, {
    ...frame,
    bold: Boolean(style.bold) || isHeading(element),
    breakLine: false,
    color,
    fit: 'shrink',
    fontFace: 'Aptos',
    fontSize: cssPxToPt(fontSizePx),
    margin: 0,
    valign: 'top',
  } as any)
}

function renderBox(pptxSlide: PptxSlide, element: ReportElementModel) {
  const style = getElementStyle(element)
  const frame = getFrameIn(element.frame)
  const fill = cssColorToHex(style.backgroundColor, SURFACE_COLOR)
  const line = cssColorToHex(style.borderColor, BORDER_COLOR)
  const radius = getNumber(style.borderRadius, 8)

  pptxSlide.addShape((radius > 0 ? 'roundRect' : 'rect') as any, {
    ...frame,
    fill: { color: fill || CALLOUT_COLOR },
    line: { color: line, transparency: 0, width: 0.6 },
    radius,
  } as any)
}

function renderDataPlaceholder(pptxSlide: PptxSlide, element: ReportElementModel) {
  const frame = getFrameIn(element.frame)
  const label =
    element.kind === 'chart'
      ? `Chart placeholder (${String(element.props.type || 'chart')})`
      : element.kind === 'pivotTable'
        ? 'Pivot table placeholder'
        : 'Table placeholder'

  pptxSlide.addShape('roundRect' as any, {
    ...frame,
    fill: { color: SURFACE_COLOR },
    line: { color: BORDER_COLOR, width: 0.6 },
    radius: 8,
  } as any)
  pptxSlide.addText(label, {
    x: frame.x + 0.18,
    y: frame.y + 0.18,
    w: Math.max(0.1, frame.w - 0.36),
    h: 0.3,
    bold: true,
    color: TEXT_COLOR,
    fontFace: 'Aptos',
    fontSize: 10,
    margin: 0,
  } as any)
  pptxSlide.addText('Importado como objeto editavel simples para Canva. Dados dinâmicos serão materializados em uma próxima etapa.', {
    x: frame.x + 0.18,
    y: frame.y + 0.56,
    w: Math.max(0.1, frame.w - 0.36),
    h: 0.45,
    color: MUTED_TEXT_COLOR,
    fontFace: 'Aptos',
    fontSize: 8,
    margin: 0,
  } as any)
}

function renderElement(pptxSlide: PptxSlide, element: ReportElementModel) {
  if (element.kind === 'box') renderBox(pptxSlide, element)
  if (element.kind === 'chart' || element.kind === 'table' || element.kind === 'pivotTable') renderDataPlaceholder(pptxSlide, element)
  if (element.kind === 'text') renderText(pptxSlide, element)
}

export function renderReportPptxPage(pptxSlide: PptxSlide, page: ReportPageModel) {
  pptxSlide.background = { color: SURFACE_COLOR }
  page.elements.forEach((element) => renderElement(pptxSlide, element))
}
