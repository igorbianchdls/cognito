import type { ReactNode } from 'react'

import { ErpSectionTabs } from '@/products/erp/frontend/layout/ErpSectionTabs'
import { ErpTopbar } from '@/products/erp/frontend/layout/ErpTopbar'
import type { ErpModuleId, ErpSectionId } from '@/products/erp/shared/types'

export function ErpShell({
  sectionId,
  moduleId,
  children,
}: {
  sectionId: ErpSectionId
  moduleId?: ErpModuleId
  children: ReactNode
}) {
  return (
    <div className="flex h-full overflow-hidden bg-white">
      <div className="flex min-w-0 flex-1 flex-col">
        <ErpTopbar />
        <div className="border-b border-gray-200 px-4 md:px-8">
          <ErpSectionTabs sectionId={sectionId} moduleId={moduleId} />
        </div>
        <main className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
