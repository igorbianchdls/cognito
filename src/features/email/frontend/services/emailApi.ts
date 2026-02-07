const ACTIVE_INBOX_STORAGE_KEY = 'email.activeInboxId'

type JsonObject = Record<string, any>

async function parseJson(res: Response): Promise<JsonObject> {
  return (await res.json().catch(() => ({}))) as JsonObject
}

function throwIfRequestFailed(res: Response, json: JsonObject, fallback: string) {
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || `${fallback}: ${res.status}`)
  }
}

export async function fetchEmailInboxes() {
  const res = await fetch('/api/email/inboxes', { cache: 'no-store' })
  const json = await parseJson(res)
  throwIfRequestFailed(res, json, 'Falha inboxes')
  return json
}

export async function deleteEmailInbox(inboxId: string) {
  const res = await fetch('/api/email/inboxes', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inboxId }),
  })
  const json = await parseJson(res)
  throwIfRequestFailed(res, json, 'Falha ao excluir inbox')
  return json
}

export async function fetchEmailMessages(inboxId: string, limit = 100) {
  const params = new URLSearchParams()
  params.set('inboxId', inboxId)
  params.set('limit', String(limit))

  const res = await fetch(`/api/email/messages?${params.toString()}`, { cache: 'no-store' })
  const json = await parseJson(res)
  throwIfRequestFailed(res, json, 'Falha messages')
  return json
}

export async function fetchEmailMessageById(messageId: string, inboxId?: string) {
  const encodedId = encodeURIComponent(messageId)
  const query = inboxId ? `?inboxId=${encodeURIComponent(inboxId)}` : ''
  const res = await fetch(`/api/email/messages/${encodedId}${query}`, { cache: 'no-store' })
  const json = await parseJson(res)
  throwIfRequestFailed(res, json, 'Falha ao carregar mensagem')
  return json
}

export async function runEmailMessageAction(messageId: string, payload: Record<string, unknown>) {
  const encodedId = encodeURIComponent(messageId)
  const res = await fetch(`/api/email/messages/${encodedId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await parseJson(res)
  throwIfRequestFailed(res, json, 'Falha')
  return json
}

export function readStoredActiveInboxId() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(ACTIVE_INBOX_STORAGE_KEY) || ''
}

export function writeStoredActiveInboxId(inboxId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_INBOX_STORAGE_KEY, inboxId)
}

export function removeStoredActiveInboxId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACTIVE_INBOX_STORAGE_KEY)
}

export function updateInboxQueryString(inboxId: string | null) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (inboxId) {
    url.searchParams.set('inboxId', inboxId)
  } else {
    url.searchParams.delete('inboxId')
  }
  history.replaceState(null, '', url.toString())
}

export function buildAttachmentDownloadUrl(messageId: string, attachmentId: string, inboxId: string) {
  return `/api/email/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}?inboxId=${encodeURIComponent(inboxId)}`
}
