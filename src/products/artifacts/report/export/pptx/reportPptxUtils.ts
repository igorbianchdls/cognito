'use client'

import type { ReportElementModel, ReportFrameModel } from '@/products/artifacts/report/model/reportModel'
import { reportPxToIn } from '@/products/artifacts/report/model/reportUnits'

type AnyRecord = Record<string, any>

export function sanitizeReportFileName(name: string) {
  const base = name.trim() || 'report'
  return base.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').replace(/\s+/g, '-').toLowerCase()
}

export function cssPxToPt(valuePx: number): number {
  return Math.round(valuePx * 0.75 * 100) / 100
}

export function cssColorToHex(input: unknown, fallback = 'FFFFFF') {
  if (typeof input !== 'string' || !input.trim()) return fallback
  const value = input.trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.slice(1).toUpperCase()
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return value
      .slice(1)
      .split('')
      .map((part) => `${part}${part}`)
      .join('')
      .toUpperCase()
  }
  return fallback
}

export function getNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function getFrameIn(frame: ReportFrameModel) {
  return {
    x: reportPxToIn(frame.x),
    y: reportPxToIn(frame.y),
    w: Math.max(0.05, reportPxToIn(frame.w)),
    h: Math.max(0.05, reportPxToIn(frame.h)),
  }
}

export function getElementStyle(element: ReportElementModel): AnyRecord {
  return element.style && typeof element.style === 'object' ? (element.style as AnyRecord) : {}
}

export function stripQueryTokens(input: string) {
  return input.replace(/\{\{\s*query\.[^}]+\}\}/g, '-')
}
