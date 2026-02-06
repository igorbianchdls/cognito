"use client"

import { ChevronDown, ChevronUp, FileUp, Loader2 } from 'lucide-react'

export type DriveUploadPanelItem = {
  id: string
  name: string
  progress: number
  status: 'queued' | 'preparing' | 'uploading' | 'finalizing' | 'completed' | 'error'
  message?: string
}

function statusLabel(item: DriveUploadPanelItem): string {
  if (item.status === 'queued') return 'Na fila'
  if (item.status === 'preparing') return 'Preparando'
  if (item.status === 'uploading') return 'Enviando'
  if (item.status === 'finalizing') return 'Finalizando'
  if (item.status === 'completed') return 'Concluído'
  return 'Falha'
}

export default function DriveUploadPanel({
  items,
  open,
  onToggle,
  onClearFinished,
}: {
  items: DriveUploadPanelItem[]
  open: boolean
  onToggle: () => void
  onClearFinished: () => void
}) {
  if (!items.length) return null

  const uploadingCount = items.filter((i) => i.status === 'preparing' || i.status === 'uploading' || i.status === 'finalizing' || i.status === 'queued').length
  const finishedCount = items.filter((i) => i.status === 'completed' || i.status === 'error').length

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[360px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-800"
        >
          <FileUp className="size-4" />
          Uploads
          {uploadingCount > 0 ? <span className="text-xs text-gray-500">({uploadingCount} em andamento)</span> : null}
        </button>
        <div className="inline-flex items-center gap-1">
          {finishedCount > 0 ? (
            <button
              onClick={onClearFinished}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              Limpar
            </button>
          ) : null}
          <button
            onClick={onToggle}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label={open ? 'Minimizar uploads' : 'Expandir uploads'}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="max-h-[320px] overflow-y-auto">
          {items.map((item) => {
            const isWorking = item.status === 'preparing' || item.status === 'uploading' || item.status === 'finalizing' || item.status === 'queued'
            const barColor = item.status === 'error' ? 'bg-red-500' : item.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
            return (
              <div key={item.id} className="border-t border-gray-100 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.message || statusLabel(item)}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                    {isWorking ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {item.progress}%
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-gray-200">
                  <div className={`h-full transition-all ${barColor}`} style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

