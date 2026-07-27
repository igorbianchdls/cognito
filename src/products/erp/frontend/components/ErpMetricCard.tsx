import type { ErpMetric } from '@/products/erp/shared/types'
import { cn } from '@/lib/utils'

const metricToneClassName = {
  default: 'border-gray-200 bg-white',
  success: 'border-emerald-200 bg-emerald-50/70',
  warning: 'border-amber-200 bg-amber-50/70',
  danger: 'border-rose-200 bg-rose-50/70',
}

export function ErpMetricCard({ metric }: { metric: ErpMetric }) {
  return (
    <div className={cn('rounded-md border p-4', metricToneClassName[metric.tone ?? 'default'])}>
      <div className="text-xs font-medium uppercase tracking-normal text-gray-500">{metric.label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-normal text-gray-950">{metric.value}</div>
      <div className="mt-1 text-sm text-gray-600">{metric.detail}</div>
    </div>
  )
}

