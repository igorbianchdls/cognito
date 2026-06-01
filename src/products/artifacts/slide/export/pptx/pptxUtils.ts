'use client'

import type { SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import type { PptxFrame, PptxRenderContext } from '@/products/artifacts/slide/export/pptx/pptxTypes'

type AnyRecord = Record<string, any>

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function getStringProp(props: Record<string, unknown>, key: string): string | undefined {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function getNumberProp(props: Record<string, unknown>, key: string): number | undefined {
  const value = props[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function getStyle(element: SlideElementModel): Record<string, unknown> {
  return isRecord(element.style) ? element.style : {}
}

export function stripQueryTokens(input: string) {
  return input.replace(/\{\{\s*query\.[^}]+\}\}/g, '-')
}

export function cssPxToPt(valuePx: number): number {
  return Math.round(valuePx * 0.75 * 100) / 100
}

export function getElementText(element: SlideElementModel): string {
  const props = element.props as AnyRecord
  const direct = element.text || getStringProp(props, 'text') || getStringProp(props, 'value') || getStringProp(props, 'title')
  if (direct) return stripQueryTokens(direct)
  return element.children.map(getElementText).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export function getElementFrame(
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex = 0,
  fallback?: Partial<PptxFrame>,
): PptxFrame {
  const frame = element.frame
  const x = typeof frame?.x === 'number' ? context.unit.xToIn(frame.x) : fallback?.x ?? 0.6
  const y = typeof frame?.y === 'number' ? context.unit.yToIn(frame.y) : fallback?.y ?? 0.55 + fallbackIndex * 0.52
  const w = typeof frame?.w === 'number' ? context.unit.wToIn(frame.w) : fallback?.w ?? context.unit.widthIn - x - 0.6
  const h = typeof frame?.h === 'number' ? context.unit.hToIn(frame.h) : fallback?.h ?? 0.42

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    w: Math.max(0.1, w),
    h: Math.max(0.1, h),
  }
}

export function sanitizeFileName(name: string) {
  const base = name.trim() || 'apresentacao'
  return base.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').replace(/\s+/g, '-').toLowerCase()
}
