import { IconCalendar, IconChevronDown, IconDatabase } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

export function ErpTopbar() {
  return (
    <div className="flex min-h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-950">Otto ERP</div>
        <div className="text-xs text-gray-500">Ambiente mockado para validacao de fluxos</div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          <IconCalendar className="size-4" stroke={1.8} />
          Julho 2026
        </Button>
        <Button variant="outline" size="sm">
          <IconDatabase className="size-4" stroke={1.8} />
          Demo
          <IconChevronDown className="size-4" stroke={1.8} />
        </Button>
      </div>
    </div>
  )
}

