'use client'

type ExportDocumentosPdfInput = {
  templateJson: string
  sampleData?: unknown
  fileName?: string
}

function getErrorMessageFallback(status: number): string {
  if (status === 400) return 'Payload inválido para geração do PDF'
  if (status === 413) return 'Conteúdo muito grande para exportar'
  return 'Falha ao gerar PDF'
}

export async function exportDocumentosPdf(input: ExportDocumentosPdfInput): Promise<Blob> {
  const res = await fetch('/api/documentos/render-pdf', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/pdf, application/json',
    },
    body: JSON.stringify({
      template_json: input.templateJson,
      sample_data: input.sampleData ?? {},
      filename: input.fileName,
    }),
  })

  if (!res.ok) {
    const contentType = String(res.headers.get('content-type') || '')
    if (contentType.includes('application/json')) {
      const json = await res.json().catch(() => ({} as any))
      throw new Error(String(json?.error || json?.message || getErrorMessageFallback(res.status)))
    }
    const text = await res.text().catch(() => '')
    throw new Error(text || getErrorMessageFallback(res.status))
  }

  const blob = await res.blob()
  if (!blob || blob.size <= 0) {
    throw new Error('PDF vazio retornado pelo servidor')
  }
  return blob
}

