'use client'

import React from 'react'

import { useSemanticUiStyle } from '@/products/bi/json-render/theme/ThemeContext'
import {
  getDashboardQueryDeltaColor,
  resolveDashboardQueryTemplate,
  useDashboardQueryResult,
} from '@/products/artifacts/dashboard/renderer/components/DashboardQuery'

type DashboardTextProps = {
  element: any
  children?: React.ReactNode
}

function normalizeProps(input: Record<string, any> | undefined): Record<string, any> {
  const props = { ...(input || {}) }
  delete props.as
  delete props.type
  delete props.variant
  delete props.style
  delete props.text
  delete props.title
  delete props.children
  delete props.color
  delete props.fontSize
  delete props.fontWeight
  delete props.fontFamily
  delete props.letterSpacing
  delete props.lineHeight
  delete props.textTransform
  return props
}

function resolveTextRole(props: Record<string, any>): string {
  if (typeof props.variant === 'string' && props.variant.trim()) return props.variant.trim().toLowerCase()
  if (typeof props.type === 'string' && props.type.trim()) return props.type.trim().toLowerCase()
  return 'body'
}

export default function DashboardText({ element, children }: DashboardTextProps) {
  const props = (element?.props || {}) as Record<string, any>
  const queryResult = useDashboardQueryResult()
  const tag = typeof props.as === 'string' ? (props.as as keyof React.JSX.IntrinsicElements) : 'p'
  const textType = resolveTextRole(props)
  const semanticStyle = useSemanticUiStyle(textType, tag)
  const queryDeltaColor =
    textType === 'kpi-delta' || textType === 'kpi-compare' ? getDashboardQueryDeltaColor(queryResult) : undefined

  const fallbackContent =
    typeof props.text === 'string'
      ? resolveDashboardQueryTemplate(props.text, queryResult)
      : typeof props.title === 'string'
        ? resolveDashboardQueryTemplate(props.title, queryResult)
        : null

  const content = children ?? fallbackContent

  return React.createElement(
    tag,
    {
      ...normalizeProps(props),
      'data-ui': props['data-ui'] || textType,
      style: {
        boxSizing: 'border-box',
        minWidth: 0,
        margin: 0,
        ...semanticStyle,
        color: props.color,
        fontSize: props.fontSize,
        fontWeight: props.fontWeight,
        fontFamily: props.fontFamily,
        letterSpacing: props.letterSpacing,
        lineHeight: props.lineHeight,
        textTransform: props.textTransform,
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
        ...(queryDeltaColor ? { color: queryDeltaColor } : {}),
      },
    },
    content,
  )
}
