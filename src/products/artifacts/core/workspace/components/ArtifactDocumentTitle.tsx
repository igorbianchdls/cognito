'use client'

import { Icon } from '@iconify/react'

export function ArtifactDocumentTitle({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex shrink-0 items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2">
        <Icon icon="solar:document-bold" className="h-4 w-4 text-[#5F5F5A]" />
      </div>
      <div className="min-w-0">
        <div
          className="truncate text-[16px] font-semibold text-[#1F1F1D]"
          style={{ fontFamily: 'var(--font-eb-garamond), "EB Garamond", serif' }}
        >
          {title}
        </div>
      </div>
    </div>
  )
}
