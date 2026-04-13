'use client'

import { Icon } from '@iconify/react'

import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'

export function ArtifactWorkspaceCodeEditor({
  file,
  selectableFiles,
  selectedSelectablePath,
  onSelectSelectable,
  selectableLabel = 'Arquivo',
  editable = false,
  disabled = false,
  onChange,
}: {
  file: ArtifactCodeFile | undefined
  selectableFiles: ArtifactCodeFile[]
  selectedSelectablePath: string
  onSelectSelectable: (path: string) => void
  selectableLabel?: string
  editable?: boolean
  disabled?: boolean
  onChange?: (content: string) => void
}) {
  const lines = (file?.content ?? '').split('\n')
  const breadcrumbs = file?.path.split('/') ?? []

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#FFFFFF]">
      <div className="border-b border-[#E3E3DF] bg-[#FAFAF8]">
        <div className="flex items-center justify-between gap-3 px-4 pt-2">
          <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-[#E3E3DF] bg-white px-3 py-2 text-[13px] text-[#2B2B28]">
            <Icon icon="solar:code-file-bold" className="h-4 w-4 text-[#6D6D67]" />
            <span>{file?.name ?? 'Sem arquivo'}</span>
            <Icon icon="solar:close-circle-outline" className="h-3.5 w-3.5 text-[#9B9B95]" />
          </div>
          <label className="flex items-center gap-2 pb-2 text-[12px] text-[#6E6E68]">
            <span>{selectableLabel}</span>
            <select
              value={selectedSelectablePath}
              onChange={(event) => onSelectSelectable(event.target.value)}
              className="h-8 rounded-md border border-[#D9D9D4] bg-white px-2 text-[12px] text-[#2B2B28] outline-none"
            >
              {selectableFiles.map((selectableFile) => (
                <option key={selectableFile.path} value={selectableFile.path}>
                  {selectableFile.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2 border-t border-[#ECECE8] px-4 py-2 text-[12px] text-[#7A7A74]">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <Icon icon="solar:alt-arrow-right-outline" className="h-3 w-3" /> : null}
              <span>{crumb}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {editable ? (
          <textarea
            value={file?.content ?? ''}
            onChange={(event) => onChange?.(event.target.value)}
            disabled={disabled}
            spellCheck={false}
            className={`h-full min-h-full w-full resize-none border-0 bg-white px-4 py-4 font-mono text-[13px] leading-7 text-[#2E2E2B] outline-none ${
              disabled ? 'cursor-not-allowed text-[#8A8A84]' : ''
            }`}
          />
        ) : (
          <div className="min-h-full min-w-full w-max bg-white">
            {lines.map((line, index) => (
              <div key={index} className="flex font-mono text-[13px] leading-7">
                <div className="shrink-0 select-none border-r border-[#EFEFEA] px-4 text-right text-[#A0A09A]">
                  {index + 1}
                </div>
                <pre className="px-4 text-[#2E2E2B]">
                  <code>{line || ' '}</code>
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
