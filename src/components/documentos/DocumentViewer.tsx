"use client";

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, Download, Trash2, Upload, Replace } from 'lucide-react'

export type DocumentViewerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  url?: string | null
  fileName?: string | null
  contentType?: string | null
  lancamentoId?: number | string
  onChanged?: () => void
}

export default function DocumentViewer({ open, onOpenChange, url, fileName, contentType, lancamentoId, onChanged }: DocumentViewerProps) {
  const [currentUrl, setCurrentUrl] = React.useState<string | null | undefined>(url)
  const [busy, setBusy] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => { setCurrentUrl(url) }, [url])
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
    if (!currentUrl) return false
    if (!type) return false
    return type.startsWith('application/pdf') || type.startsWith('image/')
  }, [currentUrl, type])

  const handleOpenNew = () => {
    if (currentUrl) window.open(currentUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = async () => {
    if (!lancamentoId) return
    try {
      const res = await fetch(`/api/modulos/financeiro/lancamentos/${lancamentoId}/arquivo/download`)
      const json = await res.json()
      if (json?.success && json?.url) {
        const a = document.createElement('a')
        a.href = json.url
        if (fileName) a.download = fileName
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch {}
  }

  const handleChooseFile = () => fileInputRef.current?.click()

  const uploadFile = async (file: File, method: 'POST' | 'PUT') => {
    if (!lancamentoId || !file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await fetch(`/api/modulos/financeiro/lancamentos/${lancamentoId}/arquivo`, { method, body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao enviar arquivo')
      // Refresh preview URL
      const pv = await fetch(`/api/modulos/financeiro/lancamentos/${lancamentoId}/arquivo/preview`)
      const pj = await pv.json()
      if (pj?.success) setCurrentUrl(pj.url)
      onChanged?.()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Falha ao enviar arquivo')
    } finally { setBusy(false) }
  }

  const handleDelete = async () => {
    if (!lancamentoId) return
    if (!confirm('Excluir arquivo do lançamento?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/modulos/financeiro/lancamentos/${lancamentoId}/arquivo`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao excluir')
      setCurrentUrl(null)
      onChanged?.()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Falha ao excluir')
    } finally { setBusy(false) }
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
          {currentUrl && canEmbed ? (
            type.startsWith('image/') ? (
              <div className="h-[calc(80vh-140px)] overflow-auto flex items-center justify-center bg-gray-50">
                <img src={currentUrl} alt={fileName || 'Documento'} className="max-h-full max-w-full" />
              </div>
            ) : (
              <iframe
                src={currentUrl}
                title={fileName || 'Documento'}
                className="w-full h-[calc(80vh-140px)] bg-gray-50"
              />
            )
          ) : (
            <div className="h-[calc(80vh-140px)] flex items-center justify-center text-sm text-gray-600">
              {lancamentoId ? 'Sem arquivo. Envie um arquivo para este lançamento.' : 'Prévia indisponível. Use Abrir ou Baixar.'}
            </div>
          )}
        </div>
        <DialogFooter className="px-6 pb-6">
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            uploadFile(f, currentUrl ? 'PUT' : 'POST')
            e.currentTarget.value = ''
          }} />
          <div className="flex-1" />
          {lancamentoId && (
            <>
              <Button variant="outline" onClick={handleChooseFile} disabled={busy} title={currentUrl ? 'Substituir arquivo' : 'Enviar arquivo'}>
                {currentUrl ? <Replace className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {currentUrl ? 'Substituir' : 'Enviar'}
              </Button>
              {currentUrl && (
                <Button variant="destructive" onClick={handleDelete} disabled={busy}>
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={handleOpenNew} disabled={!currentUrl}>
            <ExternalLink className="h-4 w-4 mr-2" /> Abrir em nova aba
          </Button>
          <Button onClick={handleDownload} disabled={!lancamentoId || busy}>
            <Download className="h-4 w-4 mr-2" /> Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
