'use client'

import type { Layout } from 'react-grid-layout'

type AnyRecord = Record<string, any>

export function styleDimension(value: unknown): string | number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return value
  return undefined
}

export function toNumericLayoutValue(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function buildPanelLayout(panelNodes: AnyRecord[], cols: number): Layout[] {
  const safeCols = Math.max(1, cols)
  const fallbackSpan = Math.max(1, Math.floor(safeCols / Math.max(panelNodes.length, 1)))
  let nextX = 0
  let nextY = 0
  let currentRowHeight = 1

  return panelNodes.map((panelNode, index) => {
    const span = Math.max(1, Math.min(safeCols, toNumericLayoutValue(panelNode?.props?.span, fallbackSpan)))
    const rows = Math.max(1, toNumericLayoutValue(panelNode?.props?.rows, 1))
    const rawX = panelNode?.props?.x
    const rawY = panelNode?.props?.y
    const hasExplicitX = !(rawX === undefined || rawX === null || String(rawX).trim() === '')
    const hasExplicitY = !(rawY === undefined || rawY === null || String(rawY).trim() === '')

    if (hasExplicitX || hasExplicitY) {
      const x = Math.max(0, Math.min(safeCols - 1, toNumericLayoutValue(rawX, 0)))
      const y = Math.max(0, toNumericLayoutValue(rawY, 0))
      return {
        i: String(panelNode?.props?.id || `panel-${index}`),
        x,
        y,
        w: Math.min(span, safeCols - x || safeCols),
        h: rows,
        minW: Math.max(1, toNumericLayoutValue(panelNode?.props?.minSpan, 2)),
        minH: 1,
      }
    }

    if (nextX + span > safeCols) {
      nextX = 0
      nextY += currentRowHeight
      currentRowHeight = rows
    } else {
      currentRowHeight = Math.max(currentRowHeight, rows)
    }

    const item: Layout = {
      i: String(panelNode?.props?.id || `panel-${index}`),
      x: nextX,
      y: nextY,
      w: span,
      h: rows,
      minW: Math.max(1, toNumericLayoutValue(panelNode?.props?.minSpan, 2)),
      minH: 1,
    }

    nextX += span
    return item
  })
}
