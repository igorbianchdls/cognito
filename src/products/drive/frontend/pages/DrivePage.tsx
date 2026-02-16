"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { Search, LayoutGrid, List, MoreHorizontal, FileText, Image as ImageIcon, Video, Music2, File, ChevronDown, Upload, FolderPlus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import DriveViewer from '@/products/drive/frontend/components/DriveViewer'
import DriveUploadPanel, { type DriveUploadPanelItem } from '@/products/drive/frontend/components/DriveUploadPanel'
import type { DriveItem } from '@/products/drive/shared/types'
import { uploadDriveFileDirect } from '@/products/drive/frontend/services/uploadDriveFile'

type WorkspaceOption = {
  id: string
  name: string
}

type FolderItem = {
  id: string
  name: string
  filesCount: number
  size?: string
}

type DriveApiResponse = {
  success: boolean
  message?: string
  workspaces?: WorkspaceOption[]
  activeWorkspaceId?: string | null
  folders?: FolderItem[]
  recentFiles?: DriveItem[]
}

const FALLBACK_OWNERS = [
  'kevin@mail.com',
  'antowe@gmail.com',
  'igor@creatto.ai',
  'dani@workspace.com',
  'ops@team.io',
]

function getItemType(item: DriveItem): 'image' | 'video' | 'audio' | 'pdf' | 'file' {
  const mime = item.mime || ''
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime === 'application/pdf') return 'pdf'
  return 'file'
}

function getTypeIcon(item: DriveItem) {
  const t = getItemType(item)
  if (t === 'image') return ImageIcon
  if (t === 'video') return Video
  if (t === 'audio') return Music2
  if (t === 'pdf') return FileText
  return File
}

function getTypeLabel(item: DriveItem): string {
  const t = getItemType(item)
  if (t === 'image') return 'Image'
  if (t === 'video') return 'Video'
  if (t === 'audio') return 'Audio'
  if (t === 'pdf') return 'PDF'
  return 'File'
}

function inferSize(item: DriveItem, index: number): string {
  if (item.size) return item.size
  const t = getItemType(item)
  if (t === 'video') return `${(120 + index * 13).toFixed(0)} MB`
  if (t === 'audio') return `${(12 + index * 2).toFixed(0)} MB`
  if (t === 'image') return `${(3.1 + index * 0.4).toFixed(1)} MB`
  if (t === 'pdf') return `${(8.2 + index * 0.9).toFixed(1)} MB`
  return `${(5.5 + index * 0.7).toFixed(1)} MB`
}

function inferAddedAt(item: DriveItem, index: number): string {
  if (item.addedAt) return item.addedAt
  const d = new Date()
  d.setDate(d.getDate() - (index * 2 + 1))
  return d.toISOString()
}

