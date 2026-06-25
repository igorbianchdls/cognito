'use client'

import React from 'react'

export type DashboardKpiCompareContextValue = {
  canRenderComparison: boolean
  comparisonColor: string
  comparisonStyle?: React.CSSProperties
  comparisonText: string
  loading: boolean
}

export const DashboardKpiCompareContext = React.createContext<DashboardKpiCompareContextValue | null>(null)

