'use client'

import React from 'react'

import { useThemeOverrides } from '@/products/bi/json-render/theme/ThemeContext'
import { DashboardKpiCompareContext } from '@/products/artifacts/dashboard/renderer/components/DashboardKpiContext'
import {
  resolveDashboardTextStyle,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'

type AnyRecord = Record<string, any>

export function DashboardKpiCompare({
  element,
}: {
  element: any
}) {
  const context = React.useContext(DashboardKpiCompareContext)
  const { themeName } = useDashboardThemeSelection()
  const theme = useThemeOverrides()
  const themeKpi = ((theme.components || {}) as AnyRecord).Kpi as AnyRecord | undefined
  const props = (element?.props || {}) as AnyRecord
  const styleOverride = props.style && typeof props.style === 'object' ? (props.style as React.CSSProperties) : undefined
  const colorOverride = typeof props.color === 'string' ? props.color : undefined
  const semanticStyle = resolveDashboardTextStyle('kpi-compare', themeName)
  const themeComparisonStyle =
    themeKpi?.comparisonStyle && typeof themeKpi.comparisonStyle === 'object'
      ? (themeKpi.comparisonStyle as React.CSSProperties)
      : undefined

  if (!context?.canRenderComparison) return null

  return (
    <p
      data-ui="kpi-compare"
      style={{
        margin: 0,
        ...semanticStyle,
        ...(themeComparisonStyle || {}),
        ...(context.comparisonStyle || {}),
        ...(styleOverride || {}),
        color: colorOverride || context.comparisonColor,
      }}
    >
      {context.loading ? '...' : context.comparisonText}
    </p>
  )
}

