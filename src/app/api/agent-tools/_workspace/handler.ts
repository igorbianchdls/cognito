import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'
import {
  getDriveFileDownloadBuffer,
  getSupabaseAdmin,
  handleDriveRequest,
} from '@/app/api/agent-tools/_workspace/driveRuntime'

export type WorkspaceToolScope = 'workspace' | 'drive' | 'email'

export type WorkspaceRequestAction = {
  action?: 'request' | 'read_file' | 'get_drive_file_url' | 'get_file_url' | 'send_email' | 'send' | 'batch'
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
  drive_file_id?: string
  driveFileId?: string
  drive_file_ids?: unknown
  driveFileIds?: unknown
  operations?: unknown
  continue_on_error?: boolean
  continueOnError?: boolean
  from?: string
  q?: string
  search?: string
  date_from?: string
  dateFrom?: string
  date_to?: string
  dateTo?: string
  has_attachments?: boolean | string
  hasAttachments?: boolean | string
  unread?: boolean | string
  label?: string
  labels_any?: unknown
  labelsAny?: unknown
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
  { pattern: /^drive\/files\/upload-base64$/, methods: ['POST'] },
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

function boolOrNull(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  const v = String(value ?? '').trim().toLowerCase()
  if (!v) return null
  if (['1', 'true', 'sim', 'yes'].includes(v)) return true
  if (['0', 'false', 'nao', 'não', 'no'].includes(v)) return false
  return null
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
      ['subject', (payload as any).subject],
      ['from', (payload as any).from],
      ['date_from', (payload as any).date_from],
      ['date_from', (payload as any).dateFrom],
      ['date_to', (payload as any).date_to],
      ['date_to', (payload as any).dateTo],
      ['has_attachments', (payload as any).has_attachments],
      ['has_attachments', (payload as any).hasAttachments],
      ['unread', (payload as any).unread],
      ['label', (payload as any).label],
      ['labels_any', (payload as any).labels_any],
      ['labels_any', (payload as any).labelsAny],
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

  out.params = params
  out.data = data
  return out
}

function normalizeEmailMessagesListResult(raw: unknown): { messages: Record<string, unknown>[]; assign: (messages: Record<string, unknown>[]) => unknown } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>

  if (Array.isArray(obj.messages)) {
    return {
      messages: obj.messages.filter((m): m is Record<string, unknown> => !!m && typeof m === 'object' && !Array.isArray(m)),
      assign: (messages) => ({ ...obj, messages, count: messages.length }),
    }
  }

  const data = obj.data
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as Record<string, unknown>).messages)) {
    const dataObj = data as Record<string, unknown>
    const dataMessages = dataObj.messages as unknown[]
    return {
      messages: dataMessages.filter((m): m is Record<string, unknown> => !!m && typeof m === 'object' && !Array.isArray(m)),
      assign: (messages) => ({
        ...obj,
        data: {
          ...dataObj,
          messages,
          count: messages.length,
          filtered: true,
        },
      }),
    }
  }

  return null
}

function toTimestampMs(value: unknown): number | null {
  const s = String(value ?? '').trim()
  if (!s) return null
  const ms = Date.parse(s)
  return Number.isFinite(ms) ? ms : null
}

