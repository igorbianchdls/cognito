'use client'

import type { SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import { resolvePptxTheme } from '@/products/artifacts/slide/export/pptx/pptxTheme'
import type { PptxRenderContext, PptxSlide } from '@/products/artifacts/slide/export/pptx/pptxTypes'
import { getElementFrame } from '@/products/artifacts/slide/export/pptx/pptxUtils'

type AnyRecord = Record<string, any>

function buildRows(element: SlideElementModel): string[][] {
  const props = element.props as AnyRecord
  const columns = Array.isArray(props.columns) ? props.columns : []
  const data = Array.isArray(props.data) ? props.data : []

  if (!columns.length || !data.length) {
    return [['Tabela editável'], ['Dados serão preenchidos a partir da consulta']]
  }

  const headers = columns.map((column: AnyRecord) => String(column.header || column.label || column.accessorKey || column.field || ''))
  const rows = data.map((row: AnyRecord) =>
    columns.map((column: AnyRecord) => {
      const key = column.accessorKey || column.field
      return key ? String(row[key] ?? '') : ''
    }),
  )

  return [headers, ...rows]
}

export function renderPptxTable(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const theme = resolvePptxTheme(context.deck.theme)
  const frame = getElementFrame(element, context, fallbackIndex, { w: 6.8, h: 2.4 })
  const rows = buildRows(element)

  pptxSlide.addTable(rows as any, {
    ...frame,
    border: { color: theme.border, pt: 0.5 },
    color: theme.text,
    fill: { color: 'FFFFFF' },
    fontFace: 'Aptos',
    fontSize: 8,
    margin: 0.05,
  } as any)
}
