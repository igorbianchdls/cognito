'use client'

import type { SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import { resolvePptxTheme } from '@/products/artifacts/slide/export/pptx/pptxTheme'
import type { PptxRenderContext, PptxSlide } from '@/products/artifacts/slide/export/pptx/pptxTypes'
import { getElementFrame, getStringProp } from '@/products/artifacts/slide/export/pptx/pptxUtils'

type AnyRecord = Record<string, any>

function buildChartData(element: SlideElementModel) {
  const props = element.props as AnyRecord
  const data = Array.isArray(props.data) ? props.data : []
  if (!data.length) return null

  const labelKey = getStringProp(props, 'labelKey') || 'label'
  const valueKey = getStringProp(props, 'valueKey') || 'value'
  const labels = data.map((row: AnyRecord, index: number) => String(row[labelKey] ?? row.name ?? `Item ${index + 1}`))
  const values = data.map((row: AnyRecord) => Number(row[valueKey] ?? row.value ?? 0))

  return [{ name: getStringProp(props, 'title') || 'Série 1', labels, values }]
}

export function renderPptxChart(
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) {
  const theme = resolvePptxTheme(context.deck.theme)
  const frame = getElementFrame(element, context, fallbackIndex, { w: 5.8, h: 2.8 })
  const chartData = buildChartData(element)

  if (!chartData) {
    pptxSlide.addShape('roundRect' as any, {
      ...frame,
      fill: { color: theme.surface },
      line: { color: theme.border, width: 0.75 },
    } as any)
    pptxSlide.addText('Gráfico editável', { x: frame.x + 0.18, y: frame.y + 0.18, w: frame.w - 0.36, h: 0.28, fontSize: 12, bold: true, color: theme.text, margin: 0 } as any)
    pptxSlide.addText('Dados serão preenchidos a partir da consulta', { x: frame.x + 0.18, y: frame.y + 0.55, w: frame.w - 0.36, h: 0.35, fontSize: 9, color: theme.mutedText, margin: 0 } as any)
    return
  }

  const type = getStringProp(element.props, 'type') || 'bar'
  const chartType = type === 'line' ? context.pptx.ChartType.line : type === 'pie' ? context.pptx.ChartType.pie : context.pptx.ChartType.bar
  pptxSlide.addChart(chartType, chartData, {
    ...frame,
    catAxisLabelColor: theme.mutedText,
    showLegend: false,
    showTitle: Boolean(getStringProp(element.props, 'title')),
    title: getStringProp(element.props, 'title'),
    valAxisLabelColor: theme.mutedText,
  } as any)
}
