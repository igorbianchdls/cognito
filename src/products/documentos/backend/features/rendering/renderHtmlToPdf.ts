import type { DocumentosHtmlRenderOutput, DocumentosPdfRenderOutput } from '@/products/documentos/backend/features/rendering/types'
import { tryRenderHtmlToPdfWithPlaywright } from '@/products/documentos/backend/features/rendering/renderHtmlToPdfPlaywright'

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function htmlToPlainText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  const withBreaks = withoutScripts
    .replace(/<\/(p|div|section|h1|h2|h3|li|pre)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
  const stripped = withBreaks.replace(/<[^>]+>/g, ' ')
  const decoded = decodeHtmlEntities(stripped)
  return decoded
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function toAsciiSafe(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[^\x20-\x7E\n\t]/g, '')
}

function wrapLines(text: string, maxWidth = 92): string[] {
  const out: string[] = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine || ''
    if (line.length <= maxWidth) {
      out.push(line)
      continue
    }
    let remaining = line
    while (remaining.length > maxWidth) {
      let cut = remaining.lastIndexOf(' ', maxWidth)
      if (cut < Math.floor(maxWidth * 0.5)) cut = maxWidth
      out.push(remaining.slice(0, cut).trimEnd())
      remaining = remaining.slice(cut).trimStart()
    }
    out.push(remaining)
  }
  return out
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function buildSinglePagePdfFromText(text: string): Uint8Array {
  const maxLines = 58
  const wrapped = wrapLines(text, 92)
  const truncated = wrapped.length > maxLines
  const lines = (truncated ? wrapped.slice(0, maxLines - 1) : wrapped)
    .concat(truncated ? [`[TRUNCATED: ${wrapped.length - (maxLines - 1)} linhas omitidas]`] : [])

  const streamLines: string[] = [
    'BT',
    '/F1 10 Tf',
    '14 TL',
    '48 800 Td',
  ]
  lines.forEach((line, index) => {
    const escaped = escapePdfText(line || ' ')
    if (index === 0) streamLines.push(`(${escaped}) Tj`)
    else streamLines.push(`T* (${escaped}) Tj`)
  })
  streamLines.push('ET')
  const stream = streamLines.join('\n')

  const objects: string[] = []
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = '<< /Type /Pages /Count 1 /Kids [3 0 R] >>'
  objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[5] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`

  let body = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = Buffer.byteLength(body, 'latin1')
    body += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }

  const xrefPos = Buffer.byteLength(body, 'latin1')
  body += `xref\n0 ${objects.length}\n`
  body += '0000000000 65535 f \n'
  for (let i = 1; i < objects.length; i += 1) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`
  return Buffer.from(body, 'latin1')
}

export async function renderHtmlToPdf(input: DocumentosHtmlRenderOutput): Promise<DocumentosPdfRenderOutput> {
  const realPdf = await tryRenderHtmlToPdfWithPlaywright(input)
  if (realPdf) return realPdf

  const plainText = toAsciiSafe(htmlToPlainText(input.html))
  const header = `${input.title}\nGerado pelo render-pdf (MVP)\n\n`
  const bytes = buildSinglePagePdfFromText(`${header}${plainText}`.trim())
  return {
    bytes,
    fileName: input.fileName,
    contentType: 'application/pdf',
    engine: 'minimal-pdf-fallback',
  }
}
