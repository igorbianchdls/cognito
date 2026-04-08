'use client'

import React from 'react'

import {
  getDashboardQueryDeltaColor,
  resolveDashboardQueryTemplate,
  useDashboardQueryResult,
} from '@/products/artifacts/dashboard/renderer/components/DashboardQuery'
import {
  resolveDashboardHeaderTextOverride,
  resolveDashboardTextStyle,
  useDashboardHeaderScope,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'

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

function pickExplicitTextStyle(props: Record<string, any>): React.CSSProperties {
  const style: React.CSSProperties = {}
  if (props.color !== undefined) style.color = props.color
  if (props.fontSize !== undefined) style.fontSize = props.fontSize
  if (props.fontWeight !== undefined) style.fontWeight = props.fontWeight
  if (props.fontFamily !== undefined) style.fontFamily = props.fontFamily
  if (props.letterSpacing !== undefined) style.letterSpacing = props.letterSpacing
  if (props.lineHeight !== undefined) style.lineHeight = props.lineHeight
  if (props.textTransform !== undefined) style.textTransform = props.textTransform
  return style
}

export default function DashboardText({ element, children }: DashboardTextProps) {
  const props = (element?.props || {}) as Record<string, any>
  const queryResult = useDashboardQueryResult()
  const isInHeader = useDashboardHeaderScope()
  const { appearanceOverrides, themeName } = useDashboardThemeSelection()
  const tag = typeof props.as === 'string' ? (props.as as keyof React.JSX.IntrinsicElements) : 'p'
  const textType = resolveTextRole(props)
  const semanticStyle = resolveDashboardTextStyle(textType, themeName, appearanceOverrides)
  const headerTextOverride = isInHeader ? resolveDashboardHeaderTextOverride(textType, appearanceOverrides) : {}
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
        ...pickExplicitTextStyle(props),
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
        ...headerTextOverride,
        ...(queryDeltaColor ? { color: queryDeltaColor } : {}),
      },
    },
    content,
  )
}
