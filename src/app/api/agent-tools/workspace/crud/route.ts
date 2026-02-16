import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'
import { getSupabaseAdmin } from '@/products/drive/backend/lib'

export const runtime = 'nodejs'

type RequestAction = {
  action?: 'request' | 'read_file' | 'get_drive_file_url' | 'send_email'
  method?: 'GET' | 'POST' | 'DELETE'
  resource?: string
  params?: Record<string, unknown>
  data?: unknown
  file_id?: string
  mode?: 'auto' | 'text' | 'binary'
  inbox_id?: string
  inboxId?: string
  to?: unknown
  cc?: unknown
  bcc?: unknown
  labels?: unknown
  subject?: string
  text?: string
  html?: string
  attachments?: unknown
  attachment_url?: string
  signed_url?: string
  filename?: string
  content_type?: string
  content_disposition?: string
  content_id?: string
}

type RouteRule = {
  pattern: RegExp
  methods: Array<'GET' | 'POST' | 'DELETE'>
}

const RESOURCE_RULES: RouteRule[] = [
  { pattern: /^email\/inboxes$/, methods: ['GET', 'DELETE'] },
  { pattern: /^email\/messages$/, methods: ['GET', 'POST'] },
  { pattern: /^email\/messages\/[^/]+$/, methods: ['GET', 'POST', 'DELETE'] },
  { pattern: /^email\/messages\/[^/]+\/attachments\/[^/]+$/, methods: ['GET'] },
  { pattern: /^drive$/, methods: ['GET'] },
  { pattern: /^drive\/folders$/, methods: ['GET', 'POST'] },
  { pattern: /^drive\/folders\/[^/]+$/, methods: ['GET', 'DELETE'] },
  { pattern: /^drive\/files\/[^/]+$/, methods: ['DELETE'] },
  { pattern: /^drive\/files\/[^/]+\/download$/, methods: ['GET'] },
  { pattern: /^drive\/files\/prepare-upload$/, methods: ['POST'] },
  { pattern: /^drive\/files\/complete-upload$/, methods: ['POST'] },
]

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'jsonl', 'xml', 'yml', 'yaml',
  'ini', 'log', 'sql', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'py', 'java',
  'go', 'rs', 'c', 'h', 'cpp', 'hpp', 'html', 'css',
])

let pdfjsImportPromise: Promise<any> | null = null

function ensurePdfJsPolyfills() {
  const g = globalThis as any
  if (typeof g.DOMMatrix === 'undefined') {
    g.DOMMatrix = class DOMMatrix {
      multiplySelf() { return this }
      preMultiplySelf() { return this }
      translateSelf() { return this }
      scaleSelf() { return this }
      rotateSelf() { return this }
      invertSelf() { return this }
    }
  }
  if (typeof g.ImageData === 'undefined') {
    g.ImageData = class ImageData {}
  }
  if (typeof g.Path2D === 'undefined') {
    g.Path2D = class Path2D {}
  }
}

function isPdfFile(name: string, mime: string): boolean {
  if (String(mime || '').toLowerCase().includes('pdf')) return true
  return /\.pdf$/i.test(String(name || '').trim())
}

async function getPdfJs() {
  ensurePdfJsPolyfills()
  if (!pdfjsImportPromise) {
    pdfjsImportPromise = import('pdfjs-dist/legacy/build/pdf.mjs')
  }
  return pdfjsImportPromise
}

function decodePdfTextLiteral(raw: string): string {
  let out = ''
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]
    if (ch !== '\\') {
      out += ch
      continue
    }
    const next = raw[i + 1]
    if (next == null) break
    i += 1
    if (next === 'n') { out += '\n'; continue }
    if (next === 'r') { out += '\r'; continue }
    if (next === 't') { out += '\t'; continue }
    if (next === 'b') { out += '\b'; continue }
    if (next === 'f') { out += '\f'; continue }
    if (next === '(' || next === ')' || next === '\\') { out += next; continue }
    if (/[0-7]/.test(next)) {
      let oct = next
      for (let j = 0; j < 2; j += 1) {
        const c = raw[i + 1]
        if (!c || !/[0-7]/.test(c)) break
        oct += c
        i += 1
      }
      out += String.fromCharCode(parseInt(oct, 8))
      continue
    }
    out += next
  }
  return out
}