function matchesEmailMessageFilters(message: Record<string, unknown>, params: Record<string, unknown>): boolean {
  const subjectNeedle = String(params.subject || '').trim().toLowerCase()
  const fromNeedle = String(params.from || '').trim().toLowerCase()
  const searchNeedle = String(params.search || params.q || '').trim().toLowerCase()
  const labelOne = String(params.label || '').trim().toLowerCase()
  const labelsAnyRaw = params.labels_any
  const unreadOnly = boolOrNull(params.unread)
  const hasAttachments = boolOrNull(params.has_attachments)
  const dateFromMs = toTimestampMs(params.date_from)
  const dateToMs = toTimestampMs(params.date_to)

  const subject = String(message.subject || '').toLowerCase()
  const from = String(message.from || '').toLowerCase()
  const preview = String(message.preview || '').toLowerCase()
  const to = Array.isArray(message.to) ? message.to.map((v) => String(v || '').toLowerCase()) : []
  const labels = Array.isArray(message.labels) ? message.labels.map((v) => String(v || '').toLowerCase()) : []
  const attachments = Array.isArray(message.attachments) ? message.attachments : []
  const timestampMs = toTimestampMs(message.timestamp || message.createdAt || message.updatedAt)

  if (subjectNeedle && !subject.includes(subjectNeedle)) return false
  if (fromNeedle && !from.includes(fromNeedle)) return false
  if (searchNeedle) {
    const hay = [subject, from, preview, ...to].join(' ')
    if (!hay.includes(searchNeedle)) return false
  }
  if (labelOne && !labels.includes(labelOne)) return false

  const labelsAny = Array.isArray(labelsAnyRaw)
    ? labelsAnyRaw.map((v) => String(v || '').trim().toLowerCase()).filter(Boolean)
    : String(labelsAnyRaw || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean)
  if (labelsAny.length && !labelsAny.some((lbl) => labels.includes(lbl))) return false

  if (unreadOnly != null) {
    const isUnread = labels.includes('unread')
    if (isUnread !== unreadOnly) return false
  }

  if (hasAttachments != null) {
    const has = attachments.length > 0
    if (has !== hasAttachments) return false
  }

  if (dateFromMs != null && timestampMs != null && timestampMs < dateFromMs) return false
  if (dateToMs != null && timestampMs != null && timestampMs > dateToMs) return false

  return true
}

function maybeFilterEmailMessagesResult(payload: WorkspaceRequestAction, scope: WorkspaceToolScope, method: 'GET' | 'POST' | 'DELETE', resource: string, result: unknown): unknown {
  if (scope !== 'email' || method !== 'GET' || resource !== 'email/messages') return result
  const params = objectOrEmpty(payload.params)
  const hasFilter =
    String(params.subject || '').trim() ||
    String(params.from || '').trim() ||
    String(params.q || params.search || '').trim() ||
    String(params.date_from || '').trim() ||
    String(params.date_to || '').trim() ||
    String(params.label || '').trim() ||
    params.labels_any != null ||
    params.unread != null ||
    params.has_attachments != null
  if (!hasFilter) return result
  const normalized = normalizeEmailMessagesListResult(result)
  if (!normalized) return result
  const filtered = normalized.messages.filter((m) => matchesEmailMessageFilters(m, params))
  return normalized.assign(filtered)
}

function addErrorCodeIfMissing(
  result: unknown,
  context: { scope: WorkspaceToolScope; resource?: string; action?: string; status?: number },
): unknown {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return result
  const obj = result as Record<string, unknown>
  if (obj.code) return result
  const success = obj.success
  const okFlag = obj.ok
  if (success !== false && okFlag !== false) return result
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
  } else if (msg.includes('content_base64 é obrigatório')) {
    code = 'DRIVE_CONTENT_BASE64_REQUIRED'
  } else if (msg.includes('to é obrigatório')) {
    code = 'EMAIL_TO_REQUIRED'
  }

  if (!code) return result
  return { ...obj, code }
}

function pickPrimaryData(result: unknown): unknown {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return result
  const obj = result as Record<string, unknown>
  if ('data' in obj) return obj.data
  return result
}

function inferToolSuccess(result: unknown, fallbackOk: boolean): boolean {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return fallbackOk
  const obj = result as Record<string, unknown>
  if (typeof obj.success === 'boolean') return obj.success
  if (typeof obj.ok === 'boolean') return obj.ok
  return fallbackOk
}

