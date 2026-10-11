import { Button } from '@/components/ui/button'

export function ErpListPagination({ page, count, total, hasMore, loading, onPage }: {
  page: number; count: number; total?: number; hasMore: boolean; loading: boolean; onPage: (page: number) => void
}) {
  return <div className="flex items-center justify-between gap-4 border-t border-[#e7e7e4] px-5 py-4 text-sm md:px-8 lg:px-10">
    <span className="text-gray-500">Página {page} · {count} registros{total !== undefined ? ` de ${total}` : ''}</span>
    <div className="flex gap-2">
      <Button variant="outline" disabled={loading || page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
      <Button variant="outline" disabled={loading || !hasMore} onClick={() => onPage(page + 1)}>Próxima</Button>
    </div>
  </div>
}
