'use client'

import type { SlideThemeModel } from '@/products/artifacts/slide/model/slideModel'

export type PptxResolvedTheme = {
  accent: string
  background: string
  border: string
  mutedText: string
  surface: string
  text: string
}

function normalizeHex(input: unknown, fallback: string) {
  if (typeof input !== 'string') return fallback
  const clean = input.trim().replace(/^#/, '')
  return /^[0-9a-fA-F]{6}$/.test(clean) ? clean.toUpperCase() : fallback
}

export function resolvePptxTheme(theme: SlideThemeModel): PptxResolvedTheme {
  const managers = theme.managers || {}
  return {
    accent: normalizeHex(managers.accent || managers.primary || managers.brand, '245BDB'),
    background: normalizeHex(managers.background || managers.pageBackground, 'FFFFFF'),
    border: normalizeHex(managers.border, 'D8E1EE'),
    mutedText: normalizeHex(managers.mutedText || managers.secondaryText, '5B6B83'),
    surface: normalizeHex(managers.surface || managers.cardBackground, 'F8FAFD'),
    text: normalizeHex(managers.text || managers.foreground, '17243A'),
  }
}

export function cssColorToHex(input: unknown, fallback: string) {
  if (typeof input !== 'string') return fallback
  const clean = input.trim()
  if (clean.startsWith('#')) return normalizeHex(clean, fallback)
  if (/^[0-9a-fA-F]{6}$/.test(clean)) return clean.toUpperCase()

  const rgb = clean.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!rgb) return fallback
  return [rgb[1], rgb[2], rgb[3]]
    .map((part) => Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}
