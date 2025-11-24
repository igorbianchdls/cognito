"use client";

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, Download } from 'lucide-react'

export type DocumentViewerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  url?: string | null
  fileName?: string | null
  contentType?: string | null
}

export default function DocumentViewer({ open, onOpenChange, url, fileName, contentType }: DocumentViewerProps) {
  const type = useMemo(() => {
    if (contentType) return contentType.toLowerCase()
    if (!url) return ''
    const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return 'application/pdf'
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp': return `image/${ext === 'jpg' ? 'jpeg' : ext}`
      default: return ''
    }
  }, [url, contentType])

  const canEmbed = useMemo(() => {
    if (!url) return false
    if (!type) return false
    return type.startsWith('application/pdf') || type.startsWith('image/')
  }, [url, type])

  const handleOpenNew = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    if (fileName) a.download = fileName
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-base">
            {fileName || 'Documento'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {url && canEmbed ? (
            type.startsWith('image/') ? (
              <div className="h-[calc(80vh-140px)] overflow-auto flex items-center justify-center bg-gray-50">
                <img src={url} alt={fileName || 'Documento'} className="max-h-full max-w-full" />
              </div>
            ) : (
              <iframe
                src={url}
                title={fileName || 'Documento'}
                className="w-full h-[calc(80vh-140px)] bg-gray-50"
              />
            )
          ) : (
            <div className="h-[calc(80vh-140px)] flex items-center justify-center text-sm text-gray-600">
              Prévia indisponível. Use Abrir ou Baixar.
            </div>
          )}
        </div>
        <DialogFooter className="px-6 pb-6">
          <div className="flex-1" />
          <Button variant="outline" onClick={handleOpenNew} disabled={!url}>
            <ExternalLink className="h-4 w-4 mr-2" /> Abrir em nova aba
          </Button>
          <Button onClick={handleDownload} disabled={!url}>
            <Download className="h-4 w-4 mr-2" /> Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

