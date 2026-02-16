import Image from "next/image"
import { MoreHorizontal, Trash2 } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { FolderItem } from "@/products/drive/frontend/features/home/types"

type DriveFoldersSectionProps = {
  isLoading: boolean
  folders: FolderItem[]
  deletingFolderId: string | null
  onOpenFolder: (folderId: string) => void
  onDeleteFolder: (folder: FolderItem) => void | Promise<void>
}

export default function DriveFoldersSection({
  isLoading,
  folders,
  deletingFolderId,
  onOpenFolder,
  onDeleteFolder,
}: DriveFoldersSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Folders</h2>
        <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-10 text-sm text-gray-500">Carregando pastas...</div>
      ) : folders.length === 0 ? (
        <div className="py-10 text-sm text-gray-500">Nenhuma pasta encontrada.</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {folders.map((folder) => (
            <div key={folder.id} className="group relative w-full text-center">
              <button onClick={() => onOpenFolder(folder.id)} className="w-full">
                <Image
                  src="/folder-blue.svg"
                  alt=""
                  aria-hidden="true"
                  width={512}
                  height={512}
                  className="h-36 w-full object-contain transition group-hover:scale-[1.02]"
                />
                <div className="mt-2 min-w-0">
                  <div className="truncate text-center text-[14px] font-semibold text-gray-900">{folder.name}</div>
                  <div className="mt-0.5 text-center text-sm text-gray-500">
                    {Number(folder.filesCount || 0).toLocaleString()} {Number(folder.filesCount || 0) === 1 ? "file" : "files"}
                  </div>
                </div>
              </button>

              <div className="absolute right-1 top-0 opacity-0 transition group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Acoes da pasta ${folder.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={deletingFolderId === folder.id}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        void onDeleteFolder(folder)
                      }}
                    >
                      <Trash2 className="size-4" />
                      {deletingFolderId === folder.id ? "Excluindo..." : "Excluir pasta"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
