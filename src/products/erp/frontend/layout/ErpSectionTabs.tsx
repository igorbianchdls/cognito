'use client'

import { useRouter } from 'next/navigation'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ErpModuleId, ErpSectionId } from '@/products/erp/shared/types'
import { getErpSection } from '@/products/erp/shared/navigation'

export function ErpSectionTabs({
  sectionId,
  moduleId,
}: {
  sectionId: ErpSectionId
  moduleId?: ErpModuleId
}) {
  const router = useRouter()
  const section = getErpSection(sectionId)

  if (section.modules.length === 0) return null

  return (
    <Tabs value={moduleId ?? section.modules[0]?.id ?? ''} onValueChange={(value) => {
      const nextModule = section.modules.find((module) => module.id === value)
      if (nextModule) router.push(nextModule.href)
    }}>
      <TabsList variant="underline" className="h-11 gap-6">
        {section.modules.map((module) => (
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

