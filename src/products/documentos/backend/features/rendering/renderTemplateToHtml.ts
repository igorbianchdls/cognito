import type { DocumentosHtmlRenderOutput, DocumentosPdfRenderRequest } from '@/products/documentos/backend/features/rendering/types'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeFileName(value: unknown): string {
  const base = String(value || 'documentos-preview')
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\.pdf$/i, '')
    .slice(0, 80)
  return `${base || 'documentos-preview'}.pdf`
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return '[unserializable]'
  }
}

function parseTemplate(templateJson: unknown): unknown {
  if (typeof templateJson === 'string') {
    const text = templateJson.trim()
    if (!text) throw new Error('template_json vazio')
    return JSON.parse(text)
  }
  if (templateJson == null) throw new Error('template_json é obrigatório')
  return templateJson
}

function findTitleInNode(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null
  const obj = node as Record<string, unknown>
  const props = obj.props && typeof obj.props === 'object' ? obj.props as Record<string, unknown> : null
  const ownTitle = props && typeof props.title === 'string' ? props.title.trim() : ''
  if (ownTitle) return ownTitle
  if (Array.isArray(obj.children)) {
    for (const child of obj.children) {
      const found = findTitleInNode(child)
      if (found) return found
    }
  }
  return null
}

function inferTitle(templateTree: unknown, explicitTitle: unknown): string {
  const explicit = String(explicitTitle || '').trim()
  if (explicit) return explicit
  if (Array.isArray(templateTree)) {
    for (const node of templateTree) {
      const found = findTitleInNode(node)
      if (found) return found
    }
  } else {
    const found = findTitleInNode(templateTree)
    if (found) return found
  }
  return 'Preview de Documento'
}

export function renderTemplateToHtml(input: DocumentosPdfRenderRequest): DocumentosHtmlRenderOutput {
  const templateTree = parseTemplate(input.templateJson)
  const title = inferTitle(templateTree, input.title)
  const fileName = normalizeFileName(input.fileName || title)
  const generatedAt = new Date().toISOString()

  const templatePretty = safeJsonStringify(templateTree)
  const samplePretty = safeJsonStringify(input.sampleData ?? {})

  const html = [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    '<style>',
    'body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }',
    'h1 { margin: 0 0 4px; font-size: 20px; }',
    '.muted { color: #6b7280; font-size: 12px; margin-bottom: 18px; }',
    '.section { margin-top: 16px; }',
    '.label { font-size: 12px; font-weight: 700; margin-bottom: 6px; color: #374151; }',
    'pre { white-space: pre-wrap; word-break: break-word; font-size: 11px; line-height: 1.45; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }',
    '</style>',
    '</head>',
    '<body>',
    `<h1>${escapeHtml(title)}</h1>`,
    `<div class="muted">Gerado em ${escapeHtml(generatedAt)} • Preview de template (MVP)</div>`,
    '<div class="section">',
    '<div class="label">Dados de exemplo</div>',
    `<pre>${escapeHtml(samplePretty)}</pre>`,
    '</div>',
    '<div class="section">',
    '<div class="label">Template JSON</div>',
    `<pre>${escapeHtml(templatePretty)}</pre>`,
    '</div>',
    '</body>',
    '</html>',
  ].join('')

  return { html, title, fileName }
}

