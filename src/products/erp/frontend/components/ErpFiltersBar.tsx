import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ERP_STATUS_ALL_VALUE } from '@/products/erp/shared/constants'
import type { ErpEntityFilter } from '@/products/erp/shared/types'

export function ErpFiltersBar({
  filters,
  values,
  onChange,
}: {
  filters: ErpEntityFilter[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={values[filter.key] ?? ERP_STATUS_ALL_VALUE}
          onValueChange={(value) => onChange(filter.key, value)}
        >
          <SelectTrigger aria-label={filter.label} className="h-10 min-w-[168px] border border-[#dfdfdc] bg-white text-sm shadow-none">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ERP_STATUS_ALL_VALUE}>{filter.allLabel}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}
