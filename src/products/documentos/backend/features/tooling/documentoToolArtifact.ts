import { renderHtmlToPdf } from '@/products/documentos/backend/features/rendering/renderHtmlToPdf'

type JsonMap = Record<string, unknown>

export type DocumentoToolBuildInput = {
  tipo: string
  titulo: string
  origemTipo: string
  origemId: number
  dados: JsonMap
}

export type DocumentoToolRowLike = {
  id: number
  titulo: string
  mime: string | null
  html_snapshot: string | null
}

export type DocumentoToolAttachment = {
  filename: string
  content_type: string
  content: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function fileSlug(value: string): string {
  const raw = value
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
  return raw || 'documento'
}

function textDocumentSnapshot(input: DocumentoToolBuildInput): string {
  const now = new Date().toISOString()
  const dadosPretty = JSON.stringify(input.dados, null, 2)
  return [
    `Documento: ${input.titulo}`,
    `Tipo: ${input.tipo}`,
    `Origem: ${input.origemTipo}#${input.origemId}`,
    `Gerado em: ${now}`,
    '',
    'Dados:',
    dadosPretty,
    '',
  ].join('\n')
}

export function buildDocumentoToolHtmlSnapshot(input: DocumentoToolBuildInput): string {
  const now = new Date().toISOString()
  const dadosPretty = JSON.stringify(input.dados, null, 2)
  return [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(input.titulo)}</title>`,
    '<style>',
    'body { font-family: Arial, sans-serif; margin: 28px; color: #111827; }',
    'h1 { font-size: 20px; margin: 0 0 6px; }',
    '.meta { font-size: 12px; color: #6b7280; margin-bottom: 2px; }',
    '.block { margin-top: 18px; }',
    '.label { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 6px; }',
    'pre { white-space: pre-wrap; word-break: break-word; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; padding: 12px; font-size: 11px; line-height: 1.45; }',
    '</style>',
    '</head>',
    '<body>',
    `<h1>${escapeHtml(input.titulo)}</h1>`,
    `<div class="meta">Tipo: ${escapeHtml(input.tipo.toUpperCase())}</div>`,
    `<div class="meta">Origem: ${escapeHtml(input.origemTipo)} #${escapeHtml(String(input.origemId))}</div>`,
    `<div class="meta">Gerado em: ${escapeHtml(now)}</div>`,
    '<div class="block">',
    '<div class="label">Dados</div>',
    `<pre>${escapeHtml(dadosPretty)}</pre>`,
    '</div>',
    '</body>',
    '</html>',
  ].join('')
}

export function buildDocumentoToolLegacyTextSnapshot(input: DocumentoToolBuildInput): string {
  return textDocumentSnapshot(input)
}

export async function buildDocumentoToolAttachmentFromRow(row: DocumentoToolRowLike): Promise<{
  mime: string
  attachment?: DocumentoToolAttachment
}> {
  const snapshot = toText(row.html_snapshot)
  const rawMime = toText(row.mime).toLowerCase()
  const mime = rawMime || 'text/plain'
  if (!snapshot) return { mime }

  if (mime === 'application/pdf') {
    const baseName = fileSlug(row.titulo || `documento-${row.id}`)
    const pdf = await renderHtmlToPdf({
      html: snapshot,
      title: row.titulo || `Documento ${row.id}`,
      fileName: `${baseName}.pdf`,
    })
    return {
      mime: 'application/pdf',
      attachment: {
        filename: pdf.fileName,
        content_type: 'application/pdf',
        content: Buffer.from(pdf.bytes).toString('base64'),
      },
    }
  }

  const ext = mime.includes('json') ? 'json' : (mime.includes('html') ? 'html' : 'txt')
  const filename = `${fileSlug(row.titulo || `documento-${row.id}`)}.${ext}`
  return {
    mime,
    attachment: {
      filename,
      content_type: mime,
      content: Buffer.from(snapshot, 'utf8').toString('base64'),
    },
  }
}

