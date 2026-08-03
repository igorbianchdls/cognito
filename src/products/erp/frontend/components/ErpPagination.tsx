'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ErpPagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize && page === 1) return null

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(total, page * pageSize)

  return <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-gray-500">
    <span>{first}-{last} de {total}</span>
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" title="Pagina anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="size-4" /></Button>
      <span className="min-w-20 text-center">Pagina {page} de {pageCount}</span>
      <Button variant="ghost" size="icon" title="Proxima pagina" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight className="size-4" /></Button>
    </div>
  </div>
}
