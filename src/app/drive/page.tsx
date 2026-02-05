"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { Folder, Search, LayoutGrid, List, MoreHorizontal } from 'lucide-react'

type FolderItem = {
  id: string
  name: string
  files: number
  size: string
}

type RecentFile = {
  id: string
  name: string
  dateAdded: string
  addedBy: string
  size: string
}

const folders: FolderItem[] = [
  { id: 'f1', name: 'Brand Assets', files: 12, size: '732 MB' },
  { id: 'f2', name: 'Neuralink Space', files: 8020, size: '22.7 GB' },
  { id: 'f3', name: 'Olympic Games', files: 78, size: '3.9 GB' },
  { id: 'f4', name: 'Design System', files: 45, size: '1.4 GB' },
  { id: 'f5', name: 'Contracts', files: 32, size: '918 MB' },
  { id: 'f6', name: 'Sprint Docs', files: 21, size: '403 MB' },
]

const recent: RecentFile[] = [
  { id: 'r1', name: 'Brand Book v2.1', dateAdded: 'Seg, 25 Ago 2025', addedBy: 'Alison C', size: '4.2 MB' },
  { id: 'r2', name: 'UX Report Q3 2025', dateAdded: 'Sex, 01 Set 2025', addedBy: 'Jordan L', size: '3.1 MB' },
  { id: 'r3', name: 'Market Analysis 2025', dateAdded: 'Ter, 05 Set 2025', addedBy: 'Sophia M', size: '1.8 MB' },
  { id: 'r4', name: 'Roadmap Outline 2026', dateAdded: 'Qua, 10 Set 2025', addedBy: 'Michael S', size: '2.6 MB' },
  { id: 'r5', name: 'Design Spec v3', dateAdded: 'Qui, 25 Set 2025', addedBy: 'Alex P', size: '5.0 MB' },
]

export default function DrivePage() {
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
                  <h2 className="text-sm font-medium text-gray-700">Recent 6</h2>
                  <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    <MoreHorizontal className="size-4" />
                    Manage
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {folders.map((f) => (
                    <button key={f.id} className="group rounded-2xl bg-gradient-to-b from-gray-50 to-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                          <Folder className="size-7" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900 group-hover:underline">
                            {f.name}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            {f.files.toLocaleString()} {f.files === 1 ? 'file' : 'files'} • {f.size}
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
                  <span className="text-xs text-gray-500">{recent.length} items</span>
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
                      {recent.map((r, i) => (
                        <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                          <td className="px-4 py-3 text-gray-900">
                            <span className="inline-flex items-center gap-2">
                              <input type="checkbox" className="size-4 rounded border-gray-300" />
                              <span className="truncate">{r.name}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{r.dateAdded}</td>
                          <td className="px-4 py-3 text-gray-600">
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-violet-200 text-[10px] font-semibold text-gray-700 ring-1 ring-inset ring-white/60">
                                {r.addedBy.split(' ').map(s=>s[0]).join('').slice(0,2)}
                              </span>
                              {r.addedBy}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{r.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
