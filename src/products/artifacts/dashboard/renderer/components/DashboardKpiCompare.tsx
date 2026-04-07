'use client'

import React from 'react'

import { DashboardKpiCompareContext } from '@/products/artifacts/dashboard/renderer/components/DashboardKpiContext'
import {
  resolveDashboardKpiTheme,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'

export function DashboardKpiCompare({
  element,
}: {
  element: any
}) {
  const context = React.useContext(DashboardKpiCompareContext)
  const { themeName } = useDashboardThemeSelection()
  const props = (element?.props || {}) as Record<string, any>
  const kpiTheme = resolveDashboardKpiTheme(themeName)
  const styleOverride = props.style && typeof props.style === 'object' ? (props.style as React.CSSProperties) : undefined
  const colorOverride = typeof props.color === 'string' ? props.color : undefined

  if (!context?.canRenderComparison) return null

  return (
    <p
      data-ui="kpi-compare"
      style={{
        margin: 0,
        ...kpiTheme.compare.style,
        ...(context.comparisonStyle || {}),
        ...(styleOverride || {}),
        color: colorOverride || context.comparisonColor,
      }}
    >
      {context.loading ? '...' : context.comparisonText}
    </p>
  )
}