function toolResponseBody(input: {
  ok: boolean
  status: number
  scope: WorkspaceToolScope | 'documento' | 'crud'
  action: string
  result: unknown
  resource?: string
}) {
  const normalizedResult = addErrorCodeIfMissing(input.result, {
    scope: (input.scope === 'documento' || input.scope === 'crud') ? 'workspace' : input.scope,
    action: input.action,
    resource: input.resource,
    status: input.status,
  })
  const success = inferToolSuccess(normalizedResult, input.ok)
  const data = success ? pickPrimaryData(normalizedResult) : null
  const obj = (normalizedResult && typeof normalizedResult === 'object' && !Array.isArray(normalizedResult))
    ? normalizedResult as Record<string, unknown>
    : null
  const error = success ? undefined : String(obj?.error || obj?.message || 'erro')
  const code = success ? undefined : (typeof obj?.code === 'string' ? obj.code : undefined)

  return {
    ok: input.ok,
    result: normalizedResult,
    success,
    data,
    ...(error ? { error } : {}),
    ...(code ? { code } : {}),
    meta: {
      tool: input.scope,
      action: input.action,
      status: input.status,
      ...(input.resource ? { resource: input.resource } : {}),
    },
  }
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

  if (scope === 'drive') {
    return handleDriveRequest(req, payload)
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
    const filtered = maybeFilterEmailMessagesResult(payload, scope, method, resource, json)
    return { ok: upstream.ok, status, result: addErrorCodeIfMissing(filtered, { scope, resource, action: 'request', status }) }
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
  const download = await getDriveFileDownloadBuffer(fileId)
  if (!download.ok) {
    const result =
      download.result && typeof download.result === 'object' && !Array.isArray(download.result)
        ? download.result as Record<string, unknown>
        : {}
    const errorMessage = String(result.error || result.message || `Falha ao baixar arquivo (${download.status})`)
    return {
      ok: false,
      status: download.status,
      result: addErrorCodeIfMissing({ success: false, error: errorMessage }, { scope: 'drive', action: 'read_file', status: download.status }),
    }
  }

  const buffer = download.buffer
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

function parseDriveFileIdsFromEmailPayload(payload: WorkspaceRequestAction): string[] {
  const out: string[] = []
  const pushId = (value: unknown) => {
    const v = String(value || '').trim()
    if (!v || !isUuid(v)) return
    if (!out.includes(v)) out.push(v)
  }

  pushId(payload.drive_file_id)
  pushId(payload.driveFileId)

  const multi = payload.drive_file_ids ?? payload.driveFileIds
  if (Array.isArray(multi)) {
    for (const item of multi) pushId(item)
  } else if (typeof multi === 'string') {
    for (const part of multi.split(',')) pushId(part)
  }

  return out
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

  const driveFileIds = parseDriveFileIdsFromEmailPayload(payload)
  const derivedDriveAttachments: Array<Record<string, unknown>> = []
  for (const driveFileId of driveFileIds) {
    const fileUrl = await getDriveFileUrl({ ...payload, file_id: driveFileId })
    if (!fileUrl.ok) {
      return {
        ok: false,
        status: fileUrl.status,
        result: {
          ...(fileUrl.result as Record<string, unknown>),
          message: (fileUrl.result as any)?.error || (fileUrl.result as any)?.message || 'Falha ao anexar arquivo do Drive',
          drive_file_id: driveFileId,
        },
      }
    }
    const r = fileUrl.result as Record<string, unknown>
    derivedDriveAttachments.push({
      filename: typeof r.filename === 'string' ? r.filename : undefined,
      contentType: typeof r.content_type === 'string' ? r.content_type : undefined,
      url: typeof r.signed_url === 'string' ? r.signed_url : undefined,
    })
  }

  const attachments = [
    ...(pickAttachmentList(payload) || []),
    ...derivedDriveAttachments,
  ]

  const emailBody = {
    inboxId,
    to: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    labels: payload.labels,
    subject: typeof payload.subject === 'string' ? payload.subject : undefined,
    text: typeof payload.text === 'string' ? payload.text : undefined,
    html: typeof payload.html === 'string' ? payload.html : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
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
  if (scope === 'drive') return action === 'request' || action === 'read_file' || action === 'get_drive_file_url' || action === 'batch'
  if (scope === 'email') return action === 'request' || action === 'send_email' || action === 'batch'
  return action === 'request' || action === 'read_file' || action === 'get_drive_file_url' || action === 'send_email' || action === 'batch'
}

export async function handleWorkspaceToolPost(req: NextRequest, scope: WorkspaceToolScope = 'workspace') {
  try {
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) {
      return Response.json(
        toolResponseBody({ ok: false, status: 401, scope, action: 'auth', result: { success: false, error: 'unauthorized', code: 'TOOL_UNAUTHORIZED' } }),
        { status: 401 },
      )
    }

    const rawPayload = await req.json().catch(() => ({})) as WorkspaceRequestAction
    const payload = normalizeWorkspaceRequestPayload(scope, rawPayload)
    const action = normalizeAction(payload.action)
    if (!isActionAllowed(scope, action)) {
      return Response.json(
        toolResponseBody({ ok: false, status: 400, scope, action, result: { success: false, error: `Ação inválida para ${scope}: ${action}`, code: 'TOOL_ACTION_INVALID' } }),
        { status: 400 },
      )
    }

    if (action === 'get_drive_file_url') {
      const out = await getDriveFileUrl(payload)
      return Response.json(
        toolResponseBody({
          ok: out.ok,
          status: out.status,
          scope: scope === 'workspace' ? 'drive' : scope,
          action: 'get_drive_file_url',
          result: out.result,
        }),
        { status: out.status },
      )
    }

    if (action === 'batch') {
      const opsRaw = Array.isArray(rawPayload.operations) ? rawPayload.operations : []
      if (!opsRaw.length) {
        return Response.json(
          toolResponseBody({ ok: false, status: 400, scope, action: 'batch', result: { success: false, error: 'operations é obrigatório e deve ser array não vazio', code: 'TOOL_BATCH_OPERATIONS_REQUIRED' } }),
          { status: 400 },
        )
      }
      const continueOnError = boolOrNull(rawPayload.continue_on_error ?? rawPayload.continueOnError) ?? true
      const items: Array<Record<string, unknown>> = []
      let failed = 0

      for (let i = 0; i < opsRaw.length; i += 1) {
        const itemPayload = normalizeWorkspaceRequestPayload(scope, objectOrEmpty(opsRaw[i]) as WorkspaceRequestAction)
        const itemAction = normalizeAction(itemPayload.action)
        if (!isActionAllowed(scope, itemAction) || itemAction === 'batch') {
          failed += 1
          items.push({
            index: i,
            ok: false,
            status: 400,
            action: itemAction || null,
            resource: toCleanResource(itemPayload.resource),
            result: { success: false, error: `Ação inválida para batch/${scope}: ${itemAction}`, code: 'TOOL_ACTION_INVALID' },
          })
          if (!continueOnError) break
          continue
        }

        let itemOut: { ok: boolean; status: number; result: unknown }
        if (itemAction === 'get_drive_file_url') itemOut = await getDriveFileUrl(itemPayload)
        else if (itemAction === 'send_email') itemOut = await sendEmail(req, itemPayload)
        else if (itemAction === 'read_file') itemOut = await readDriveFile(req, itemPayload)
        else itemOut = await forwardWorkspaceRequest(req, itemPayload, scope)

        if (!itemOut.ok) failed += 1
        items.push({
          index: i,
          ok: itemOut.ok,
          status: itemOut.status,
          action: itemAction,
          resource: toCleanResource(itemPayload.resource),
          result: itemOut.result,
        })
        if (!itemOut.ok && !continueOnError) break
      }

      const total = items.length
      const passed = total - failed
      const batchOk = failed === 0
      return Response.json(
        toolResponseBody({
          ok: batchOk,
          status: batchOk ? 200 : 207,
          scope,
          action: 'batch',
          result: {
            success: batchOk,
            items,
            summary: { total, passed, failed, continue_on_error: continueOnError },
          },
        }),
        { status: batchOk ? 200 : 207 },
      )
    }

    if (action === 'send_email') {
      const out = await sendEmail(req, payload)
      return Response.json(
        toolResponseBody({ ok: out.ok, status: out.status, scope: 'email', action: 'send_email', result: out.result }),
        { status: out.status },
      )
    }

    if (action === 'read_file') {
      const out = await readDriveFile(req, payload)
      return Response.json(
        toolResponseBody({ ok: out.ok, status: out.status, scope: 'drive', action: 'read_file', result: out.result }),
        { status: out.status },
      )
    }

    if (action !== 'request') {
      return Response.json(
        toolResponseBody({ ok: false, status: 400, scope, action, result: { success: false, error: `Ação inválida para ${scope}: ${action}`, code: 'TOOL_ACTION_INVALID' } }),
        { status: 400 },
      )
    }

    const out = await forwardWorkspaceRequest(req, payload, scope)
    return Response.json(
      toolResponseBody({ ok: out.ok, status: out.ok ? 200 : out.status, scope, action: 'request', result: out.result, resource: toCleanResource(payload.resource) }),
      { status: out.ok ? 200 : out.status },
    )
  } catch (e) {
    return Response.json(
      toolResponseBody({ ok: false, status: 500, scope, action: 'handler', result: { success: false, error: (e as Error).message, code: 'TOOL_HANDLER_ERROR' } }),
      { status: 500 },
    )
  }
}