function extractPdfTextFallback(buffer: Buffer): { text: string; pages: number } {
  const src = buffer.toString('latin1')
  const chunks: string[] = []

  const tjRegex = /\(((?:\\.|[^\\()])*)\)\s*Tj/g
  for (const match of src.matchAll(tjRegex)) {
    const text = decodePdfTextLiteral(match[1] || '').trim()
    if (text) chunks.push(text)
  }

  const tjArrayRegex = /\[((?:\\.|[\s\S])*?)\]\s*TJ/gm
  for (const match of src.matchAll(tjArrayRegex)) {
    const arr = match[1] || ''
    const parts: string[] = []
    const litRegex = /\(((?:\\.|[^\\()])*)\)/g
    for (const lit of arr.matchAll(litRegex)) {
      const text = decodePdfTextLiteral(lit[1] || '').trim()
      if (text) parts.push(text)
    }
    if (parts.length) chunks.push(parts.join(' '))
  }

  const pages = (src.match(/\/Type\s*\/Page\b/g) || []).length || 1
  const text = chunks.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return { text, pages }
}

async function extractPdfTextPdfJs(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const pdfjs = await getPdfJs()
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    verbosity: 0,
  })
  const doc = await loadingTask.promise
  try {
    const chunks: string[] = []
    for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
      const page = await doc.getPage(pageNo)
      const textContent = await page.getTextContent()
      const text = (Array.isArray(textContent?.items) ? textContent.items : [])
        .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
        .filter(Boolean)
        .join(' ')
        .trim()
      chunks.push(text)
      try { page.cleanup() } catch {}
    }
    return {
      text: chunks.filter(Boolean).join('\n\n').trim(),
      pages: Number(doc.numPages || 0),
    }
  } finally {
    try { await doc.destroy() } catch {}
  }
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number; method: 'fallback' | 'pdfjs' }> {
  const fallback = extractPdfTextFallback(buffer)
  if ((fallback.text || '').length >= 12) {
    return { ...fallback, method: 'fallback' }
  }
  const parsed = await extractPdfTextPdfJs(buffer)
  return { ...parsed, method: 'pdfjs' }
}

function toCleanResource(value: unknown): string {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '')
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function appendQuery(url: URL, params: unknown) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return
  for (const [key, rawValue] of Object.entries(params as Record<string, unknown>)) {
    if (rawValue == null) continue
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (item == null) continue
        url.searchParams.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item))
      }
      continue
    }
    if (typeof rawValue === 'object') {
      url.searchParams.append(key, JSON.stringify(rawValue))
      continue
    }
    url.searchParams.append(key, String(rawValue))
  }
}

function normalizeMethod(value: unknown): 'GET' | 'POST' | 'DELETE' {
  const upper = String(value || 'GET').trim().toUpperCase()
  if (upper === 'POST') return 'POST'
  if (upper === 'DELETE') return 'DELETE'
  return 'GET'
}

function matchesRule(resource: string, method: 'GET' | 'POST' | 'DELETE'): boolean {
  const rule = RESOURCE_RULES.find((entry) => entry.pattern.test(resource))
  return Boolean(rule && rule.methods.includes(method))
}

function isTextLikeMime(mime: string): boolean {
  const normalized = mime.toLowerCase()
  if (!normalized) return false
  if (normalized.startsWith('text/')) return true
  if (normalized.includes('json')) return true
  if (normalized.includes('xml')) return true
  if (normalized.includes('javascript')) return true
  if (normalized.includes('csv')) return true
  return false
}

function isTextLikeFile(name: string, mime: string): boolean {
  if (isTextLikeMime(mime)) return true
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : ''
  return TEXT_EXTENSIONS.has(ext)
}

