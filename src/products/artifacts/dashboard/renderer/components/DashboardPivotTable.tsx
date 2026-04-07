'use client'

import React from 'react'

import JsonRenderPivotTable from '@/products/bi/json-render/components/PivotTable'
import {
  resolveDashboardPivotTableTheme,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'
import { deepMerge } from '@/stores/ui/json-render/utils'

type AnyRecord = Record<string, any>

const DEFAULT_PIVOT_TABLE_PROPS = {
  stickyHeader: true,
  bordered: true,
  rounded: true,
  density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  showSubtotals: true,
  showGrandTotals: true,
  defaultExpandedLevels: 1,
  enableExportCsv: false,
  containerStyle: { borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 8 },
} as const

export default function DashboardPivotTable({ element }: { element: any }) {
  const { themeName } = useDashboardThemeSelection()
  const themeProps = resolveDashboardPivotTableTheme(themeName) as AnyRecord
  const mergedElement = {
    ...element,
    props: deepMerge(deepMerge(DEFAULT_PIVOT_TABLE_PROPS as AnyRecord, themeProps), (element?.props || {}) as AnyRecord),
  }

  return <JsonRenderPivotTable element={mergedElement} />
}
