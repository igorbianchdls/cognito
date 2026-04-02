'use client'

import { Icon } from '@iconify/react'

export function ArtifactSizeControls({
  minWidth,
  minHeight,
  widthValue,
  heightValue,
  onWidthChange,
  onHeightChange,
  onApply,
  hasPendingChange,
  confirmAriaLabel,
}: {
  minWidth: number
  minHeight: number
  widthValue: string
  heightValue: string
  onWidthChange: (nextValue: string) => void
  onHeightChange: (nextValue: string) => void
  onApply: () => void
  hasPendingChange: boolean
  confirmAriaLabel: string
}) {
  return (
    <div className="mr-2 flex items-center gap-2 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-3 py-2">
      <label className="flex items-center gap-2 text-[12px] font-medium text-[#5F5F5A]">
        <span>W</span>
        <input
          type="number"
          min={minWidth}
          step={10}
          value={widthValue}
          onChange={(event) => onWidthChange(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onApply()
          }}
          className="w-[72px] rounded-md border-[0.5px] border-[#D4D4CF] bg-white px-2 py-1 text-[12px] text-[#1F1F1D] outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-[12px] font-medium text-[#5F5F5A]">
        <span>H</span>
        <input
          type="number"
          min={minHeight}
          step={10}
          value={heightValue}
          onChange={(event) => onHeightChange(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onApply()
          }}
          className="w-[72px] rounded-md border-[0.5px] border-[#D4D4CF] bg-white px-2 py-1 text-[12px] text-[#1F1F1D] outline-none"
        />
      </label>
      {hasPendingChange ? (
        <button
          type="button"
          onClick={onApply}
          className="flex h-7 w-7 items-center justify-center rounded-md border-[0.5px] border-[#D4D4CF] bg-white text-[#245BDB] transition hover:bg-[#F4F8FF]"
          aria-label={confirmAriaLabel}
        >
          <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

