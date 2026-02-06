"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import {
  Archive,
  ChevronDown,
  Clock3,
  FileText,
  Inbox,
  MailOpen,
  Reply,
  Search,
  Send,
  Trash2,
  Undo2,
  Redo2,
  MoreVertical,
} from 'lucide-react'

type FolderKey = 'inbox' | 'drafts' | 'sent' | 'junk' | 'trash' | 'archive'

type CategoryKey = 'social' | 'updates' | 'forums' | 'shopping' | 'promotions'

const PRIMARY_FOLDERS: Array<{ key: FolderKey; name: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'inbox', name: 'Inbox', icon: Inbox },
  { key: 'drafts', name: 'Drafts', icon: FileText },
  { key: 'sent', name: 'Sent', icon: Send },
  { key: 'junk', name: 'Junk', icon: Inbox },
  { key: 'trash', name: 'Trash', icon: Trash2 },
  { key: 'archive', name: 'Archive', icon: Archive },
]

const CATEGORY_FILTERS: Array<{ key: CategoryKey; name: string; labels: string[] }> = [
  { key: 'social', name: 'Social', labels: ['social'] },
  { key: 'updates', name: 'Updates', labels: ['updates', 'update'] },
  { key: 'forums', name: 'Forums', labels: ['forum', 'forums'] },
  { key: 'shopping', name: 'Shopping', labels: ['shopping', 'shop'] },
  { key: 'promotions', name: 'Promotions', labels: ['promotion', 'promotions', 'promo'] },
]

function extractList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []

  const directCandidates = [data.items, data.inboxes, data.messages, data.results, data.rows]
  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate
  }

  if (data.data && typeof data.data === 'object') {
    const nested = [data.data.items, data.data.inboxes, data.data.messages, data.data.results, data.data.rows]
    for (const candidate of nested) {
      if (Array.isArray(candidate)) return candidate
    }
  }

  return []
}

function asLowerLabels(message: any): Set<string> {
  const labels = Array.isArray(message?.labels) ? message.labels : []
  return new Set(labels.map((l: any) => String(l || '').trim().toLowerCase()).filter(Boolean))
}

function messageInFolder(message: any, folder: FolderKey): boolean {
  if (!message || typeof message !== 'object') return false
  const labels = asLowerLabels(message)
  const hasLabel = (...candidates: string[]) => candidates.some((v) => labels.has(v))

  const sent = Boolean(message?.sent || message?.isSent || hasLabel('sent', 'outbound'))
  const drafts = Boolean(message?.draft || message?.isDraft || hasLabel('draft', 'drafts'))
  const archive = Boolean(message?.archived || message?.isArchived || hasLabel('archive', 'archived'))
  const trash = Boolean(message?.trashed || message?.isTrashed || message?.deleted || hasLabel('trash', 'deleted'))
  const junk = Boolean(message?.junk || message?.isJunk || hasLabel('junk', 'spam'))

  if (folder === 'sent') return sent
  if (folder === 'drafts') return drafts
  if (folder === 'archive') return archive
  if (folder === 'trash') return trash
  if (folder === 'junk') return junk
  return !sent && !drafts && !archive && !trash && !junk
}

function getMessageId(message: any): string {
  return String(message?.id || message?.messageId || message?.message_id || '').trim()
}

function getSenderName(message: any): string {
  return String(message?.from?.name || message?.from_name || message?.from || 'Sem remetente')
}

function getSenderEmail(message: any): string {
  return String(message?.from?.email || message?.from_email || '').trim()
}

function getSubject(message: any): string {
  return String(message?.subject || 'Sem assunto')
}

function getSnippet(message: any): string {
  return String(message?.snippet || message?.preview || message?.text || '').trim()
}

function getLabels(message: any): string[] {
  if (!Array.isArray(message?.labels)) return []
  return message.labels.map((l: any) => String(l || '').trim()).filter(Boolean)
}

function isUnread(message: any): boolean {
  return Boolean(message?.unread || message?.isUnread)
}

