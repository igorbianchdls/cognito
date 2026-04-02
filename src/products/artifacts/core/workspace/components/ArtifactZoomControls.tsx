'use client'

import { Icon } from '@iconify/react'

export function ArtifactZoomControls({
  zoom,
  onDecrease,
  onIncrease,
}: {
  zoom: number
  onDecrease: () => void
  onIncrease: () => void
}) {
  return (
    <div className="mr-2 flex items-center gap-1 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-0">
      <button
        type="button"
        onClick={onDecrease}
        className="m-[1px] flex items-center rounded-md bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
      >
        <Icon icon="solar:minus-square-bold" className="h-3.5 w-3.5" />
        <span className="sr-only">Zoom menos</span>
      </button>
      <span className="min-w-[56px] text-center text-xs font-medium leading-normal text-[#5F5F5A]">{Math.round(zoom * 100)}%</span>
      <button
        type="button"
        onClick={onIncrease}
        className="m-[1px] flex items-center rounded-md bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
      >
        <Icon icon="solar:add-square-bold" className="h-3.5 w-3.5" />
        <span className="sr-only">Zoom mais</span>
      </button>
    </div>
  )
}

