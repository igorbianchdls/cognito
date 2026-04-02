'use client'

import { Icon } from '@iconify/react'
import { useMemo } from 'react'

import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'

function getFileIcon(extension: string) {
  switch (extension) {
    case 'tsx':
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

export function ArtifactWorkspaceFileTree({
  files,
  selectedPath,
  onSelect,
}: {
  files: ArtifactCodeFile[]
  selectedPath: string
  onSelect: (path: string) => void
}) {
  const groups = useMemo(() => {
    const map = new Map<string, ArtifactCodeFile[]>()
    for (const file of files) {
      const key = file.directory || 'root'
      const bucket = map.get(key) || []
      bucket.push(file)
      map.set(key, bucket)
    }
    return Array.from(map.entries())
  }, [files])

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-[#E3E3DF] bg-[#F7F7F6]">
      <div className="flex items-center justify-between border-b border-[#E3E3DF] px-4 py-3">
        <div className="text-[13px] font-medium text-[#2B2B28]">File Explorer</div>
        <div className="flex items-center gap-2 text-[#7B7B76]">
          <Icon icon="solar:add-square-outline" className="h-4 w-4" />
          <Icon icon="solar:folder-add-outline" className="h-4 w-4" />
          <Icon icon="solar:magnifer-outline" className="h-4 w-4" />
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {groups.map(([directory, items]) => (
          <div key={directory} className="mb-1">
            <div className="flex items-center gap-1 px-3 py-1 text-[13px] text-[#4B4B47]">
              <Icon icon="solar:alt-arrow-down-outline" className="h-3 w-3" />
              <Icon icon="solar:folder-with-files-bold" className="h-4 w-4 text-[#E2A93B]" />
              <span>{directory}</span>
            </div>
            <div className="ml-4 border-l border-[#E5E5E1] pl-2">
              {items.map((file) => {
                const isSelected = file.path === selectedPath
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => onSelect(file.path)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] ${
                      isSelected ? 'bg-[#ECECEC] text-[#20201E]' : 'text-[#4E4E4A] hover:bg-[#F0F0EE]'
                    }`}
                  >
                    <Icon icon={getFileIcon(file.extension)} className="h-4 w-4 shrink-0 text-[#6E6E69]" />
                    <span className="truncate">{file.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
