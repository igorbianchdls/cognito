'use client'
import { useState } from 'react'
import { useErpResource } from '@/products/erp/frontend/hooks/useErpResource'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HistoryRows } from './ErpHistoryPanel'
export function ErpImportDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const [page, setPage] = useState(1),
    [retry, setRetry] = useState(0)
  const { data, error } = useErpResource<{
    record: Record<string, unknown>
    rows: Record<string, unknown>[]
    hasMore: boolean
  }>(`/api/erp/importacoes/lotes/${id}?page=${page}&retry=${retry}`)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resultado da importação</DialogTitle>
        </DialogHeader>
        {error ? (
          <div role="alert">
            <p>{error}</p>
            <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : data ? (
          <>
            <HistoryRows title="Resumo" rows={[data.record]} />
            <a className="underline" href={`/api/erp/importacoes/lotes/${id}?format=csv`}>
              Baixar erros do arquivo
            </a>
            <HistoryRows title="Linhas processadas" rows={data.rows} />
            <div className="flex gap-3">
              <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span>Página {page}</span>
              <Button disabled={!data.hasMore} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          </>
        ) : (
          <p role="status">Carregando importação…</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