async function forwardWorkspaceRequest(req: NextRequest, payload: RequestAction) {
  const method = normalizeMethod(payload.method)
  const resource = toCleanResource(payload.resource)

  if (!resource) {
    return { ok: false, status: 400, result: { success: false, error: 'resource é obrigatório' } }
  }
  if (resource.includes('..')) {
    return { ok: false, status: 400, result: { success: false, error: 'resource inválido' } }
  }
  if (!matchesRule(resource, method)) {
    return { ok: false, status: 400, result: { success: false, error: `resource/method não permitido: ${resource} (${method})` } }
  }

  const url = new URL(`/api/${resource}`, req.url)
  appendQuery(url, payload.params)

  const init: RequestInit = {
    method,
    cache: 'no-store',
    redirect: 'manual',
    headers: {
      Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    },
  }

  if (method !== 'GET') {
    ;(init.headers as Record<string, string>)['Content-Type'] = 'application/json'
    init.body = JSON.stringify(payload.data ?? {})
  }

  const upstream = await fetch(url.toString(), init)
  const status = upstream.status
  const contentType = String(upstream.headers.get('content-type') || '')

  if (status >= 300 && status < 400) {
    return {
      ok: upstream.ok,
      status,
      result: {
        success: false,
        redirectTo: upstream.headers.get('location') || null,
        status,
      },
    }
  }

  if (contentType.includes('application/json')) {
    const json = await upstream.json().catch(() => ({}))
    return { ok: upstream.ok, status, result: json }
  }

  if (contentType.startsWith('text/')) {
    const text = await upstream.text().catch(() => '')
    const maxLen = 50_000
    return {
      ok: upstream.ok,
      status,
      result: {
        success: upstream.ok,
        contentType,
        text: text.slice(0, maxLen),
        truncated: text.length > maxLen,
      },
    }
  }

  const bytes = await upstream.arrayBuffer().catch(() => new ArrayBuffer(0))
  const size = bytes.byteLength
  return {
    ok: upstream.ok,
    status,
    result: {
      success: upstream.ok,
      contentType: contentType || 'application/octet-stream',
      sizeBytes: size,
      message: 'Resposta binária disponível (use action=read_file para leitura textual do Drive).',
    },
  }
}

