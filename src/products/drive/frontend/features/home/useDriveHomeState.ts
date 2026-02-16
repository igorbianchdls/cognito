import { useCallback, useEffect, useMemo, useState } from "react"

import type { DriveUploadPanelItem } from "@/products/drive/frontend/components/DriveUploadPanel"
import { uploadDriveFileDirect } from "@/products/drive/frontend/services/uploadDriveFile"
import type { DriveItem } from "@/products/drive/shared/types"
import type { DriveApiResponse, FolderItem, WorkspaceOption } from "@/products/drive/frontend/features/home/types"

export function useDriveHomeState() {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerItems, setViewerItems] = useState<DriveItem[]>([])

  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)

  const [folders, setFolders] = useState<FolderItem[]>([])
  const [recentFiles, setRecentFiles] = useState<DriveItem[]>([])
  const [search, setSearch] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [uploadPanelOpen, setUploadPanelOpen] = useState(true)
  const [uploadPanelItems, setUploadPanelItems] = useState<DriveUploadPanelItem[]>([])
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const activeWorkspaceName = useMemo(() => {
    if (!activeWorkspaceId) return "Documents"
    return workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name || "Documents"
  }, [activeWorkspaceId, workspaces])

  const visibleFiles = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return recentFiles
    return recentFiles.filter((file) => file.name.toLowerCase().includes(query))
  }, [recentFiles, search])

  const openViewer = (items: DriveItem[], index: number) => {
    setViewerItems(items)
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const updateUploadItem = (id: string, patch: Partial<DriveUploadPanelItem>) => {
    setUploadPanelItems((previous) => previous.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const clearFinishedUploads = () => {
    setUploadPanelItems((previous) => previous.filter((item) => item.status !== "completed" && item.status !== "error"))
  }

  const loadDrive = useCallback(async (workspaceId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (workspaceId) params.set("workspace_id", workspaceId)
      const res = await fetch(`/api/drive?${params.toString()}`, { cache: "no-store" })
      const json = (await res.json()) as DriveApiResponse
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `HTTP ${res.status}`)
      }

      const workspaceRows = Array.isArray(json.workspaces) ? json.workspaces : []
      setWorkspaces(workspaceRows)
      setActiveWorkspaceId(json.activeWorkspaceId || workspaceRows[0]?.id || null)
      setFolders(Array.isArray(json.folders) ? json.folders : [])
      setRecentFiles(Array.isArray(json.recentFiles) ? json.recentFiles : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar drive")
      setFolders([])
      setRecentFiles([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDrive()
  }, [loadDrive])

  const onWorkspaceSelect = async (workspaceId: string) => {
    setWorkspaceOpen(false)
    setActiveWorkspaceId(workspaceId)
    await loadDrive(workspaceId)
  }

  const onCreateFolder = async () => {
    if (!activeWorkspaceId || isCreatingFolder) return
    const name = newFolderName.trim()
    if (!name) return

    setIsCreatingFolder(true)
    setError(null)
    try {
      const res = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          name,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Falha ao criar pasta")
      }
      setCreateFolderOpen(false)
      setNewFolderName("")
      await loadDrive(activeWorkspaceId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar pasta")
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const onUploadFiles = async (filesList: FileList | null) => {
    if (!filesList?.length || !activeWorkspaceId) return
    const files = Array.from(filesList)
    const queuedItems: DriveUploadPanelItem[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      status: "queued",
      progress: 0,
      message: "Na fila",
    }))

    setUploadPanelItems((previous) => [...queuedItems, ...previous].slice(0, 50))
    setUploadPanelOpen(true)
    setIsUploading(true)
    setError(null)

    let firstError: string | null = null
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const queueItem = queuedItems[index]
        try {
          await uploadDriveFileDirect({
            workspaceId: activeWorkspaceId,
            file,
            onProgress: (event) => {
              updateUploadItem(queueItem.id, {
                status: event.stage,
                progress: event.progress,
                message: event.message,
              })
            },
          })
          updateUploadItem(queueItem.id, {
            status: "completed",
            progress: 100,
            message: "Upload concluido",
          })
        } catch (e) {
          const message = e instanceof Error ? e.message : `Falha ao enviar ${file.name}`
          if (!firstError) firstError = message
          updateUploadItem(queueItem.id, {
            status: "error",
            message,
          })
        }
      }
      await loadDrive(activeWorkspaceId)
      if (firstError) setError(firstError)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload")
    } finally {
      setIsUploading(false)
    }
  }

  const onDeleteFolder = async (folder: FolderItem) => {
    if (!activeWorkspaceId || deletingFolderId) return
    const confirmed = window.confirm(`Excluir a pasta "${folder.name}" e seus arquivos?`)
    if (!confirmed) return

    setDeletingFolderId(folder.id)
    setError(null)
    try {
      const res = await fetch(`/api/drive/folders/${folder.id}?workspace_id=${activeWorkspaceId}`, {
        method: "DELETE",
      })
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Falha ao excluir pasta")
      }
      await loadDrive(activeWorkspaceId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao excluir pasta")
    } finally {
      setDeletingFolderId(null)
    }
  }

  const onDeleteFile = async (file: DriveItem) => {
    if (!activeWorkspaceId || deletingFileId) return
    const confirmed = window.confirm(`Excluir o arquivo "${file.name}"?`)
    if (!confirmed) return

    setDeletingFileId(file.id)
    setError(null)
    try {
      const res = await fetch(`/api/drive/files/${file.id}?workspace_id=${activeWorkspaceId}`, {
        method: "DELETE",
      })
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Falha ao excluir arquivo")
      }
      await loadDrive(activeWorkspaceId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao excluir arquivo")
    } finally {
      setDeletingFileId(null)
    }
  }

  return {
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
  }
}
