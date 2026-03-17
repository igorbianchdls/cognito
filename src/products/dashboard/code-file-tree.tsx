'use client'

import { Icon } from '@iconify/react'

import type { DashboardCodeFile } from '@/products/dashboard/code-files'

function getFileIcon(extension: string) {
  switch (extension) {
    case 'dsl':
      return 'solar:code-file-bold'
    case 'json':
      return 'solar:document-text-bold'
    case 'md':
      return 'solar:notebook-bold'
    default:
      return 'solar:file-bold'
  }
}

export function DashboardCodeFileTree({
  files,
  selectedPath,
  onSelect,
}: {
  files: DashboardCodeFile[]
  selectedPath: string
  onSelect: (path: string) => void
}) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r-[0.5px] border-[#DDDDD8] bg-[#F3F3F1]">
      <div className="border-b-[0.5px] border-[#DDDDD8] px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6C6C68]">
          Explorer
        </div>
        <div className="mt-1 text-[13px] font-medium text-[#262624]">
          dashboard-project
        </div>
      </div>
      <div className="border-b-[0.5px] border-[#DDDDD8] px-3 py-2">
        <div className="flex items-center gap-2 rounded-md bg-[#ECECEB] px-3 py-2 text-[12px] text-[#5D5D59]">
          <Icon icon="solar:folder-with-files-bold" className="h-4 w-4 text-[#7A6BFF]" />
          <span className="font-medium">root</span>
          <span className="ml-auto text-[11px] uppercase tracking-[0.06em] text-[#8A8A85]">
            {files.length} files
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2 py-3">
        {files.map((file) => {
          const isSelected = file.path === selectedPath
          return (
            <button
              key={file.path}
              type="button"
              onClick={() => onSelect(file.path)}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                isSelected
                  ? 'border-[#B8D6FF] bg-[#E7F1FF] text-[#005FCC]'
                  : 'border-transparent text-[#3F3F3D] hover:border-[#E0E0DC] hover:bg-[#ECECEB]'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  isSelected ? 'bg-white text-[#005FCC]' : 'bg-[#E8E8E5] text-[#676763]'
                }`}
              >
                <Icon icon={getFileIcon(file.extension)} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{file.name}</div>
                <div className={`truncate text-[11px] ${isSelected ? 'text-[#4C83C9]' : 'text-[#81817B]'}`}>
                  {file.directory} · {file.language}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
