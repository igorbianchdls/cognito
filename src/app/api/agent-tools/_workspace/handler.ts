import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'
import { getSupabaseAdmin } from '@/products/drive/backend/lib'

export type WorkspaceToolScope = 'workspace' | 'drive' | 'email'

export type WorkspaceRequestAction = {
  action?: 'request' | 'read_file' | 'get_drive_file_url' | 'get_file_url' | 'send_email' | 'send'
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

type ToolErrorResult = {
  success: false
  error: string
  code: string
} & Record<string, unknown>

const EMAIL_RESOURCE_RULES: RouteRule[] = [
  { pattern: /^email\/inboxes$/, methods: ['GET', 'POST', 'DELETE'] },
  { pattern: /^email\/messages$/, methods: ['GET', 'POST'] },
  { pattern: /^email\/messages\/[^/]+$/, methods: ['GET', 'POST', 'DELETE'] },
  { pattern: /^email\/messages\/[^/]+\/attachments\/[^/]+$/, methods: ['GET'] },
]

const DRIVE_RESOURCE_RULES: RouteRule[] = [
  { pattern: /^drive$/, methods: ['GET'] },
  { pattern: /^drive\/folders$/, methods: ['GET', 'POST'] },
  { pattern: /^drive\/folders\/[^/]+$/, methods: ['GET', 'DELETE'] },
  { pattern: /^drive\/files\/prepare-upload$/, methods: ['POST'] },
  { pattern: /^drive\/files\/complete-upload$/, methods: ['POST'] },
  { pattern: /^drive\/files\/[^/]+$/, methods: ['DELETE'] },
  { pattern: /^drive\/files\/[^/]+\/download$/, methods: ['GET'] },
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

function toolError(code: string, error: string, extra?: Record<string, unknown>): ToolErrorResult {
  return {
    success: false,
    code,
    error,
    ...(extra || {}),
  }
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return { ...(value as Record<string, unknown>) }
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const raw of values) {
    if (typeof raw !== 'string') continue
    const v = raw.trim()
    if (v) return v
  }
  return ''
}

function setIfMissing(target: Record<string, unknown>, key: string, value: unknown) {
  if (value == null) return
  if (key in target && target[key] != null && String(target[key]).trim() !== '') return
  target[key] = value
}

function normalizeWorkspaceRequestPayload(scope: WorkspaceToolScope, payload: WorkspaceRequestAction): WorkspaceRequestAction {
  if (normalizeAction(payload.action) !== 'request') return payload

  const resource = toCleanResource(payload.resource)
  const method = normalizeMethod(payload.method)

  const out: WorkspaceRequestAction = { ...payload }
  const params = objectOrEmpty(payload.params)
  const data = objectOrEmpty(payload.data)

  // Generic GET convenience: move common top-level query fields into params.
  if (method === 'GET') {
    const topLevelQueryPairs: Array<[string, unknown]> = [
      ['workspace_id', (payload as any).workspace_id],
      ['workspace_id', (payload as any).workspaceId],
      ['parent_id', (payload as any).parent_id],
      ['parent_id', (payload as any).parentId],
      ['folder_id', (payload as any).folder_id],
      ['folder_id', (payload as any).folderId],
      ['inboxId', payload.inboxId],
      ['inboxId', payload.inbox_id],
      ['limit', (payload as any).limit],
      ['pageToken', (payload as any).pageToken],
      ['q', (payload as any).q],
      ['search', (payload as any).search],
    ]
    for (const [key, value] of topLevelQueryPairs) setIfMissing(params, key, value)
  }

  // Email request ergonomics: GET /email/messages requires inboxId in query params.
  if (scope === 'email' && method === 'GET' && resource.startsWith('email/messages')) {
    const inboxId = firstNonEmptyString(params.inboxId, params.inbox_id, payload.inboxId, payload.inbox_id, (payload as any).inbox)
    if (inboxId) {
      params.inboxId = inboxId
      delete (params as any).inbox_id
    }
    if ((payload as any).limit != null) setIfMissing(params, 'limit', (payload as any).limit)
    if ((payload as any).pageToken != null) setIfMissing(params, 'pageToken', (payload as any).pageToken)
  }

  // Drive request ergonomics: prepare/complete upload often comes malformed at top-level.
  if (scope === 'drive' && method === 'POST' && (resource === 'drive/files/prepare-upload' || resource === 'drive/files/complete-upload')) {
    const workspaceId = firstNonEmptyString((payload as any).workspace_id, (payload as any).workspaceId, data.workspace_id, data.workspaceId)
    const folderId = firstNonEmptyString((payload as any).folder_id, (payload as any).folderId, data.folder_id, data.folderId)
    const fileName = firstNonEmptyString((payload as any).file_name, (payload as any).fileName, data.file_name, data.fileName)
    const fileId = firstNonEmptyString((payload as any).file_id, (payload as any).fileId, data.file_id, data.fileId)
    const storagePath = firstNonEmptyString((payload as any).storage_path, (payload as any).storagePath, data.storage_path, data.storagePath)
    const mime = firstNonEmptyString((payload as any).mime, data.mime)
    const name = firstNonEmptyString((payload as any).name, data.name)

    if (workspaceId) data.workspace_id = workspaceId
    if (folderId) data.folder_id = folderId
    if (fileName) data.file_name = fileName
    if (fileId) data.file_id = fileId
    if (storagePath) data.storage_path = storagePath
    if (mime) data.mime = mime
    if (name) data.name = name
    if ((payload as any).size_bytes != null && data.size_bytes == null) data.size_bytes = (payload as any).size_bytes
    if ((payload as any).sizeBytes != null && data.size_bytes == null) data.size_bytes = (payload as any).sizeBytes
  }

  out.params = params
  out.data = data
  return out
}

function addErrorCodeIfMissing(
  result: unknown,
  context: { scope: WorkspaceToolScope; resource?: string; action?: string; status?: number },
): unknown {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return result
  const obj = result as Record<string, unknown>
  if (obj.code) return result
  const success = obj.success
  if (success !== false) return result
  const msg = String(obj.error || obj.message || '').toLowerCase()

  let code = ''
  if (msg.includes('missing inboxid') || msg.includes('inbox_id é obrigatório') || msg.includes('inboxid é obrigatório')) {
    code = 'EMAIL_INBOX_REQUIRED'
  } else if (msg.includes('resource é obrigatório')) {
    code = 'TOOL_RESOURCE_REQUIRED'
  } else if (msg.includes('resource inválido')) {
    code = 'TOOL_RESOURCE_INVALID'
  } else if (msg.includes('resource/method não permitido')) {
    code = 'TOOL_RESOURCE_METHOD_NOT_ALLOWED'
  } else if (msg.includes('file_id inválido')) {
    code = 'DRIVE_FILE_ID_INVALID'
  } else if (msg.includes('arquivo não encontrado no storage')) {
    code = 'DRIVE_FILE_STORAGE_MISSING'
  } else if (msg.includes('arquivo não encontrado')) {
    code = context.scope === 'drive' ? 'DRIVE_FILE_NOT_FOUND' : 'RESOURCE_NOT_FOUND'
  } else if (msg.includes('supabase storage não configurado')) {
    code = 'DRIVE_STORAGE_NOT_CONFIGURED'
  } else if (msg.includes('to é obrigatório')) {
    code = 'EMAIL_TO_REQUIRED'
  }

  if (!code) return result
  return { ...obj, code }
}

function getResourceRules(scope: WorkspaceToolScope): RouteRule[] {
  if (scope === 'drive') return DRIVE_RESOURCE_RULES
  if (scope === 'email') return EMAIL_RESOURCE_RULES
  return [...DRIVE_RESOURCE_RULES, ...EMAIL_RESOURCE_RULES]
}

function matchesRule(scope: WorkspaceToolScope, resource: string, method: 'GET' | 'POST' | 'DELETE'): boolean {
  const rule = getResourceRules(scope).find((entry) => entry.pattern.test(resource))
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

function looksLikeStorageNotFound(errorTextRaw: unknown): boolean {
  const errorText = String(errorTextRaw || '').toLowerCase()
  if (!errorText) return false
  return (
    errorText.includes('object not found')
    || errorText.includes('not found')
    || errorText.includes('no such')
    || errorText.includes('does not exist')
    || errorText.includes('404')
  )
}

async function softDeleteDriveFile(fileId: string) {
  try {
    await runQuery(
      `UPDATE drive.files
          SET deleted_at = now(),
              updated_at = now()
        WHERE id = $1::uuid
          AND deleted_at IS NULL`,
      [fileId],
    )
  } catch {
    // Best-effort cleanup; do not fail the request if DB update fails.
  }
}

async function forwardWorkspaceRequest(req: NextRequest, payload: WorkspaceRequestAction, scope: WorkspaceToolScope) {
  const method = normalizeMethod(payload.method)
  const resource = toCleanResource(payload.resource)

  if (!resource) {
    return { ok: false, status: 400, result: toolError('TOOL_RESOURCE_REQUIRED', 'resource é obrigatório') }
  }
  if (resource.includes('..')) {
    return { ok: false, status: 400, result: toolError('TOOL_RESOURCE_INVALID', 'resource inválido') }
  }
  if (!matchesRule(scope, resource, method)) {
    return {
      ok: false,
      status: 400,
      result: toolError('TOOL_RESOURCE_METHOD_NOT_ALLOWED', `resource/method não permitido para ${scope}: ${resource} (${method})`),
    }
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
    return { ok: upstream.ok, status, result: addErrorCodeIfMissing(json, { scope, resource, action: 'request', status }) }
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

async function readDriveFile(req: NextRequest, payload: WorkspaceRequestAction) {
  const fileId = String(payload.file_id || '').trim()
  if (!isUuid(fileId)) {
    return { ok: false, status: 400, result: toolError('DRIVE_FILE_ID_INVALID', 'file_id inválido') }
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
    return { ok: false, status: 404, result: toolError('DRIVE_FILE_NOT_FOUND', 'Arquivo não encontrado') }
  }

  const mode = String(payload.mode || 'auto').trim().toLowerCase()
  const downloadUrl = new URL(`/api/drive/files/${fileId}/download`, req.url)
  const res = await fetch(downloadUrl.toString(), { method: 'GET', cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const maybeJson = parseJsonMaybe(text)
    const errorMessage =
      maybeJson && typeof maybeJson === 'object' && !Array.isArray(maybeJson)
        ? String((maybeJson as Record<string, unknown>).message || text || `Falha ao baixar arquivo (${res.status})`)
        : (text || `Falha ao baixar arquivo (${res.status})`)
    return {
      ok: false,
      status: res.status,
      result: addErrorCodeIfMissing({ success: false, error: errorMessage }, { scope: 'drive', action: 'read_file', status: res.status }),
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

async function getDriveFileUrl(payload: WorkspaceRequestAction) {
  const fileId = String(payload.file_id || '').trim()
  if (!isUuid(fileId)) {
    return { ok: false, status: 400, result: toolError('DRIVE_FILE_ID_INVALID', 'file_id inválido') }
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
    return { ok: false, status: 404, result: toolError('DRIVE_FILE_NOT_FOUND', 'Arquivo não encontrado') }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false, status: 500, result: toolError('DRIVE_STORAGE_NOT_CONFIGURED', 'Supabase Storage não configurado no servidor') }
  }

  const expiresInSeconds = 60 * 60
  const bucket = file.bucket_id || 'drive'
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(file.storage_path, expiresInSeconds)
  if (error || !data?.signedUrl) {
    const detail = error?.message || 'erro desconhecido'
    if (looksLikeStorageNotFound(detail)) {
      await softDeleteDriveFile(file.id)
      return {
        ok: false,
        status: 404,
        result: {
          ...toolError('DRIVE_FILE_STORAGE_MISSING', 'Arquivo não encontrado no storage. Metadado removido da lista do Drive.'),
          file_id: file.id,
        },
      }
    }
    return {
      ok: false,
      status: 500,
      result: toolError('DRIVE_SIGNED_URL_FAILED', `Falha ao gerar URL assinada: ${detail}`),
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

function pickAttachmentList(payload: WorkspaceRequestAction) {
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

async function sendEmail(req: NextRequest, payload: WorkspaceRequestAction) {
  const inboxIdRaw = payload.inbox_id ?? payload.inboxId
  const inboxId = typeof inboxIdRaw === 'string' ? inboxIdRaw.trim() : ''
  if (!inboxId) {
    return { ok: false, status: 400, result: toolError('EMAIL_INBOX_REQUIRED', 'inbox_id é obrigatório') }
  }
  if (payload.to == null) {
    return { ok: false, status: 400, result: toolError('EMAIL_TO_REQUIRED', 'to é obrigatório') }
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
  }, 'email')
  return { ok: out.ok, status: out.ok ? 200 : out.status, result: addErrorCodeIfMissing(out.result, { scope: 'email', action: 'send_email', status: out.status }) }
}

function normalizeAction(actionRaw: unknown): string {
  const action = String(actionRaw || 'request').trim().toLowerCase()
  if (action === 'get_file_url') return 'get_drive_file_url'
  if (action === 'send') return 'send_email'
  return action
}

function parseJsonMaybe(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function isActionAllowed(scope: WorkspaceToolScope, action: string): boolean {
  if (scope === 'drive') return action === 'request' || action === 'read_file' || action === 'get_drive_file_url'
  if (scope === 'email') return action === 'request' || action === 'send_email'
  return action === 'request' || action === 'read_file' || action === 'get_drive_file_url' || action === 'send_email'
}

export async function handleWorkspaceToolPost(req: NextRequest, scope: WorkspaceToolScope = 'workspace') {
  try {
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) {
      return Response.json({ ok: false, error: 'unauthorized', code: 'TOOL_UNAUTHORIZED' }, { status: 401 })
    }

    const rawPayload = await req.json().catch(() => ({})) as WorkspaceRequestAction
    const payload = normalizeWorkspaceRequestPayload(scope, rawPayload)
    const action = normalizeAction(payload.action)
    if (!isActionAllowed(scope, action)) {
      return Response.json({ ok: false, error: `Ação inválida para ${scope}: ${action}`, code: 'TOOL_ACTION_INVALID' }, { status: 400 })
    }

    if (action === 'get_drive_file_url') {
      const out = await getDriveFileUrl(payload)
      return Response.json({ ok: out.ok, result: addErrorCodeIfMissing(out.result, { scope: scope === 'workspace' ? 'drive' : scope, action: 'get_drive_file_url', status: out.status }) }, { status: out.status })
    }

    if (action === 'send_email') {
      const out = await sendEmail(req, payload)
      return Response.json({ ok: out.ok, result: addErrorCodeIfMissing(out.result, { scope: 'email', action: 'send_email', status: out.status }) }, { status: out.status })
    }

    if (action === 'read_file') {
      const out = await readDriveFile(req, payload)
      return Response.json({ ok: out.ok, result: addErrorCodeIfMissing(out.result, { scope: 'drive', action: 'read_file', status: out.status }) }, { status: out.status })
    }

    if (action !== 'request') {
      return Response.json({ ok: false, error: `Ação inválida para ${scope}: ${action}`, code: 'TOOL_ACTION_INVALID' }, { status: 400 })
    }

    const out = await forwardWorkspaceRequest(req, payload, scope)
    return Response.json({ ok: out.ok, result: addErrorCodeIfMissing(out.result, { scope, action: 'request', status: out.status }) }, { status: out.ok ? 200 : out.status })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message, code: 'TOOL_HANDLER_ERROR' }, { status: 500 })
  }
}