async function readDriveFile(req: NextRequest, payload: RequestAction) {
  const fileId = String(payload.file_id || '').trim()
  if (!isUuid(fileId)) {
    return { ok: false, status: 400, result: { success: false, error: 'file_id inválido' } }
  }

  const rows = await runQuery<{
    id: string
    name: string
    mime: string | null
    size_bytes: string | number
  }>(
    `SELECT
       id::text AS id,
       name,
       mime,
       size_bytes
     FROM drive.files
     WHERE id = $1::uuid
       AND deleted_at IS NULL
     LIMIT 1`,
    [fileId]
  )
  const file = rows[0]
  if (!file) {
    return { ok: false, status: 404, result: { success: false, error: 'Arquivo não encontrado' } }
  }

  const mode = String(payload.mode || 'auto').trim().toLowerCase()
  const downloadUrl = new URL(`/api/drive/files/${fileId}/download`, req.url)
  const res = await fetch(downloadUrl.toString(), { method: 'GET', cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      ok: false,
      status: res.status,
      result: { success: false, error: text || `Falha ao baixar arquivo (${res.status})` },
    }
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const mime = String(file.mime || '').trim().toLowerCase() || 'application/octet-stream'
  const textLike = isTextLikeFile(file.name, mime)
  const pdfLike = isPdfFile(file.name, mime)

  if (mode === 'text' && !textLike) {
    if (!pdfLike) {
      return {
        ok: false,
        status: 400,
        result: {
          success: false,
          error: 'Arquivo não parece textual. Use mode=binary ou mode=auto.',
          file: { id: file.id, name: file.name, mime, sizeBytes: Number(file.size_bytes || 0) },
        },
      }
    }
  }

  if (mode === 'binary') {
    const maxBytes = 180_000
    const chunk = buffer.subarray(0, maxBytes)
    return {
      ok: true,
      status: 200,
      result: {
        success: true,
        file: { id: file.id, name: file.name, mime, sizeBytes: Number(file.size_bytes || 0) },
        encoding: 'base64',
        content: chunk.toString('base64'),
        truncated: buffer.length > maxBytes,
      },
    }
  }

  if (pdfLike) {
    try {
      const extracted = await extractPdfText(buffer)
      const maxBytes = 180_000
      const textBuffer = Buffer.from(extracted.text || '', 'utf8')
      const chunk = textBuffer.subarray(0, maxBytes)
      const content = new TextDecoder('utf-8', { fatal: false }).decode(chunk)
      return {
        ok: true,
        status: 200,
        result: {
          success: true,
          file: { id: file.id, name: file.name, mime, sizeBytes: Number(file.size_bytes || 0) },
          encoding: 'utf-8',
          content,
          truncated: textBuffer.length > maxBytes,
          extractedFrom: 'pdf',
          extractionMethod: extracted.method,
          pages: extracted.pages,
        },
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      if (mode === 'text') {
        return {
          ok: false,
          status: 500,
          result: {
            success: false,
            error: `Falha ao extrair texto do PDF: ${detail}`,
            file: { id: file.id, name: file.name, mime, sizeBytes: Number(file.size_bytes || 0) },
          },
        }
      }
      return {
        ok: true,
        status: 200,
        result: {
          success: true,
          file: { id: file.id, name: file.name, mime, sizeBytes: Number(file.size_bytes || 0) },
          message: `PDF detectado, mas não foi possível extrair texto automaticamente. Detalhe: ${detail}. Para conteúdo bruto, use mode=binary.`,
        },
      }
    }
  }

  if (!textLike) {
    return {
      ok: true,
      status: 200,
      result: {
        success: true,
        file: { id: file.id, name: file.name, mime, sizeBytes: Number(file.size_bytes || 0) },
        message: 'Arquivo binário detectado. Para conteúdo bruto, use mode=binary.',
      },
    }
  }

  const maxBytes = 180_000
  const chunk = buffer.subarray(0, maxBytes)
  const content = new TextDecoder('utf-8', { fatal: false }).decode(chunk)
  return {
    ok: true,
    status: 200,
    result: {
      success: true,
      file: { id: file.id, name: file.name, mime, sizeBytes: Number(file.size_bytes || 0) },
      encoding: 'utf-8',
      content,
      truncated: buffer.length > maxBytes,
    },
  }
}

async function getDriveFileUrl(payload: RequestAction) {
  const fileId = String(payload.file_id || '').trim()
  if (!isUuid(fileId)) {
    return { ok: false, status: 400, result: { success: false, error: 'file_id inválido' } }
  }

  const rows = await runQuery<{
    id: string
    name: string
    mime: string | null
    size_bytes: string | number
    storage_path: string
    bucket_id: string | null
  }>(
    `SELECT
       id::text AS id,
       name,
       mime,
       size_bytes,
       storage_path,
       bucket_id
     FROM drive.files
     WHERE id = $1::uuid
       AND deleted_at IS NULL
     LIMIT 1`,
    [fileId]
  )
  const file = rows[0]
  if (!file) {
    return { ok: false, status: 404, result: { success: false, error: 'Arquivo não encontrado' } }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false, status: 500, result: { success: false, error: 'Supabase Storage não configurado no servidor' } }
  }

  const expiresInSeconds = 60 * 60
  const bucket = file.bucket_id || 'drive'
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(file.storage_path, expiresInSeconds)
  if (error || !data?.signedUrl) {
    return {
      ok: false,
      status: 500,
      result: { success: false, error: `Falha ao gerar URL assinada: ${error?.message || 'erro desconhecido'}` },
    }
  }

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()
  return {
    ok: true,
    status: 200,
    result: {
      success: true,
      file: {
        id: file.id,
        name: file.name,
        mime: file.mime || 'application/octet-stream',
        sizeBytes: Number(file.size_bytes || 0),
        bucketId: bucket,
      },
      signed_url: data.signedUrl,
      filename: file.name,
      content_type: file.mime || 'application/octet-stream',
      expires_in_seconds: expiresInSeconds,
      expires_at: expiresAt,
    },
  }
}

function pickAttachmentList(payload: RequestAction) {
  const out: Array<Record<string, unknown>> = []

  if (Array.isArray(payload.attachments)) {
    for (const entry of payload.attachments) {
      if (!entry || typeof entry !== 'object') continue
      const att = entry as Record<string, unknown>
      const url = typeof att.url === 'string' ? att.url.trim() : ''
      const content = typeof att.content === 'string' ? att.content : ''
      if (!url && !content) continue
      out.push({
        filename: typeof att.filename === 'string' ? att.filename : undefined,
        contentType: typeof att.contentType === 'string' ? att.contentType : undefined,
        contentDisposition: typeof att.contentDisposition === 'string' ? att.contentDisposition : undefined,
        contentId: typeof att.contentId === 'string' ? att.contentId : undefined,
        content: content || undefined,
        url: url || undefined,
      })
    }
  }

  const attachmentUrlRaw = typeof payload.attachment_url === 'string'
    ? payload.attachment_url
    : (typeof payload.signed_url === 'string' ? payload.signed_url : '')
  const attachmentUrl = attachmentUrlRaw.trim()
  if (attachmentUrl) {
    out.push({
      filename: typeof payload.filename === 'string' ? payload.filename : undefined,
      contentType: typeof payload.content_type === 'string' ? payload.content_type : undefined,
      contentDisposition: typeof payload.content_disposition === 'string' ? payload.content_disposition : undefined,
      contentId: typeof payload.content_id === 'string' ? payload.content_id : undefined,
      url: attachmentUrl,
    })
  }

  return out.length > 0 ? out : undefined
}

async function sendEmail(req: NextRequest, payload: RequestAction) {
  const inboxIdRaw = payload.inbox_id ?? payload.inboxId
  const inboxId = typeof inboxIdRaw === 'string' ? inboxIdRaw.trim() : ''
  if (!inboxId) {
    return { ok: false, status: 400, result: { success: false, error: 'inbox_id é obrigatório' } }
  }
  if (payload.to == null) {
    return { ok: false, status: 400, result: { success: false, error: 'to é obrigatório' } }
  }

  const emailBody = {
    inboxId,
    to: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    labels: payload.labels,
    subject: typeof payload.subject === 'string' ? payload.subject : undefined,
    text: typeof payload.text === 'string' ? payload.text : undefined,
    html: typeof payload.html === 'string' ? payload.html : undefined,
    attachments: pickAttachmentList(payload),
  }

  const out = await forwardWorkspaceRequest(req, {
    action: 'request',
    method: 'POST',
    resource: 'email/messages',
    data: emailBody,
  })
  return { ok: out.ok, status: out.ok ? 200 : out.status, result: out.result }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const payload = await req.json().catch(() => ({})) as RequestAction
    const action = String(payload.action || 'request').trim().toLowerCase()

    if (action === 'get_drive_file_url') {
      const out = await getDriveFileUrl(payload)
      return Response.json({ ok: out.ok, result: out.result }, { status: out.status })
    }

    if (action === 'send_email') {
      const out = await sendEmail(req, payload)
      return Response.json({ ok: out.ok, result: out.result }, { status: out.status })
    }

    if (action === 'read_file') {
      const out = await readDriveFile(req, payload)
      return Response.json({ ok: out.ok, result: out.result }, { status: out.status })
    }

    if (action !== 'request') {
      return Response.json({ ok: false, error: `Ação inválida: ${action}` }, { status: 400 })
    }

    const out = await forwardWorkspaceRequest(req, payload)
    return Response.json({ ok: out.ok, result: out.result }, { status: out.ok ? 200 : out.status })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
