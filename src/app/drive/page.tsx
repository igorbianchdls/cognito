"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { Folder, Search, LayoutGrid, List, MoreHorizontal } from 'lucide-react'
import DriveViewer from '@/components/drive/DriveViewer'
import type { DriveItem } from '@/components/drive/types'
import { folders as mockFolders, recentItems, itemsByFolder } from './data.mock'

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
                  <h2 className="text-sm font-medium text-gray-700">Recent {mockFolders.length}</h2>
                  <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    <MoreHorizontal className="size-4" />
                    Manage
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {mockFolders.map((f) => (
                    <button key={f.id} onClick={() => router.push(`/drive/f/${f.id}`)} className="group rounded-2xl bg-gradient-to-b from-gray-50 to-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                          <Folder className="size-7" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900 group-hover:underline">
                            {f.name}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            {f.filesCount.toLocaleString()} {f.filesCount === 1 ? 'file' : 'files'} • {f.size}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Recent table */}
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-700">Recent</h2>
                  <span className="text-xs text-gray-500">{recentItems.length} items</span>
                </div>
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-gray-50/70 text-xs text-gray-500">
                      <tr>
                        <th className="w-2/5 px-4 py-3 text-left font-medium">
                          <span className="inline-flex items-center gap-2">
                            <input type="checkbox" className="size-4 rounded border-gray-300" />
                            File name
                          </span>
                        </th>
                        <th className="w-1/5 px-4 py-3 text-left font-medium">Date added</th>
                        <th className="w-1/5 px-4 py-3 text-left font-medium">Added by</th>
                        <th className="w-1/5 px-4 py-3 text-left font-medium">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.map((r, i) => (
                        <tr key={r.id} onClick={() => openViewer(recentItems, i)} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50/60">
                          <td className="px-4 py-3 text-gray-900">
                            <span className="inline-flex items-center gap-2">
                              <input type="checkbox" className="size-4 rounded border-gray-300" />
                              <span className="truncate">{r.name}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">—</td>
                          <td className="px-4 py-3 text-gray-600">—</td>
                          <td className="px-4 py-3 text-gray-600">{r.size ?? '—'}</td>
                        </tr>
                      ))}
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
