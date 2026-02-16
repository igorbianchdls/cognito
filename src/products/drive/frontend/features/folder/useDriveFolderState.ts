import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { DriveUploadPanelItem } from "@/products/drive/frontend/components/DriveUploadPanel"
import { uploadDriveFileDirect } from "@/products/drive/frontend/services/uploadDriveFile"
import type { FolderApiResponse } from "@/products/drive/frontend/features/folder/types"
import type { DriveItem } from "@/products/drive/shared/types"

type UseDriveFolderStateParams = {
  folderId: string
  openFileId?: string
}

export function useDriveFolderState({ folderId, openFileId }: UseDriveFolderStateParams) {
  const autoOpenedFileRef = useRef<string>("")

  const [folderName, setFolderName] = useState("Folder")
  const [folderWorkspaceId, setFolderWorkspaceId] = useState<string | null>(null)
  const [files, setFiles] = useState<DriveItem[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [uploadPanelOpen, setUploadPanelOpen] = useState(true)
  const [uploadPanelItems, setUploadPanelItems] = useState<DriveUploadPanelItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const updateUploadItem = (id: string, patch: Partial<DriveUploadPanelItem>) => {
    setUploadPanelItems((previous) => previous.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const clearFinishedUploads = () => {
    setUploadPanelItems((previous) => previous.filter((item) => item.status !== "completed" && item.status !== "error"))
  }

  const loadFolder = useCallback(async (id: string) => {
    const res = await fetch(`/api/drive/folders/${id}`, { cache: "no-store" })
    const json = (await res.json()) as FolderApiResponse
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || `HTTP ${res.status}`)
    }
    return json
  }, [])

  useEffect(() => {
    if (!folderId) return
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const json = await loadFolder(folderId)
        if (!cancelled) {
          setFolderName(json.folder?.name || "Folder")
          setFolderWorkspaceId(json.folder?.workspaceId || null)
          setFiles(Array.isArray(json.files) ? json.files : [])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao carregar pasta")
          setFiles([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [folderId, loadFolder])

  useEffect(() => {
    if (!openFileId || files.length === 0) return
    if (autoOpenedFileRef.current === openFileId) return
    const index = files.findIndex((file) => file.id === openFileId)
    if (index >= 0) {
      autoOpenedFileRef.current = openFileId
      openViewer(index)
    }
  }, [files, openFileId])

  const onUploadFiles = async (list: FileList | null) => {
    if (!list?.length || !folderId || !folderWorkspaceId) return
    const nextFiles = Array.from(list)
    const queuedItems: DriveUploadPanelItem[] = nextFiles.map((file, index) => ({
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
      for (let index = 0; index < nextFiles.length; index += 1) {
        const file = nextFiles[index]
        const queueItem = queuedItems[index]
        try {
          await uploadDriveFileDirect({
            workspaceId: folderWorkspaceId,
            folderId,
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
      const fresh = await loadFolder(folderId)
      setFolderName(fresh.folder?.name || "Folder")
      setFolderWorkspaceId(fresh.folder?.workspaceId || null)
      setFiles(Array.isArray(fresh.files) ? fresh.files : [])
      if (firstError) setError(firstError)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload")
    } finally {
      setIsUploading(false)
    }
  }

  const onDeleteFile = async (file: DriveItem) => {
    if (!folderWorkspaceId || deletingFileId) return
    const confirmed = window.confirm(`Excluir o arquivo "${file.name}"?`)
    if (!confirmed) return

    setDeletingFileId(file.id)
    setError(null)
    try {
      const res = await fetch(`/api/drive/files/${file.id}?workspace_id=${folderWorkspaceId}`, {
        method: "DELETE",
      })
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Falha ao excluir arquivo")
      }
      const fresh = await loadFolder(folderId)
      setFolderName(fresh.folder?.name || "Folder")
      setFolderWorkspaceId(fresh.folder?.workspaceId || null)
      setFiles(Array.isArray(fresh.files) ? fresh.files : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao excluir arquivo")
    } finally {
      setDeletingFileId(null)
    }
  }

  const filesCount = useMemo(() => files.length, [files])

  return {
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
  }
}