function formatRelativeDate(value: any): string {
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

function formatAbsoluteDate(value: any): string {
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

export default function EmailPage() {
  const [folder, setFolder] = useState<FolderKey>('inbox')
  const [mailView, setMailView] = useState<'all' | 'unread'>('all')
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null)

  const [inboxes, setInboxes] = useState<any[]>([])
  const [activeInboxId, setActiveInboxId] = useState('')
  const [loadingInboxes, setLoadingInboxes] = useState(false)

  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [qsInboxId, setQsInboxId] = useState('')

  const [selectedMessageId, setSelectedMessageId] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [loadingSelectedMessage, setLoadingSelectedMessage] = useState(false)
  const [selectedMessageError, setSelectedMessageError] = useState('')

  const [replyDraft, setReplyDraft] = useState('')
  const [muteThread, setMuteThread] = useState(false)

  const activeInboxLabel = useMemo(() => {
    const current = inboxes.find((ib: any) => (ib?.inboxId || ib?.id) === activeInboxId)
    if (!current || typeof current !== 'object') return ''
    return String(current.displayName || current.username || current.email || current.inboxId || '')
  }, [inboxes, activeInboxId])

  const folderCounts = useMemo(() => {
    const counts: Record<FolderKey, number> = {
      inbox: 0,
      drafts: 0,
      sent: 0,
      junk: 0,
      trash: 0,
      archive: 0,
    }
    for (const m of messages) {
      for (const f of PRIMARY_FOLDERS) {
        if (messageInFolder(m, f.key)) counts[f.key] += 1
      }
    }
    return counts
  }, [messages])

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      social: 0,
      updates: 0,
      forums: 0,
      shopping: 0,
      promotions: 0,
    }

    for (const m of messages) {
      const labels = asLowerLabels(m)
      for (const c of CATEGORY_FILTERS) {
        if (c.labels.some((l) => labels.has(l))) counts[c.key] += 1
      }
    }
    return counts
  }, [messages])

  const listedMessages = useMemo(() => {
    let list = messages.filter((m: any) => messageInFolder(m, folder))

    if (activeCategory) {
      const category = CATEGORY_FILTERS.find((c) => c.key === activeCategory)
      if (category) {
        list = list.filter((m: any) => {
          const labels = asLowerLabels(m)
          return category.labels.some((l) => labels.has(l))
        })
      }
    }

    if (mailView === 'unread') {
      list = list.filter((m: any) => isUnread(m))
    }

    const q = search.trim().toLowerCase()
    if (!q) return list

    return list.filter((m: any) => {
      const fromName = getSenderName(m).toLowerCase()
      const subject = getSubject(m).toLowerCase()
      const snippet = getSnippet(m).toLowerCase()
      return fromName.includes(q) || subject.includes(q) || snippet.includes(q)
    })
  }, [messages, folder, activeCategory, mailView, search])

  const selectedListMessage = useMemo(() => {
    if (!listedMessages.length) return null
    return listedMessages.find((m: any) => getMessageId(m) === selectedMessageId) || listedMessages[0]
  }, [listedMessages, selectedMessageId])

  const selectedMessageView = useMemo(() => {
    if (!selectedListMessage) return null
    if (selectedMessage && getMessageId(selectedMessage) === getMessageId(selectedListMessage)) return selectedMessage
    return selectedListMessage
  }, [selectedListMessage, selectedMessage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const v = new URL(window.location.href).searchParams.get('inboxId') || ''
        setQsInboxId(v)
      } catch {}
    }
  }, [])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoadingInboxes(true)
      setError('')
      try {
        const res = await fetch('/api/email/inboxes', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha inboxes: ${res.status}`)
          const list = extractList(json?.data)
          setInboxes(list)
          const stored = typeof window !== 'undefined' ? localStorage.getItem('email.activeInboxId') || '' : ''
          const chosen = qsInboxId || stored || (list[0]?.inboxId || list[0]?.id || '')
          if (chosen) setActiveInboxId(chosen)
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || String(e))
      } finally {
        if (!ignore) setLoadingInboxes(false)
      }
    })()
    return () => { ignore = true }
  }, [qsInboxId])

  useEffect(() => {
    if (!activeInboxId) return
    if (typeof window !== 'undefined') {
      localStorage.setItem('email.activeInboxId', activeInboxId)
      const url = new URL(window.location.href)
      url.searchParams.set('inboxId', activeInboxId)
      history.replaceState(null, '', url.toString())
    }

    let ignore = false
    ;(async () => {
      setLoadingMessages(true)
      setError('')
      try {
        const params = new URLSearchParams()
        params.set('inboxId', activeInboxId)
        params.set('limit', '100')
        const res = await fetch(`/api/email/messages?${params.toString()}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha messages: ${res.status}`)
          const list = extractList(json?.data)
          setMessages(list)
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || String(e))
      } finally {
        if (!ignore) setLoadingMessages(false)
      }
    })()
    return () => { ignore = true }
  }, [activeInboxId, reloadKey])

  useEffect(() => {
    if (!listedMessages.length) {
      setSelectedMessageId('')
      setSelectedMessage(null)
      setSelectedMessageError('')
      return
    }

    const exists = listedMessages.some((m: any) => getMessageId(m) === selectedMessageId)
    if (!exists) {
      setSelectedMessageId(getMessageId(listedMessages[0]))
      setSelectedMessage(null)
      setSelectedMessageError('')
      setReplyDraft('')
    }
  }, [listedMessages, selectedMessageId])

  useEffect(() => {
    if (!activeInboxId || !selectedMessageId) return

    let ignore = false
    ;(async () => {
      setLoadingSelectedMessage(true)
      setSelectedMessageError('')
      try {
        const res = await fetch(`/api/email/messages/${encodeURIComponent(selectedMessageId)}?inboxId=${encodeURIComponent(activeInboxId)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha ao carregar mensagem: ${res.status}`)
          setSelectedMessage(json?.data || null)
        }
      } catch (e: any) {
        if (!ignore) {
          setSelectedMessageError(e?.message || String(e))
          setSelectedMessage(null)
        }
      } finally {
        if (!ignore) setLoadingSelectedMessage(false)
      }
    })()

    return () => { ignore = true }
  }, [activeInboxId, selectedMessageId, reloadKey])

  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-500">Carregando…</div>}>
      <SidebarProvider>
        <SidebarShadcn showHeaderTrigger={false} />
        <SidebarInset className="h-screen overflow-hidden bg-white">
          <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[240px_380px_minmax(0,1fr)]">
            <aside className="hidden h-full min-h-0 flex-col border-r border-neutral-200 bg-white xl:flex">
              <div className="flex h-12 items-center border-b border-neutral-200 px-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-700">▲</span>
                  <select
                    value={activeInboxId}
                    onChange={(e) => setActiveInboxId(e.target.value)}
                    className="h-8 w-full appearance-none rounded-lg border border-neutral-200 bg-white pl-7 pr-8 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-300"
                  >
                    <option value="" disabled>{loadingInboxes ? 'Carregando inboxes…' : 'Selecione uma inbox'}</option>
                    {(Array.isArray(inboxes) ? inboxes : []).map((ib: any, index: number) => {
                      if (!ib || typeof ib !== 'object') return null
                      const inboxValue = ib.inboxId || ib.id || ''
                      const inboxLabel = (ib.displayName || ib.username || ib.email || ib.inboxId || '').toString()
                      return (
                        <option key={inboxValue || `inbox-${index}`} value={inboxValue}>
                          {inboxLabel || `Inbox ${index + 1}`}
                        </option>
                      )
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <div className="space-y-0.5 p-2">
                  {PRIMARY_FOLDERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setFolder(f.key)
                        setActiveCategory(null)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm ${
                        folder === f.key && !activeCategory
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <f.icon className="size-4" />
                        {f.name}
                      </span>
                      <span className={`text-xs ${folder === f.key && !activeCategory ? 'text-white/90' : 'text-neutral-500'}`}>{folderCounts[f.key]}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-1 border-t border-neutral-200 p-2">
                  {CATEGORY_FILTERS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => {
                        setActiveCategory(c.key)
                        setFolder('inbox')
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm ${
                        activeCategory === c.key ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-neutral-500">{categoryCounts[c.key]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="min-h-0 border-r border-neutral-200 bg-white">
              <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr]">
                <div className="flex h-12 items-center justify-between border-b border-neutral-200 px-4">
                  <div className="text-xl leading-none font-semibold tracking-tight text-neutral-900">Inbox</div>
                  <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                    <button
                      onClick={() => setMailView('all')}
                      className={`rounded-md px-3 py-1 text-sm ${mailView === 'all' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'}`}
                    >
                      All mail
                    </button>
                    <button
                      onClick={() => setMailView('unread')}
                      className={`rounded-md px-3 py-1 text-sm ${mailView === 'unread' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'}`}
                    >
                      Unread
                    </button>
                  </div>
                </div>

                <div className="border-b border-neutral-200 px-4 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-11 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
                      placeholder="Search"
                    />
                  </div>
                  {error ? <div className="mt-2 text-xs text-red-700">{error}</div> : null}
                  {activeInboxLabel ? <div className="mt-2 text-xs text-neutral-500">{activeInboxLabel}</div> : null}
                </div>

                <div className="min-h-0 space-y-2 overflow-auto bg-white p-3">
                  {loadingMessages ? (
                    <div className="py-10 text-center text-sm text-neutral-500">Carregando mensagens…</div>
                  ) : listedMessages.length === 0 ? (
                    <div className="py-10 text-center text-sm text-neutral-500">Nenhuma mensagem encontrada.</div>
                  ) : (
                    listedMessages.map((m: any, index: number) => {
                      const id = getMessageId(m)
                      const selected = id && id === getMessageId(selectedListMessage)
                      const sender = getSenderName(m)
                      const subject = getSubject(m)
                      const snippet = getSnippet(m)
                      const labels = getLabels(m)
                      const date = formatRelativeDate(m.date || m.createdAt || m.created_at || m.timestamp)

                      return (
                        <button
                          key={id || `msg-${index}`}
                          onClick={() => id && setSelectedMessageId(id)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                            selected
                              ? 'border-neutral-300 bg-neutral-50'
                              : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <div className="truncate text-base font-semibold text-neutral-900">{sender}</div>
                              {isUnread(m) ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" /> : null}
                            </div>
                            <div className="shrink-0 text-sm text-neutral-500">{date}</div>
                          </div>
                          <div className="mt-0.5 truncate text-sm font-medium text-neutral-900">{subject}</div>
                          <div className="mt-1.5 text-sm leading-5 text-neutral-500" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {snippet || 'No preview available'}
                          </div>
                          {labels.length > 0 ? (
                            <div className="mt-2 inline-flex flex-wrap gap-1.5">
                              {labels.slice(0, 3).map((label) => (
                                <span
                                  key={label}
                                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                    label.toLowerCase() === 'work' ? 'bg-neutral-900 text-white' : 'border border-neutral-200 bg-white text-neutral-700'
                                  }`}
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </section>

            <section className="hidden min-h-0 bg-white xl:flex xl:flex-col">
              <div className="flex h-12 items-center justify-between border-b border-neutral-200 px-4">
                <div className="inline-flex items-center gap-2 text-neutral-700">
                  <button className="rounded-md p-1.5 hover:bg-neutral-100"><Archive className="size-4" /></button>
                  <button className="rounded-md p-1.5 hover:bg-neutral-100"><MailOpen className="size-4" /></button>
                  <button className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
                  <button className="rounded-md p-1.5 hover:bg-neutral-100"><Clock3 className="size-4" /></button>
                </div>
                <div className="inline-flex items-center gap-2 text-neutral-700">
                  <button className="rounded-md p-1.5 hover:bg-neutral-100"><Undo2 className="size-4" /></button>
                  <button className="rounded-md p-1.5 hover:bg-neutral-100"><Redo2 className="size-4" /></button>
                  <button className="rounded-md p-1.5 hover:bg-neutral-100"><Reply className="size-4" /></button>
                  <button className="rounded-md p-1.5 hover:bg-neutral-100"><MoreVertical className="size-4" /></button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {!selectedMessageView ? (
                  <div className="grid h-full place-items-center text-sm text-neutral-500">Selecione um email para visualizar.</div>
                ) : (
                  <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto]">
                    <div className="border-b border-neutral-200 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700">
                            {getSenderName(selectedMessageView).trim().charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-neutral-900">{getSenderName(selectedMessageView)}</div>
                            <div className="truncate text-sm text-neutral-900">{getSubject(selectedMessageView)}</div>
                            {getSenderEmail(selectedMessageView) ? (
                              <div className="truncate text-sm text-neutral-500">Reply-To: {getSenderEmail(selectedMessageView)}</div>
                            ) : null}
                          </div>
                        </div>
                        <div className="shrink-0 text-sm text-neutral-500">{formatAbsoluteDate(selectedMessageView?.date || selectedMessageView?.createdAt || selectedMessageView?.created_at || selectedMessageView?.timestamp)}</div>
                      </div>
                    </div>

                    <div className="overflow-auto px-5 py-4">
                      {loadingSelectedMessage ? (
                        <div className="text-sm text-neutral-500">Carregando conteúdo…</div>
                      ) : selectedMessageError ? (
                        <div className="text-sm text-red-600">{selectedMessageError}</div>
                      ) : String(selectedMessageView?.html || selectedMessageView?.bodyHtml || selectedMessageView?.body?.html || '').trim() ? (
                        <div className="prose prose-sm max-w-none text-neutral-900" dangerouslySetInnerHTML={{ __html: String(selectedMessageView?.html || selectedMessageView?.bodyHtml || selectedMessageView?.body?.html || '') }} />
                      ) : (
                        <pre className="whitespace-pre-wrap break-words font-sans text-lg leading-8 text-neutral-900">
                          {String(selectedMessageView?.text || selectedMessageView?.bodyText || selectedMessageView?.body?.text || selectedMessageView?.snippet || selectedMessageView?.preview || 'Sem conteúdo disponível')}
                        </pre>
                      )}
                    </div>

                    <div className="border-t border-neutral-200 p-4">
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        className="h-20 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
                        placeholder={`Reply ${getSenderName(selectedMessageView)}...`}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                          <input
                            type="checkbox"
                            checked={muteThread}
                            onChange={(e) => setMuteThread(e.target.checked)}
                            className="size-4 rounded border-neutral-300"
                          />
                          Mute this thread
                        </label>
                        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Send</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Suspense>
  )
}
