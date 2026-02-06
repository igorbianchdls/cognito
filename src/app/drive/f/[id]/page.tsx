"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import DriveViewer from '@/components/drive/DriveViewer'
import DriveUploadPanel, { type DriveUploadPanelItem } from '@/components/drive/DriveUploadPanel'
import type { DriveItem } from '@/components/drive/types'
import { uploadDriveFileDirect } from '../../upload.client'
import { ArrowLeft, File, FileText, Image as ImageIcon, Video, Music, MoreHorizontal, Paperclip, Upload, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type FolderApiResponse = {
  success: boolean
  message?: string
  folder?: {
    id: string
    name: string
    workspaceId: string
  }
  files?: DriveItem[]
}

const FALLBACK_OWNERS = [
  'kevin@mail.com',
  'antowe@gmail.com',
  'igor@creatto.ai',
  'dani@workspace.com',
  'ops@team.io',
]

export default function DriveFolderPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const folderId = (params?.id as string) || ''
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [folderName, setFolderName] = useState('Folder')
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

  const openViewer = (index: number) => { setViewerIndex(index); setViewerOpen(true) }

  const updateUploadItem = (id: string, patch: Partial<DriveUploadPanelItem>) => {
    setUploadPanelItems((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  const clearFinishedUploads = () => {
    setUploadPanelItems((prev) => prev.filter((item) => item.status !== 'completed' && item.status !== 'error'))
  }

  const loadFolder = async (id: string) => {
    const res = await fetch(`/api/drive/folders/${id}`, { cache: 'no-store' })
    const json = await res.json() as FolderApiResponse
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || `HTTP ${res.status}`)
    }
    return json
  }

  useEffect(() => {
    if (!folderId) return
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const json = await loadFolder(folderId)
        if (!cancelled) {
          setFolderName(json.folder?.name || 'Folder')
          setFolderWorkspaceId(json.folder?.workspaceId || null)
          setFiles(Array.isArray(json.files) ? json.files : [])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Falha ao carregar pasta')
          setFiles([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [folderId])

  const filesCount = useMemo(() => files.length, [files])

  const onUploadClick = () => {
    if (!folderId || !folderWorkspaceId || isUploading) return
    fileInputRef.current?.click()
  }

  const onUploadFiles = async (list: FileList | null) => {
    if (!list?.length || !folderId || !folderWorkspaceId) return
    const files = Array.from(list)
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
      const fresh = await loadFolder(folderId)
      setFolderName(fresh.folder?.name || 'Folder')
      setFolderWorkspaceId(fresh.folder?.workspaceId || null)
      setFiles(Array.isArray(fresh.files) ? fresh.files : [])
      if (firstError) setError(firstError)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onDeleteFile = async (file: DriveItem) => {
    if (!folderWorkspaceId || deletingFileId) return
    const ok = window.confirm(`Excluir o arquivo "${file.name}"?`)
    if (!ok) return

    setDeletingFileId(file.id)
    setError(null)
    try {
      const res = await fetch(`/api/drive/files/${file.id}?workspace_id=${folderWorkspaceId}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => ({})) as { success?: boolean; message?: string }
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Falha ao excluir arquivo')
      }
      const fresh = await loadFolder(folderId)
      setFolderName(fresh.folder?.name || 'Folder')
      setFolderWorkspaceId(fresh.folder?.workspaceId || null)
      setFiles(Array.isArray(fresh.files) ? fresh.files : [])
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
          <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="px-2 py-2 md:px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push('/drive')} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><ArrowLeft className="mr-1 inline size-3" /> Voltar</button>
                  <h1 className="text-lg font-semibold tracking-tight text-gray-900">{folderName}</h1>
                  <span className="text-xs text-gray-500">{filesCount} {filesCount === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onUploadClick}
                    disabled={!folderWorkspaceId || isUploading}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="size-3.5" />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => onUploadFiles(e.target.files)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto">
            <div className="px-3 py-3 md:px-4 md:py-4">
              {error ? (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}
              {isLoading ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Carregando arquivos...</div>
              ) : files.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Sem arquivos neste folder.</div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-white text-[11px] uppercase tracking-[0.04em] text-gray-500">
                      <tr className="border-b border-gray-200">
                        <th className="w-10 px-3 py-3 text-left"><input type="checkbox" className="size-4 rounded border-gray-300" /></th>
                        <th className="w-[40%] px-3 py-3 text-left font-medium">Name</th>
                        <th className="w-[18%] px-3 py-3 text-left font-medium">Date added</th>
                        <th className="w-[24%] px-3 py-3 text-left font-medium">Added by</th>
                        <th className="w-[12%] px-3 py-3 text-right font-medium">Size</th>
                        <th className="w-10 px-3 py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((f, i) => {
                        const addedBy = inferAddedBy(f, i)
                        const addedAt = inferAddedAt(f, i)
                        const size = inferSize(f, i)
                        return (
                          <tr key={f.id} onClick={() => openViewer(i)} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50/70">
                            <td className="px-3 py-3"><input type="checkbox" className="size-4 rounded border-gray-300" /></td>
                            <td className="px-3 py-3 text-gray-900">
                              <span className="inline-flex min-w-0 items-center gap-2.5">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                                  <FileIcon mime={f.mime} />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium text-gray-900">
                                    {f.name}
                                    {f.url ? <Paperclip className="ml-1 inline size-3 text-gray-400" /> : null}
                                  </span>
                                  <span className="block text-xs text-gray-500">{getTypeLabel(f.mime)}</span>
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
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Ações do arquivo ${f.name}`}
                                  >
                                    <MoreHorizontal className="ml-auto size-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    variant="destructive"
                                    disabled={deletingFileId === f.id}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      void onDeleteFile(f)
                                    }}
                                  >
                                    <Trash2 className="size-4" />
                                    {deletingFileId === f.id ? 'Excluindo...' : 'Excluir arquivo'}
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
              )}
            </div>
          </div>
        </div>
        {viewerOpen && (
          <DriveViewer items={files} index={viewerIndex} onClose={() => setViewerOpen(false)} onNavigate={setViewerIndex} />
        )}
        <DriveUploadPanel
          items={uploadPanelItems}
          open={uploadPanelOpen}
          onToggle={() => setUploadPanelOpen((v) => !v)}
          onClearFinished={clearFinishedUploads}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}

function FileIcon({ mime }: { mime?: string }) {
  if (!mime) return <File className="size-4 text-gray-500" />
  if (/^image\//i.test(mime)) return <ImageIcon className="size-4 text-blue-500" />
  if (/^video\//i.test(mime)) return <Video className="size-4 text-purple-500" />
  if (/^audio\//i.test(mime)) return <Music className="size-4 text-emerald-500" />
  if (/pdf$/i.test(mime)) return <FileText className="size-4 text-red-500" />
  if (/text\//i.test(mime)) return <FileText className="size-4 text-gray-500" />
  return <File className="size-4 text-gray-500" />
}

function getTypeLabel(mime?: string): string {
  if (!mime) return 'File'
  if (/^image\//i.test(mime)) return 'Image'
  if (/^video\//i.test(mime)) return 'Video'
  if (/^audio\//i.test(mime)) return 'Audio'
  if (/pdf$/i.test(mime)) return 'PDF'
  return 'File'
}

function inferSize(item: DriveItem, index: number): string {
  if (item.size) return item.size
  if (/^video\//i.test(item.mime || '')) return `${(120 + index * 13).toFixed(0)} MB`
  if (/^audio\//i.test(item.mime || '')) return `${(12 + index * 2).toFixed(0)} MB`
  if (/^image\//i.test(item.mime || '')) return `${(3.1 + index * 0.4).toFixed(1)} MB`
  if (/pdf$/i.test(item.mime || '')) return `${(8.2 + index * 0.9).toFixed(1)} MB`
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
