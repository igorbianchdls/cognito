"use client"

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import DriveViewer from '@/components/drive/DriveViewer'
import type { DriveItem } from '@/components/drive/types'
import { folders, itemsByFolder } from '../../data.mock'
import { ArrowLeft, File, FileText, Image as ImageIcon, Video, Music, MoreHorizontal, Paperclip } from 'lucide-react'

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
            <div className="px-3 md:px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push('/drive')} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"><ArrowLeft className="mr-1 inline size-3" /> Voltar</button>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{folder?.name || 'Folder'}</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto">
            <div className="px-2 md:px-3 py-3">
              {files.length === 0 ? (
                <div className="text-sm text-gray-500">Sem arquivos neste folder.</div>
              ) : (
                <div className="bg-white">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-gray-50/80 text-xs text-gray-500">
                      <tr>
                        <th className="w-10 px-3 py-2 text-left"><input type="checkbox" className="size-4 rounded border-gray-300" /></th>
                        <th className="px-3 py-2 text-left">Nome</th>
                        <th className="w-40 px-3 py-2 text-left">Tipo</th>
                        <th className="w-40 px-3 py-2 text-left">Proprietário</th>
                        <th className="w-40 px-3 py-2 text-left">Local</th>
                        <th className="w-24 px-3 py-2 text-right">Tamanho</th>
                        <th className="w-10 px-3 py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((f, i) => (
                        <tr key={f.id} onClick={() => openViewer(i)} className="cursor-pointer border-t hover:bg-gray-50/60">
                          <td className="px-3 py-2"><input type="checkbox" className="size-4 rounded border-gray-300" /></td>
                          <td className="truncate px-3 py-2 text-gray-900">
                            <span className="inline-flex items-center gap-2">
                              <FileIcon mime={f.mime} />
                              <span className="truncate">{f.name}</span>
                              {f.url && <Paperclip className="size-3 text-gray-400" />}
                            </span>
                          </td>
                          <td className="truncate px-3 py-2 text-gray-600">{f.mime || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-flex size-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">
                                {(f.addedBy || 'eu').split(' ').map(s=>s[0]).join('').slice(0,2)}
                              </span>
                              {f.addedBy || 'eu'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600">Meu Drive</td>
                          <td className="px-3 py-2 text-right text-gray-600">{f.size || '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-500"><MoreHorizontal className="ml-auto size-4" /></td>
                        </tr>
                      ))}
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
