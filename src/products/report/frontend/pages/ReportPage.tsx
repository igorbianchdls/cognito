'use client'

import { DataProvider } from '@/products/bi/json-render/context'
import { ReportWorkspace } from '@/products/report/workspace/ReportWorkspace'

export default function ReportPage() {
  return (
    <DataProvider initialData={{ ui: {}, filters: {}, report: {} }}>
      <ReportWorkspace />
    </DataProvider>
  )
}
