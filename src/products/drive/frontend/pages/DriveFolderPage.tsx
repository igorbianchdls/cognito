"use client"

import { useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import DriveUploadPanel from "@/products/drive/frontend/components/DriveUploadPanel"
import DriveViewer from "@/products/drive/frontend/components/DriveViewer"
import DriveFolderFilesSection from "@/products/drive/frontend/features/folder/DriveFolderFilesSection"
import DriveFolderHeader from "@/products/drive/frontend/features/folder/DriveFolderHeader"
import { useDriveFolderState } from "@/products/drive/frontend/features/folder/useDriveFolderState"

export default function DriveFolderPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()

  const folderId = (params?.id as string) || ""
  const openFileId = String(searchParams.get("openFile") || "").trim()
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const {
    folderName,
    folderWorkspaceId,
    files,
    isLoading,
    isUploading,
    deletingFileId,
    uploadPanelOpen,
    setUploadPanelOpen,
    uploadPanelItems,
    clearFinishedUploads,
    error,
    viewerOpen,
    setViewerOpen,
    viewerIndex,
    setViewerIndex,
    filesCount,
    onUploadFiles,
    onDeleteFile,
  } = useDriveFolderState({ folderId, openFileId })

  const onUploadClick = () => {
    if (!folderId || !folderWorkspaceId || isUploading) return
    uploadInputRef.current?.click()
  }

  const handleUploadFiles = async (filesList: FileList | null) => {
    await onUploadFiles(filesList)
    if (uploadInputRef.current) uploadInputRef.current.value = ""
  }

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          <DriveFolderHeader
            folderName={folderName}
            filesCount={filesCount}
            canUpload={Boolean(folderWorkspaceId)}
            isUploading={isUploading}
            onBack={() => router.push("/drive")}
            onUploadClick={onUploadClick}
            uploadInputRef={uploadInputRef}
            onUploadFiles={handleUploadFiles}
          />

          <div className="min-h-0 overflow-y-auto">
            <div className="px-6 py-3 md:px-6 md:py-4">
              {error ? (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

              {isLoading ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Carregando arquivos...</div>
              ) : files.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Sem arquivos neste folder.</div>
              ) : (
                <DriveFolderFilesSection
                  files={files}
                  deletingFileId={deletingFileId}
                  onOpenFile={(index) => {
                    setViewerIndex(index)
                    setViewerOpen(true)
                  }}
                  onDeleteFile={onDeleteFile}
                />
              )}
            </div>
          </div>
        </div>

        {viewerOpen ? (
          <DriveViewer
            items={files}
            index={viewerIndex}
            onClose={() => setViewerOpen(false)}
            onNavigate={setViewerIndex}
          />
        ) : null}

        <DriveUploadPanel
          items={uploadPanelItems}
          open={uploadPanelOpen}
          onToggle={() => setUploadPanelOpen(!uploadPanelOpen)}
          onClearFinished={clearFinishedUploads}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
