export type DocumentosPdfRenderRequest = {
  templateJson: unknown
  sampleData?: unknown
  fileName?: string
  title?: string
}

export type DocumentosHtmlRenderOutput = {
  html: string
  title: string
  fileName: string
}

export type DocumentosPdfRenderOutput = {
  bytes: Uint8Array
  fileName: string
  contentType: 'application/pdf'
  engine: 'minimal-pdf-fallback'
}

