'use client'

import { useRouter } from 'next/navigation'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ErpModuleId, ErpSectionId } from '@/products/erp/shared/types'
import { ERP_SUMMARY_TAB, getErpSection } from '@/products/erp/shared/navigation'

export function ErpSectionTabs({
  sectionId,
  moduleId,
}: {
  sectionId: ErpSectionId
  moduleId?: ErpModuleId
}) {
  const router = useRouter()
  const section = getErpSection(sectionId)
  // The overview and the reports share one tab bar: Resumo first, then each report.
  const reports = sectionId === 'overview' || sectionId === 'relatorios'
  const modules = reports ? [ERP_SUMMARY_TAB, ...getErpSection('relatorios').modules] : section.modules

  if (modules.length === 0) return null

  return (
    <Tabs value={sectionId === 'overview' ? ERP_SUMMARY_TAB.id : moduleId ?? modules[0]?.id ?? ''} onValueChange={(value) => {
      const nextModule = modules.find((module) => module.id === value)
      if (nextModule) router.push(nextModule.href)
    }}>
      <TabsList variant="underline" className="h-11 gap-6">
        {modules.map((module) => (
          <TabsTrigger
            key={module.id}
            value={module.id}
            variant="underline"
            className="h-11 text-sm"
          >
            {module.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

