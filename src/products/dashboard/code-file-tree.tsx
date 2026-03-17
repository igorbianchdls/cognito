'use client'

import type { DashboardCodeFile } from '@/products/dashboard/code-files'

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
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r-[0.5px] border-[#DDDDD8] bg-[#F7F7F6]">
      <div className="border-b-[0.5px] border-[#DDDDD8] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6C6C68]">
        Files
      </div>
      <div className="flex-1 overflow-auto px-2 py-2">
        {files.map((file) => {
          const isSelected = file.path === selectedPath
          return (
            <button
              key={file.path}
              type="button"
              onClick={() => onSelect(file.path)}
              className={`flex w-full items-center rounded-md px-3 py-2 text-left text-[13px] transition ${
                isSelected
                  ? 'bg-[#E7F1FF] text-[#005FCC]'
                  : 'text-[#3F3F3D] hover:bg-[#ECECEB]'
              }`}
            >
              {file.name}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
