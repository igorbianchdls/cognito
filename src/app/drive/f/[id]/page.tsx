"use client"

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import DriveViewer from '@/components/drive/DriveViewer'
import type { DriveItem } from '@/components/drive/types'
import { folders, itemsByFolder } from '../../data.mock'
import { Folder, ArrowLeft } from 'lucide-react'

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
            <div className="mx-auto max-w-[1400px] px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push('/drive')} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"><ArrowLeft className="mr-1 inline size-3" /> Voltar</button>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{folder?.name || 'Folder'}</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-[1400px] px-6 py-6">
              {files.length === 0 ? (
                <div className="text-sm text-gray-500">Sem arquivos neste folder.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {files.map((f, i) => (
                    <button key={f.id} onClick={() => openViewer(i)} className="group rounded-2xl bg-gradient-to-b from-gray-50 to-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                          <Folder className="size-7" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900 group-hover:underline">{f.name}</div>
                          <div className="mt-0.5 text-xs text-gray-500">{f.mime}</div>
                        </div>
                      </div>
                    </button>
                  ))}
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

