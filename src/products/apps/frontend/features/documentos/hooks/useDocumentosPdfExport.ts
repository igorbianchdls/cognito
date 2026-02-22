'use client'

import { useCallback, useMemo, useState } from 'react'
import { exportDocumentosPdf } from '@/products/apps/frontend/features/documentos/services/documentosPdfClient'

type DownloadDocumentosPdfInput = {
  templateJson: string
  sampleData?: unknown
  fileName?: string
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export default function useDocumentosPdfExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const downloadPdf = useCallback(async (input: DownloadDocumentosPdfInput) => {
    setLoading(true)
    setError(null)
    try {
      const fileName = (input.fileName || 'documentos-preview.pdf').trim() || 'documentos-preview.pdf'
      const blob = await exportDocumentosPdf({
        templateJson: input.templateJson,
        sampleData: input.sampleData,
        fileName,
      })
      triggerBlobDownload(blob, fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao exportar PDF'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return useMemo(() => ({
    loading,
    error,
    clearError: () => setError(null),
    downloadPdf,
  }), [downloadPdf, error, loading])
}

