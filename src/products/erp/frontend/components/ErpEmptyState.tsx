import { IconInbox } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

export function ErpEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/60 px-6 text-center">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500">
        <IconInbox className="size-5" stroke={1.8} />
      </div>
      <h3 className="text-base font-semibold tracking-normal text-gray-950">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-gray-600">{description}</p>
      <Button className="mt-5" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

