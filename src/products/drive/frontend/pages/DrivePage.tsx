"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"

import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import DriveUploadPanel from "@/products/drive/frontend/components/DriveUploadPanel"
import DriveViewer from "@/products/drive/frontend/components/DriveViewer"
import DriveFilesSection from "@/products/drive/frontend/features/home/DriveFilesSection"
import DriveFoldersSection from "@/products/drive/frontend/features/home/DriveFoldersSection"
import DriveHomeHeader from "@/products/drive/frontend/features/home/DriveHomeHeader"
import { useDriveHomeState } from "@/products/drive/frontend/features/home/useDriveHomeState"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function DrivePage() {
  const router = useRouter()
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const {
    viewerOpen,
    setViewerOpen,
    viewerIndex,
    setViewerIndex,
    viewerItems,
    openViewer,
    workspaceOpen,
    setWorkspaceOpen,
    workspaces,
    activeWorkspaceId,
    folders,
    search,
    setSearch,
    isLoading,
    isUploading,
    isCreatingFolder,
    deletingFolderId,
    deletingFileId,
    uploadPanelOpen,
    setUploadPanelOpen,
    uploadPanelItems,
    clearFinishedUploads,
    createFolderOpen,
    setCreateFolderOpen,
    newFolderName,
    setNewFolderName,
    error,
    activeWorkspaceName,
    visibleFiles,
    onWorkspaceSelect,
    onCreateFolder,
    onUploadFiles,
    onDeleteFolder,
    onDeleteFile,
  } = useDriveHomeState()

  const onUploadClick = () => {
    if (!activeWorkspaceId || isUploading) return
    uploadInputRef.current?.click()
  }

  const handleUploadFiles = async (files: FileList | null) => {
    await onUploadFiles(files)
    if (uploadInputRef.current) uploadInputRef.current.value = ""
  }

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          <DriveHomeHeader
            activeWorkspaceName={activeWorkspaceName}
            workspaceOpen={workspaceOpen}
            setWorkspaceOpen={setWorkspaceOpen}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceSelect={onWorkspaceSelect}
            search={search}
            setSearch={setSearch}
            onOpenCreateFolder={() => setCreateFolderOpen(true)}
            isCreatingFolder={isCreatingFolder}
            onUploadClick={onUploadClick}
            isUploading={isUploading}
            canUpload={Boolean(activeWorkspaceId)}
            uploadInputRef={uploadInputRef}
            onUploadFiles={handleUploadFiles}
          />

          <div className="min-h-0 overflow-y-auto">
            <div className="w-full px-6 py-6">
              {error ? (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

              <DriveFoldersSection
                isLoading={isLoading}
                folders={folders}
                deletingFolderId={deletingFolderId}
                onOpenFolder={(folderId) => router.push(`/drive/f/${folderId}`)}
                onDeleteFolder={onDeleteFolder}
              />

              <DriveFilesSection
                isLoading={isLoading}
                files={visibleFiles}
                deletingFileId={deletingFileId}
                onOpenFile={(index) => openViewer(visibleFiles, index)}
                onDeleteFile={onDeleteFile}
              />
            </div>
          </div>
        </div>

        {viewerOpen ? (
          <DriveViewer
            items={viewerItems}
            index={viewerIndex}
            onClose={() => setViewerOpen(false)}
            onNavigate={(index) => setViewerIndex(index)}
          />
        ) : null}

        <DriveUploadPanel
          items={uploadPanelItems}
          open={uploadPanelOpen}
          onToggle={() => setUploadPanelOpen(!uploadPanelOpen)}
          onClearFinished={clearFinishedUploads}
        />

        <Dialog
          open={createFolderOpen}
          onOpenChange={(open) => {
            setCreateFolderOpen(open)
            if (!open) setNewFolderName("")
          }}
        >
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Nova pasta</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                void onCreateFolder()
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor="new-folder-name" className="text-sm font-medium text-gray-800">
                  Nome
                </label>
                <Input
                  id="new-folder-name"
                  placeholder="Ex: Contratos 2026"
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  maxLength={120}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateFolderOpen(false)
                    setNewFolderName("")
                  }}
                  disabled={isCreatingFolder}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()}>
                  {isCreatingFolder ? "Criando..." : "Criar pasta"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
