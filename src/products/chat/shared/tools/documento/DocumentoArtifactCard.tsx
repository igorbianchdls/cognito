"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DocumentoToolViewModel } from '@/products/chat/shared/tools/documento/types'

function formatBytes(bytes: number | null) {
  if (bytes == null || !Number.isFinite(bytes)) return null
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function formatDateTime(value: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR')
}

function documentIcon(tipo: string | null) {
  switch (tipo) {
    case 'proposta':
      return '📄'
    case 'fatura':
      return '🧾'
    case 'contrato':
      return '📑'
    case 'os':
      return '🛠️'
    case 'nfse':
      return '🏛️'
    default:
      return '📎'
  }
}

function getDataUrl(mime: string | null, base64: string | null) {
  if (!mime || !base64) return null
  return `data:${mime};base64,${base64}`
}

export function DocumentoArtifactCard({
  model,
  rawOutput,
}: {
  model: DocumentoToolViewModel
  rawOutput: unknown
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const link = model.signedUrl ?? getDataUrl(model.mime, model.attachmentContentBase64)
  const canPreview = Boolean(link)
  const canDownload = Boolean(link)
  const sizeLabel = formatBytes(model.sizeBytes)
  const createdAtLabel = formatDateTime(model.createdAt)

  const handleCopyLink = async () => {
    if (!model.signedUrl || typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(model.signedUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // noop
    }
  }

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-lg border bg-background p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-lg">
            <span aria-hidden>{documentIcon(model.tipo)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-sm">{model.fileName || model.titulo || 'Documento'}</div>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {model.tipo ? <span className="rounded bg-muted px-1.5 py-0.5 uppercase">{model.tipo}</span> : null}
              {model.status ? <span className="rounded bg-muted px-1.5 py-0.5">{model.status}</span> : null}
              {model.reused ? <span className="rounded bg-muted px-1.5 py-0.5">reused</span> : null}
              {sizeLabel ? <span>{sizeLabel}</span> : null}
              {model.documentoId != null ? <span>doc #{model.documentoId}</span> : null}
              {model.driveFileId ? <span>drive ✓</span> : null}
            </div>
            {createdAtLabel ? (
              <div className="mt-1 text-[11px] text-muted-foreground">Gerado em {createdAtLabel}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!canPreview} onClick={() => canPreview && setPreviewOpen(true)}>
            Visualizar
          </Button>
          {canDownload ? (
            <Button size="sm" variant="outline" asChild>
              <a href={link || '#'} target="_blank" rel="noreferrer" download={model.fileName || undefined}>
                Baixar
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Baixar
            </Button>
          )}
          {model.signedUrl ? (
            <Button size="sm" variant="ghost" onClick={handleCopyLink}>
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>
          ) : null}
        </div>
      </div>

      <details className="rounded-md border bg-background">
        <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">Detalhes técnicos (JSON)</summary>
        <pre className="max-h-72 overflow-auto p-3 text-xs whitespace-pre-wrap">
          {JSON.stringify(rawOutput, null, 2)}
        </pre>
      </details>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-sm">{model.fileName || model.titulo || 'Documento'}</DialogTitle>
          </DialogHeader>
          {canPreview && link ? (
            <div className="h-[75vh] w-full bg-muted">
              <iframe title={model.fileName || 'Documento'} src={link} className="h-full w-full" />
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Preview indisponível para este documento.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
