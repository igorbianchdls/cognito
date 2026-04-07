'use client'

import React from 'react'

import JsonRenderTable from '@/products/bi/json-render/components/Table'
import {
  resolveDashboardTableTheme,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'
import { deepMerge } from '@/stores/ui/json-render/utils'

type AnyRecord = Record<string, any>

const DEFAULT_TABLE_PROPS = {
  pageSize: 10,
  showPagination: true,
  showColumnToggle: true,
  enableSearch: true,
  stickyHeader: true,
  bordered: true,
  rounded: true,
  density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  striped: false,
  editableMode: false,
  editableCells: 'none',
  editableRowActions: {
    allowAdd: false,
    allowDelete: false,
    allowDuplicate: false,
  },
  containerStyle: { borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 8, padding: 12 },
  borderless: false,
} as const

export default function DashboardTable({ element }: { element: any }) {
  const { themeName } = useDashboardThemeSelection()
  const themeProps = resolveDashboardTableTheme(themeName) as AnyRecord
  const mergedElement = {
    ...element,
    props: deepMerge(deepMerge(DEFAULT_TABLE_PROPS as AnyRecord, themeProps), (element?.props || {}) as AnyRecord),
  }

  return <JsonRenderTable element={mergedElement} />
}
