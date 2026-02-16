import { type RefObject } from "react"
import { ChevronDown, FolderPlus, LayoutGrid, List, Search, Upload } from "lucide-react"

import type { WorkspaceOption } from "@/products/drive/frontend/features/home/types"

type DriveHomeHeaderProps = {
  activeWorkspaceName: string
  workspaceOpen: boolean
  setWorkspaceOpen: (open: boolean) => void
  workspaces: WorkspaceOption[]
  activeWorkspaceId: string | null
  onWorkspaceSelect: (workspaceId: string) => void | Promise<void>
  search: string
  setSearch: (value: string) => void
  onOpenCreateFolder: () => void
  isCreatingFolder: boolean
  onUploadClick: () => void
  isUploading: boolean
  canUpload: boolean
  uploadInputRef: RefObject<HTMLInputElement | null>
  onUploadFiles: (files: FileList | null) => void | Promise<void>
}

export default function DriveHomeHeader({
  activeWorkspaceName,
  workspaceOpen,
  setWorkspaceOpen,
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  search,
  setSearch,
  onOpenCreateFolder,
  isCreatingFolder,
  onUploadClick,
  isUploading,
  canUpload,
  uploadInputRef,
  onUploadFiles,
}: DriveHomeHeaderProps) {
  return (
    <div className="bg-white">
      <div className="w-full px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-semibold tracking-tight text-gray-900">{activeWorkspaceName}</h1>
              <button
                onClick={() => setWorkspaceOpen(!workspaceOpen)}
                className="inline-flex items-center justify-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                aria-label="Selecionar workspace"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
            {workspaceOpen ? (
              <div className="absolute left-0 top-8 z-20 min-w-[190px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      void onWorkspaceSelect(workspace.id)
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      workspace.id === activeWorkspaceId
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {workspace.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                className="h-9 w-72 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none ring-0 placeholder:text-gray-400 focus:border-gray-300"
                placeholder="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <button
              onClick={onOpenCreateFolder}
              disabled={!canUpload || isCreatingFolder}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 px-3 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FolderPlus className="size-4" />
              Nova pasta
            </button>

            <button
              onClick={onUploadClick}
              disabled={!canUpload || isUploading}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="size-4" />
              {isUploading ? "Uploading..." : "Upload"}
            </button>

            <input
              ref={uploadInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void onUploadFiles(event.target.files)
              }}
            />

            <div className="hidden items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 md:flex">
              <button className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                <List className="size-4" />
                List View
              </button>
              <button className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1.5 text-xs text-gray-900">
                <LayoutGrid className="size-4" />
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
