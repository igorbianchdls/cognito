'use client'

import React from 'react'

import FrameSurface from '@/products/bi/json-render/components/FrameSurface'
import { useSemanticUiStyle, useThemeOverrides } from '@/products/bi/json-render/theme/ThemeContext'

type AnyRecord = Record<string, any>

function normalizeCardDomProps(input: Record<string, any> | undefined): Record<string, any> {
  const props = { ...(input || {}) }
  delete props.style
  delete props.frame
  delete props.variant
  delete props.children
  delete props.text
  return props
}

function resolveCardRole(props: Record<string, any> | undefined): string {
  const rawRole = props?.['data-ui']
  if (typeof rawRole === 'string' && rawRole.trim()) return rawRole.trim().toLowerCase()

  const rawVariant = props?.variant
  const variant = typeof rawVariant === 'string' ? rawVariant.trim().toLowerCase() : ''
  if (variant === 'chart') return 'chart-card'
  if (variant === 'table') return 'table-card'
  if (variant === 'pivot') return 'pivot-card'
  if (variant === 'kpi') return 'kpi-card'
  if (variant === 'filter') return 'filter-card'
  if (variant === 'note') return 'note-card'

  return 'card'
}

function isCardRole(role: unknown): boolean {
  const normalized = String(role || '')
    .trim()
    .toLowerCase()
  return (
    normalized === 'card' ||
    normalized === 'chart-card' ||
    normalized === 'table-card' ||
    normalized === 'pivot-card' ||
    normalized === 'kpi-card' ||
    normalized === 'filter-card' ||
    normalized === 'note-card'
  )
}

export function getJsxCardSurfaceStyle(props: Record<string, any>, semanticStyle: React.CSSProperties): React.CSSProperties {
  return {
    boxSizing: 'border-box',
    minWidth: 0,
    ...semanticStyle,
    ...(props.style && typeof props.style === 'object' ? props.style : {}),
  }
}

export function isCardLikeSurface(props: Record<string, any> | undefined): boolean {
  return isCardRole(resolveCardRole(props))
}

export default function JsxCardSurface({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const props = (element?.props || {}) as Record<string, any>
  const role = resolveCardRole(props)
  const theme = useThemeOverrides()
  const semanticStyle = useSemanticUiStyle(role, 'div')
  const style = getJsxCardSurfaceStyle(props, semanticStyle)
  const domProps = normalizeCardDomProps({ ...props, 'data-ui': role })

  return (
    <FrameSurface
      style={style}
      frame={props.frame as AnyRecord}
      cssVars={theme.cssVars}
      className={typeof props.className === 'string' ? props.className : undefined}
      domProps={domProps}
    >
      {children}
    </FrameSurface>
  )
}
