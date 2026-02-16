import { MoreHorizontal, Paperclip, Trash2 } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  avatarInitial,
  formatAddedAt,
  getTypeIcon,
  getTypeLabel,
  inferAddedAt,
  inferAddedBy,
  inferSize,
} from "@/products/drive/frontend/features/shared/filePresentation"
import type { DriveItem } from "@/products/drive/shared/types"

type DriveFolderFilesSectionProps = {
  files: DriveItem[]
  deletingFileId: string | null
  onOpenFile: (index: number) => void
  onDeleteFile: (file: DriveItem) => void | Promise<void>
}

export default function DriveFolderFilesSection({
  files,
  deletingFileId,
  onOpenFile,
  onDeleteFile,
}: DriveFolderFilesSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-white text-[11px] uppercase tracking-[0.04em] text-gray-500">
          <tr className="border-b border-gray-200">
            <th className="w-10 px-3 py-3 text-left">
              <input type="checkbox" className="size-4 rounded border-gray-300" />
            </th>
            <th className="w-[40%] px-3 py-3 text-left font-medium">Name</th>
            <th className="w-[18%] px-3 py-3 text-left font-medium">Date added</th>
            <th className="w-[24%] px-3 py-3 text-left font-medium">Added by</th>
            <th className="w-[12%] px-3 py-3 text-right font-medium">Size</th>
            <th className="w-10 px-3 py-2 text-right" />
          </tr>
        </thead>

        <tbody>
          {files.map((file, index) => {
            const TypeIcon = getTypeIcon(file)
            const addedBy = inferAddedBy(file, index)
            const addedAt = inferAddedAt(file, index)
            const size = inferSize(file, index)

            return (
              <tr
                key={file.id}
                onClick={() => onOpenFile(index)}
                className="cursor-pointer border-t border-gray-100 hover:bg-gray-50/70"
              >
                <td className="px-3 py-3">
                  <input type="checkbox" className="size-4 rounded border-gray-300" />
                </td>
                <td className="px-3 py-3 text-gray-900">
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                      <TypeIcon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {file.name}
                        {file.url ? <Paperclip className="ml-1 inline size-3 text-gray-400" /> : null}
                      </span>
                      <span className="block text-xs text-gray-500">{getTypeLabel(file)}</span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">{formatAddedAt(addedAt)}</td>
                <td className="px-3 py-3 text-gray-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">
                      {avatarInitial(addedBy)}
                    </span>
                    <span className="truncate text-sm">{addedBy}</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-sm text-gray-600">{size}</td>
                <td className="px-3 py-3 text-right text-gray-500">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="inline-flex items-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Acoes do arquivo ${file.name}`}
                      >
                        <MoreHorizontal className="ml-auto size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={deletingFileId === file.id}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void onDeleteFile(file)
                        }}
                      >
                        <Trash2 className="size-4" />
                        {deletingFileId === file.id ? "Excluindo..." : "Excluir arquivo"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
