import type { ReactNode } from 'react'

import { ErpSectionTabs } from '@/products/erp/frontend/layout/ErpSectionTabs'
import type { ErpModuleId, ErpSectionId } from '@/products/erp/shared/types'

export function ErpShell({
  sectionId,
  moduleId,
  hideSectionTabs = false,
  children,
}: {
  sectionId: ErpSectionId
  moduleId?: ErpModuleId
  hideSectionTabs?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex h-full overflow-hidden bg-[#fff]">
      <div className="flex min-w-0 flex-1 flex-col">
        {!hideSectionTabs ? <div className="border-b border-[#e7e7e4] px-5 md:px-8 lg:px-10"><ErpSectionTabs sectionId={sectionId} moduleId={moduleId} /></div> : null}
        <main className="min-h-0 flex-1 overflow-auto">
          <div className={hideSectionTabs ? 'min-h-full w-full' : 'mx-auto min-h-full w-full max-w-7xl px-5 py-6 md:px-8 md:py-8'}>{children}</div>
        </main>
      </div>
    </div>
  )
}
