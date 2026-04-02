'use client'

import { Icon } from '@iconify/react'

type ArtifactViewMode = 'preview' | 'code'

export function ArtifactViewModeToggle({
  activeView,
  previewLabel,
  onChange,
}: {
  activeView: ArtifactViewMode
  previewLabel: string
  onChange: (nextView: ArtifactViewMode) => void
}) {
  return (
    <div className="mr-1 flex items-center gap-1 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-0">
      <button
        type="button"
        onClick={() => onChange('preview')}
        className={`m-[1px] flex items-center justify-center rounded-md p-2 transition ${
          activeView === 'preview'
            ? 'bg-white text-[#1F1F1D]'
            : 'bg-[#ECECEB] text-[#5F5F5A] hover:bg-[#E2E2E0] hover:text-[#4F4F4B]'
        }`}
      >
        <Icon icon="solar:eye-bold" className="h-4 w-4" />
        <span className="sr-only">{previewLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('code')}
        className={`m-[1px] flex items-center justify-center rounded-md p-2 transition ${
          activeView === 'code'
            ? 'bg-white text-[#1F1F1D]'
            : 'bg-[#ECECEB] text-[#5F5F5A] hover:bg-[#E2E2E0] hover:text-[#4F4F4B]'
        }`}
      >
        <Icon icon="solar:code-bold" className="h-4 w-4" />
        <span className="sr-only">Visualizar JSX</span>
      </button>
    </div>
  )
}

