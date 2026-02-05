"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { Folder, Search, LayoutGrid, List, MoreHorizontal, FileText, Image as ImageIcon, Video, Music2, File } from 'lucide-react'
import DriveViewer from '@/components/drive/DriveViewer'
import type { DriveItem } from '@/components/drive/types'
import { folders as mockFolders, recentItems } from './data.mock'

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
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerItems, setViewerItems] = useState<DriveItem[]>([])

  const openViewer = (items: DriveItem[], index: number) => {
    setViewerItems(items)
    setViewerIndex(index)
    setViewerOpen(true)
  }

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          {/* Top toolbar / breadcrumb */}
          <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto max-w-[1400px] px-6 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Docs / Workspace</div>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Documents</h1>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input className="h-9 w-72 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none ring-0 placeholder:text-gray-400 focus:border-gray-300" placeholder="Search" />
                  </div>
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

          {/* Content */}
          <div className="min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-[1400px] px-6 py-6">
              {/* Folders */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">Folders</h2>
                  <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    <MoreHorizontal className="size-4" />
                    Manage
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mockFolders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => router.push(`/drive/f/${f.id}`)}
                      className="group rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-gray-300 hover:shadow-sm"
                    >
                      <div className="mb-3 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100 p-3">
                        <div className="flex size-16 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-black/5">
                          <Folder className="size-8" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                          {f.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {f.filesCount.toLocaleString()} {f.filesCount === 1 ? 'file' : 'files'}
                        </div>
                        <div className="text-xs text-gray-500">{f.size}</div>
                      </div>
                      <div className="mt-3 h-1 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1 rounded-full bg-gray-400 transition-all group-hover:bg-gray-500"
                          style={{ width: `${Math.min(100, 20 + f.filesCount * 8)}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Recent table */}
              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">Files</h2>
                  <span className="text-xs text-gray-500">{recentItems.length} items</span>
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
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.map((r, i) => {
                        const TypeIcon = getTypeIcon(r)
                        const typeLabel = getTypeLabel(r)
                        const addedBy = inferAddedBy(r, i)
                        const addedAt = inferAddedAt(r, i)
                        const size = inferSize(r, i)
                        return (
                          <tr key={r.id} onClick={() => openViewer(recentItems, i)} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50/70">
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
      </SidebarInset>
    </SidebarProvider>
  )
}
