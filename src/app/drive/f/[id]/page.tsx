"use client"

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import DriveViewer from '@/components/drive/DriveViewer'
import type { DriveItem } from '@/components/drive/types'
import { folders, itemsByFolder } from '../../data.mock'
import { ArrowLeft, File, FileText, Image as ImageIcon, Video, Music, MoreHorizontal, Paperclip } from 'lucide-react'

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
  const folder = useMemo(() => folders.find(f => f.id === folderId), [folderId])
  const files = useMemo<DriveItem[]>(() => itemsByFolder[folderId] || [], [folderId])

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const openViewer = (index: number) => { setViewerIndex(index); setViewerOpen(true) }

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="px-2 md:px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push('/drive')} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><ArrowLeft className="mr-1 inline size-3" /> Voltar</button>
                  <h1 className="text-lg font-semibold tracking-tight text-gray-900">{folder?.name || 'Folder'}</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto">
            <div className="px-3 py-3 md:px-4 md:py-4">
              {files.length === 0 ? (
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
                            <td className="px-3 py-3 text-right text-gray-500"><MoreHorizontal className="ml-auto size-4" /></td>
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
