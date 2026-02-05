import { Folder, Search, LayoutGrid, List } from 'lucide-react'

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
    <div className="h-full w-full px-6 py-5">
      {/* Top bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-xs text-gray-500">Docs / Workspace</div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              className="h-9 w-64 rounded-md border border-gray-200 pl-8 pr-3 text-sm outline-none ring-0 focus:border-gray-300"
              placeholder="Search"
            />
          </div>
          <div className="hidden items-center gap-1 rounded-md border border-gray-200 p-1 md:flex">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr]">
        {/* Folders grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Recent Folders</h2>
            <span className="text-xs text-gray-500">{folders.length} total</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((f) => (
              <button key={f.id} className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md">
                <div className="flex size-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Folder className="size-6" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900 group-hover:underline">
                    {f.name}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {f.files} {f.files === 1 ? 'file' : 'files'} • {f.size}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent files table */}
        <section className="mt-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Recent</h2>
            <span className="text-xs text-gray-500">{recent.length} items</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="w-2/5 px-4 py-3 text-left font-medium">File name</th>
                  <th className="w-1/5 px-4 py-3 text-left font-medium">Date added</th>
                  <th className="w-1/5 px-4 py-3 text-left font-medium">Added by</th>
                  <th className="w-1/5 px-4 py-3 text-left font-medium">Size</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 1 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="truncate px-4 py-3 text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.dateAdded}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">
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
  )
}

