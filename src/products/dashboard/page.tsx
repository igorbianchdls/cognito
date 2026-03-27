'use client'

import { DataProvider } from '@/products/bi/json-render/context'
import { DashboardWorkspace } from '@/products/dashboard/workspace/DashboardWorkspace'

export default function DashboardPage() {
  return (
    <DataProvider initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <DashboardWorkspace initialThemeName="dark" />
    </DataProvider>
  )
}
