'use client'

import useDocumentosPdfExport from '@/products/apps/frontend/features/documentos/hooks/useDocumentosPdfExport'

type Props = {
  templateJson: string
  sampleData?: unknown
  disabled?: boolean
}

export default function DocumentosPdfExportButton({ templateJson, sampleData, disabled }: Props) {
  const { loading, error, clearError, downloadPdf } = useDocumentosPdfExport()

  async function onClick() {
    if (disabled || loading) return
    clearError()
    await downloadPdf({
      templateJson,
      sampleData,
      fileName: 'apps-documentos-preview.pdf',
    }).catch(() => {})
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={Boolean(disabled) || loading}
        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        title={disabled ? 'Corrija o JSON para gerar o PDF' : 'Baixar preview em PDF'}
      >
        {loading ? 'Gerando PDF...' : 'Baixar PDF'}
      </button>
      {error ? <span className="max-w-[260px] truncate text-xs text-red-600" title={error}>{error}</span> : null}
    </div>
  )
}