function formatAddedAt(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function inferAddedBy(item: DriveItem, index: number): string {
  return item.addedBy || FALLBACK_OWNERS[index % FALLBACK_OWNERS.length]
}

function avatarInitial(email: string): string {
  return (email.trim()[0] || 'U').toUpperCase()
}

export default function DrivePage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerItems, setViewerItems] = useState<DriveItem[]>([])

  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)

  const [folders, setFolders] = useState<FolderItem[]>([])
  const [recentFiles, setRecentFiles] = useState<DriveItem[]>([])
  const [search, setSearch] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [uploadPanelOpen, setUploadPanelOpen] = useState(true)
  const [uploadPanelItems, setUploadPanelItems] = useState<DriveUploadPanelItem[]>([])
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const activeWorkspaceName = useMemo(() => {
    if (!activeWorkspaceId) return 'Documents'
    return workspaces.find((w) => w.id === activeWorkspaceId)?.name || 'Documents'
  }, [activeWorkspaceId, workspaces])

  const visibleFiles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return recentFiles
    return recentFiles.filter((f) => f.name.toLowerCase().includes(q))
  }, [recentFiles, search])

  const openViewer = (items: DriveItem[], index: number) => {
    setViewerItems(items)
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const updateUploadItem = (id: string, patch: Partial<DriveUploadPanelItem>) => {
    setUploadPanelItems((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  const clearFinishedUploads = () => {
    setUploadPanelItems((prev) => prev.filter((item) => item.status !== 'completed' && item.status !== 'error'))
  }

  const loadDrive = async (workspaceId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (workspaceId) params.set('workspace_id', workspaceId)
      const res = await fetch(`/api/drive?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json() as DriveApiResponse
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `HTTP ${res.status}`)
      }
      const ws = Array.isArray(json.workspaces) ? json.workspaces : []
      setWorkspaces(ws)
      setActiveWorkspaceId(json.activeWorkspaceId || ws[0]?.id || null)
      setFolders(Array.isArray(json.folders) ? json.folders : [])
      setRecentFiles(Array.isArray(json.recentFiles) ? json.recentFiles : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar drive')
      setFolders([])
      setRecentFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDrive()
  }, [])

  const onWorkspaceSelect = async (workspaceId: string) => {
    setWorkspaceOpen(false)
    setActiveWorkspaceId(workspaceId)
    await loadDrive(workspaceId)
  }

  const onUploadClick = () => {
    if (!activeWorkspaceId || isUploading) return
    inputRef.current?.click()
  }

  const onCreateFolder = async () => {
    if (!activeWorkspaceId || isCreatingFolder) return
    const name = newFolderName.trim()
    if (!name) return

    setIsCreatingFolder(true)
    setError(null)
    try {
      const res = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          name,
        }),
      })
      const json = await res.json().catch(() => ({})) as { success?: boolean; message?: string }
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Falha ao criar pasta')
      }
      setCreateFolderOpen(false)
      setNewFolderName('')
      await loadDrive(activeWorkspaceId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar pasta')
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
      status: 'queued',
      progress: 0,
      message: 'Na fila',
    }))

    setUploadPanelItems((prev) => [...queuedItems, ...prev].slice(0, 50))
    setUploadPanelOpen(true)
    setIsUploading(true)
    setError(null)

    let firstError: string | null = null
    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]
        const queueItem = queuedItems[i]
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
            status: 'completed',
            progress: 100,
            message: 'Upload concluído',
          })
        } catch (e) {
          const message = e instanceof Error ? e.message : `Falha ao enviar ${file.name}`
          if (!firstError) firstError = message
          updateUploadItem(queueItem.id, {
            status: 'error',
            message,
          })
        }
      }
      await loadDrive(activeWorkspaceId)
      if (firstError) setError(firstError)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDeleteFolder = async (folder: FolderItem) => {
    if (!activeWorkspaceId || deletingFolderId) return
    const ok = window.confirm(`Excluir a pasta "${folder.name}" e seus arquivos?`)
    if (!ok) return

    setDeletingFolderId(folder.id)
    setError(null)
    try {
      const res = await fetch(`/api/drive/folders/${folder.id}?workspace_id=${activeWorkspaceId}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => ({})) as { success?: boolean; message?: string }
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Falha ao excluir pasta')
      }
      await loadDrive(activeWorkspaceId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao excluir pasta')
    } finally {
      setDeletingFolderId(null)
    }
  }

  const onDeleteFile = async (file: DriveItem) => {
    if (!activeWorkspaceId || deletingFileId) return
    const ok = window.confirm(`Excluir o arquivo "${file.name}"?`)
    if (!ok) return

    setDeletingFileId(file.id)
    setError(null)
    try {
      const res = await fetch(`/api/drive/files/${file.id}?workspace_id=${activeWorkspaceId}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => ({})) as { success?: boolean; message?: string }
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Falha ao excluir arquivo')
      }
      await loadDrive(activeWorkspaceId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao excluir arquivo')
    } finally {
      setDeletingFileId(null)
    }
  }

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          <div className="bg-white">
            <div className="w-full px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-lg font-semibold tracking-tight text-gray-900">{activeWorkspaceName}</h1>
                    <button
                      onClick={() => setWorkspaceOpen((v) => !v)}
                      className="inline-flex items-center justify-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                      aria-label="Selecionar workspace"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                  {workspaceOpen ? (
                    <div className="absolute left-0 top-8 z-20 min-w-[190px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                      {workspaces.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => onWorkspaceSelect(w.id)}
                          className={`block w-full px-3 py-2 text-left text-sm ${
                            w.id === activeWorkspaceId ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {w.name}
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
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setCreateFolderOpen(true)}
                    disabled={!activeWorkspaceId || isCreatingFolder}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 px-3 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FolderPlus className="size-4" />
                    Nova pasta
                  </button>
                  <button
                    onClick={onUploadClick}
                    disabled={!activeWorkspaceId || isUploading}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="size-4" />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => onUploadFiles(e.target.files)}
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

          <div className="min-h-0 overflow-y-auto">
            <div className="w-full px-6 py-6">
              {error ? (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

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
                    {folders.map((f) => (
                      <div key={f.id} className="group relative w-full text-center">
                        <button
                          onClick={() => router.push(`/drive/f/${f.id}`)}
                          className="w-full"
                        >
                          <Image
                            src="/folder-blue.svg"
                            alt=""
                            aria-hidden="true"
                            width={512}
                            height={512}
                            className="h-36 w-full object-contain transition group-hover:scale-[1.02]"
                          />
                          <div className="mt-2 min-w-0">
                            <div className="truncate text-center text-[14px] font-semibold text-gray-900">{f.name}</div>
                            <div className="mt-0.5 text-center text-sm text-gray-500">
                              {Number(f.filesCount || 0).toLocaleString()} {Number(f.filesCount || 0) === 1 ? 'file' : 'files'}
                            </div>
                          </div>
                        </button>
                        <div className="absolute right-1 top-0 opacity-0 transition group-hover:opacity-100">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="inline-flex items-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Ações da pasta ${f.name}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={deletingFolderId === f.id}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  void onDeleteFolder(f)
                                }}
                              >
                                <Trash2 className="size-4" />
                                {deletingFolderId === f.id ? 'Excluindo...' : 'Excluir pasta'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-800">Files</h2>
                  <span className="text-xs text-gray-500">{visibleFiles.length} items</span>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-white text-[11px] uppercase tracking-[0.04em] text-gray-500">
                      <tr className="border-b border-gray-200">
                        <th className="w-[44%] px-4 py-3 text-left font-medium">
                          <span className="inline-flex items-center gap-2">
                            <input type="checkbox" className="size-4 rounded border-gray-300" />
                            Name
                          </span>
                        </th>
                        <th className="w-[20%] px-4 py-3 text-left font-medium">Date added</th>
                        <th className="w-[24%] px-4 py-3 text-left font-medium">Added by</th>
                        <th className="w-[12%] px-4 py-3 text-right font-medium">Size</th>
                        <th className="w-12 px-2 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Carregando arquivos...</td>
                        </tr>
                      ) : visibleFiles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Nenhum arquivo encontrado.</td>
                        </tr>
                      ) : visibleFiles.map((r, i) => {
                        const TypeIcon = getTypeIcon(r)
                        const typeLabel = getTypeLabel(r)
                        const addedBy = inferAddedBy(r, i)
                        const addedAt = inferAddedAt(r, i)
                        const size = inferSize(r, i)
                        return (
                          <tr key={r.id} onClick={() => openViewer(visibleFiles, i)} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50/70">
                            <td className="px-4 py-3 text-gray-900">
                              <span className="inline-flex min-w-0 items-center gap-2.5">
                                <input type="checkbox" className="size-4 rounded border-gray-300" />
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                                  <TypeIcon className="size-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium text-gray-900">{r.name}</span>
                                  <span className="block text-xs text-gray-500">{typeLabel}</span>
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatAddedAt(addedAt)}</td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className="inline-flex items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">
                                  {avatarInitial(addedBy)}
                                </span>
                                <span className="truncate text-sm">{addedBy}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">{size}</td>
                            <td className="px-2 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="inline-flex items-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Ações do arquivo ${r.name}`}
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    variant="destructive"
                                    disabled={deletingFileId === r.id}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      void onDeleteFile(r)
                                    }}
                                  >
                                    <Trash2 className="size-4" />
                                    {deletingFileId === r.id ? 'Excluindo...' : 'Excluir arquivo'}
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
              </section>
            </div>
          </div>
        </div>
        {viewerOpen && (
          <DriveViewer
            items={viewerItems}
            index={viewerIndex}
            onClose={() => setViewerOpen(false)}
            onNavigate={(idx) => setViewerIndex(idx)}
          />
        )}
        <DriveUploadPanel
          items={uploadPanelItems}
          open={uploadPanelOpen}
          onToggle={() => setUploadPanelOpen((v) => !v)}
          onClearFinished={clearFinishedUploads}
        />
        <Dialog open={createFolderOpen} onOpenChange={(open) => {
          setCreateFolderOpen(open)
          if (!open) setNewFolderName('')
        }}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Nova pasta</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                void onCreateFolder()
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor="new-folder-name" className="text-sm font-medium text-gray-800">Nome</label>
                <Input
                  id="new-folder-name"
                  placeholder="Ex: Contratos 2026"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
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
                    setNewFolderName('')
                  }}
                  disabled={isCreatingFolder}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()}>
                  {isCreatingFolder ? 'Criando...' : 'Criar pasta'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
