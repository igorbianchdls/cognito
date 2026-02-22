export type FolderKey = 'inbox' | 'drafts' | 'sent' | 'junk' | 'trash' | 'archive'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const obj = asRecord(data)
  if (!obj) return []

  const directCandidates = [obj.items, obj.inboxes, obj.messages, obj.results, obj.rows]
  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate
  }

  const nestedObj = asRecord(obj.data)
  if (nestedObj) {
    const nested = [nestedObj.items, nestedObj.inboxes, nestedObj.messages, nestedObj.results, nestedObj.rows]
    for (const candidate of nested) {
      if (Array.isArray(candidate)) return candidate
    }
  }

  return []
}

export function asLowerLabels(message: unknown): Set<string> {
  const obj = asRecord(message)
  const labels = Array.isArray(obj?.labels) ? obj.labels : []
  return new Set(labels.map((l) => String(l || '').trim().toLowerCase()).filter(Boolean))
}

export function messageInFolder(message: unknown, folder: FolderKey): boolean {
  const obj = asRecord(message)
  if (!obj) return false
  const labels = asLowerLabels(obj)
  const hasLabel = (...candidates: string[]) => candidates.some((v) => labels.has(v))

  const sent = Boolean(obj.sent || obj.isSent || hasLabel('sent', 'outbound'))
  const drafts = Boolean(obj.draft || obj.isDraft || hasLabel('draft', 'drafts'))
  const archive = Boolean(obj.archived || obj.isArchived || hasLabel('archive', 'archived'))
  const trash = Boolean(obj.trashed || obj.isTrashed || obj.deleted || hasLabel('trash', 'deleted'))
  const junk = Boolean(obj.junk || obj.isJunk || hasLabel('junk', 'spam'))

  if (folder === 'sent') return sent
  if (folder === 'drafts') return drafts
  if (folder === 'archive') return archive
  if (folder === 'trash') return trash
  if (folder === 'junk') return junk
  return !sent && !drafts && !archive && !trash && !junk
}

export function getMessageId(message: unknown): string {
  const obj = asRecord(message)
  return String(obj?.id || obj?.messageId || obj?.message_id || '').trim()
}

export function getInboxId(inbox: unknown): string {
  const obj = asRecord(inbox)
  return String(obj?.inboxId || obj?.id || '').trim()
}

export function getInboxLabel(inbox: unknown, index: number): string {
  const obj = asRecord(inbox)
  const label = String(obj?.displayName || obj?.username || obj?.email || obj?.inboxId || '').trim()
  return label || `Inbox ${index + 1}`
}

export function getSenderName(message: unknown): string {
  const obj = asRecord(message)
  const from = asRecord(obj?.from)
  return String(from?.name || obj?.from_name || obj?.from || 'Sem remetente')
}

export function getSenderEmail(message: unknown): string {
  const obj = asRecord(message)
  const from = asRecord(obj?.from)
  return String(from?.email || obj?.from_email || '').trim()
}

export function getSubject(message: unknown): string {
  const obj = asRecord(message)
  return String(obj?.subject || 'Sem assunto')
}

export function getSnippet(message: unknown): string {
  const obj = asRecord(message)
  return String(obj?.snippet || obj?.preview || obj?.text || '').trim()
}

export function getLabels(message: unknown): string[] {
  const obj = asRecord(message)
  if (!Array.isArray(obj?.labels)) return []
  return obj.labels.map((l) => String(l || '').trim()).filter(Boolean)
}

export function isUnread(message: unknown): boolean {
  const obj = asRecord(message)
  return Boolean(obj?.unread || obj?.isUnread)
}

export function formatRelativeDate(value: unknown): string {
  if (!value) return ''
  const raw = String(value)
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw

  const now = new Date()
  const diffMs = now.getTime() - parsed.getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  if (diffDays < 1) return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  const months = Math.floor(diffDays / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

export function formatAbsoluteDate(value: unknown): string {
  if (!value) return ''
  const raw = String(value)
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
