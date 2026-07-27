import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const toneClassName = {
  default: 'border-gray-200 bg-gray-50 text-gray-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function ErpStatusBadge({
  label,
  tone = 'default',
}: {
  label: string
  tone?: keyof typeof toneClassName
}) {
  return (
    <Badge variant="outline" className={cn('rounded-md px-2 py-1 font-medium', toneClassName[tone])}>
      {label}
    </Badge>
  )
}

