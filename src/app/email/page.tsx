"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import { Inbox, Star, Send, FileText, Trash2, Archive, Tag, Plus, Search, Paperclip, RefreshCcw, X } from 'lucide-react'

type FolderKey = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archive' | 'trash'

const FOLDERS = [
  { key: 'inbox' as FolderKey, name: 'Inbox', icon: Inbox },
  { key: 'starred' as FolderKey, name: 'Starred', icon: Star },
  { key: 'sent' as FolderKey, name: 'Sent', icon: Send },
  { key: 'drafts' as FolderKey, name: 'Drafts', icon: FileText },
  { key: 'archive' as FolderKey, name: 'Archive', icon: Archive },
  { key: 'trash' as FolderKey, name: 'Trash', icon: Trash2 },
]

type ComposeAttachment = {
  id: string
  filename: string
  contentType?: string
  content: string
  size: number
}

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

function extractNextPageToken(data: any): string {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.nextPageToken === 'string') return data.nextPageToken
  if (data.data && typeof data.data === 'object' && typeof data.data.nextPageToken === 'string') return data.data.nextPageToken
  return ''
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error(`Falha ao ler arquivo: ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function asLowerLabels(message: any): Set<string> {
  const labels = Array.isArray(message?.labels) ? message.labels : []
  return new Set(labels.map((l: any) => String(l || '').trim().toLowerCase()).filter(Boolean))
}

function messageInFolder(message: any, folder: FolderKey): boolean {
  if (!message || typeof message !== 'object') return false
  const labels = asLowerLabels(message)
  const hasLabel = (...candidates: string[]) => candidates.some((v) => labels.has(v))

  const starred = Boolean(message?.starred || message?.isStarred || hasLabel('starred'))
  const sent = Boolean(message?.sent || message?.isSent || hasLabel('sent', 'outbound'))
  const drafts = Boolean(message?.draft || message?.isDraft || hasLabel('draft', 'drafts'))
  const archive = Boolean(message?.archived || message?.isArchived || hasLabel('archive', 'archived'))
  const trash = Boolean(message?.trashed || message?.isTrashed || message?.deleted || hasLabel('trash', 'deleted'))

  if (folder === 'starred') return starred
  if (folder === 'sent') return sent
  if (folder === 'drafts') return drafts
  if (folder === 'archive') return archive
  if (folder === 'trash') return trash
  return !sent && !drafts && !archive && !trash
}

function formatDateLabel(value: any): string {
  if (!value) return ''
  const asString = String(value)
  const parsed = new Date(asString)
  if (Number.isNaN(parsed.getTime())) return asString

  const now = new Date()
  const sameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate()

  if (sameDay) {
    return parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function getSenderName(message: any): string {
  return String(message?.from?.name || message?.from_name || message?.from || 'Sem remetente')
}

function getSenderInitial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase()
}

export default function EmailPage() {
  const router = useRouter()
  const [folder, setFolder] = useState<FolderKey>('inbox')
  const [inboxes, setInboxes] = useState<any[]>([])
  const [activeInboxId, setActiveInboxId] = useState<string>('')
  const [loadingInboxes, setLoadingInboxes] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string>('')
  const [qsInboxId, setQsInboxId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [labelsFilter, setLabelsFilter] = useState('')
  const [pageToken, setPageToken] = useState('')
  const [prevTokens, setPrevTokens] = useState<string[]>([])
  const [nextPageToken, setNextPageToken] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [composeOpen, setComposeOpen] = useState(false)
  const [composeSending, setComposeSending] = useState(false)
  const [composeError, setComposeError] = useState('')
  const [composeTo, setComposeTo] = useState('')
  const [composeCc, setComposeCc] = useState('')
  const [composeBcc, setComposeBcc] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeText, setComposeText] = useState('')
  const [composeHtml, setComposeHtml] = useState('')
  const [composeLabels, setComposeLabels] = useState('')
  const [composeAttachments, setComposeAttachments] = useState<ComposeAttachment[]>([])

  const activeInboxLabel = useMemo(() => {
    const list = Array.isArray(inboxes) ? inboxes : []
    const current = list.find((ib: any) => (ib?.inboxId || ib?.id) === activeInboxId)
    if (!current || typeof current !== 'object') return ''
    return String(current.displayName || current.username || current.email || current.inboxId || '')
  }, [inboxes, activeInboxId])

  const folderCounts = useMemo(() => {
    const base = Array.isArray(messages) ? messages : []
    const counts: Record<FolderKey, number> = {
      inbox: 0,
      starred: 0,
      sent: 0,
      drafts: 0,
      archive: 0,
      trash: 0,
    }
    for (const m of base) {
      for (const f of FOLDERS) {
        if (messageInFolder(m, f.key)) counts[f.key] += 1
      }
    }
    return counts
  }, [messages])

  const visibleMessages = useMemo(() => {
    const base = (Array.isArray(messages) ? messages : []).filter((m: any) => messageInFolder(m, folder))
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter((m: any) => {
      if (!m || typeof m !== 'object') return false
      const fromName = String(m.from?.name || m.from_name || m.from || '').toLowerCase()
      const subject = String(m.subject || '').toLowerCase()
      const snippet = String(m.snippet || m.preview || '').toLowerCase()
      return fromName.includes(q) || subject.includes(q) || snippet.includes(q)
    })
  }, [messages, folder, search])

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
      setLoadingInboxes(true); setError('')
      try {
        const res = await fetch('/api/email/inboxes', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha inboxes: ${res.status}`)
          const list = extractList(json?.data)
          setInboxes(list)
          const q = qsInboxId || ''
          const stored = typeof window !== 'undefined' ? localStorage.getItem('email.activeInboxId') || '' : ''
          const chosen = q || stored || (list[0]?.inboxId || list[0]?.id || '')
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
    setPageToken('')
    setPrevTokens([])
    setNextPageToken('')
  }, [activeInboxId, labelsFilter])

  useEffect(() => {
    if (!activeInboxId) return
    if (typeof window !== 'undefined') localStorage.setItem('email.activeInboxId', activeInboxId)
    const url = new URL(window.location.href)
    url.searchParams.set('inboxId', activeInboxId)
    history.replaceState(null, '', url.toString())

    let ignore = false
    ;(async () => {
      setLoadingMessages(true); setError(''); setMessages([])
      try {
        const params = new URLSearchParams()
        params.set('inboxId', activeInboxId)
        params.set('limit', '50')
        if (pageToken) params.set('pageToken', pageToken)
        const labels = parseCsv(labelsFilter)
        if (labels.length > 0) params.set('labels', labels.join(','))

        const res = await fetch(`/api/email/messages?${params.toString()}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha messages: ${res.status}`)
          const list = extractList(json?.data)
          setMessages(list)
          setNextPageToken(extractNextPageToken(json?.data))
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || String(e))
      } finally {
        if (!ignore) setLoadingMessages(false)
      }
    })()
    return () => { ignore = true }
  }, [activeInboxId, pageToken, labelsFilter, reloadKey])

  function resetCompose() {
    setComposeError('')
    setComposeTo('')
    setComposeCc('')
    setComposeBcc('')
    setComposeSubject('')
    setComposeText('')
    setComposeHtml('')
    setComposeLabels('')
    setComposeAttachments([])
  }

  async function onComposeFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return
    try {
      const mapped = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          content: await fileToBase64(file),
        }))
      )
      setComposeAttachments((prev) => [...prev, ...mapped])
      event.target.value = ''
    } catch (e: any) {
      setComposeError(e?.message || String(e))
    }
  }

  async function sendCompose() {
    if (!activeInboxId) {
      setComposeError('Selecione uma inbox antes de enviar.')
      return
    }
    if (!composeTo.trim()) {
      setComposeError('Preencha o campo To.')
      return
    }
    setComposeSending(true)
    setComposeError('')
    try {
      const res = await fetch('/api/email/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboxId: activeInboxId,
          to: parseCsv(composeTo),
          cc: parseCsv(composeCc),
          bcc: parseCsv(composeBcc),
          subject: composeSubject.trim() || undefined,
          text: composeText || undefined,
          html: composeHtml || undefined,
          labels: parseCsv(composeLabels),
          attachments: composeAttachments.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            content: a.content,
          })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha ao enviar: ${res.status}`)
      setComposeOpen(false)
      resetCompose()
      setReloadKey((v) => v + 1)
    } catch (e: any) {
      setComposeError(e?.message || String(e))
    } finally {
      setComposeSending(false)
    }
  }

  function goNextPage() {
    if (!nextPageToken) return
    setPrevTokens((prev) => [...prev, pageToken])
    setPageToken(nextPageToken)
  }

  function goPrevPage() {
    if (prevTokens.length === 0) return
    const previousToken = prevTokens[prevTokens.length - 1] || ''
    setPrevTokens((prev) => prev.slice(0, -1))
    setPageToken(previousToken)
  }

  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-500">Carregando…</div>}>
      <SidebarProvider>
        <SidebarShadcn showHeaderTrigger={false} />
        <SidebarInset className="h-screen overflow-hidden bg-[radial-gradient(1200px_420px_at_80%_-8%,#eaf2ff,transparent_65%),radial-gradient(1000px_320px_at_0%_100%,#f5f7ff,transparent_55%),linear-gradient(180deg,#f8fafc_0%,#f7f8fa_100%)]">
          <div className="h-full p-3 md:p-4">
            <div className="grid h-full grid-rows-[auto_1fr] gap-3">
              <div className="rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-3 shadow-[0_14px_28px_rgba(15,23,42,0.05)] backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setComposeOpen(true); setComposeError('') }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-800"
                    >
                      <Plus className="size-3.5" /> Nova Mensagem
                    </button>
                    <button
                      onClick={() => setReloadKey((v) => v + 1)}
                      title="Recarregar"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <RefreshCcw className="size-3.5" /> Atualizar
                    </button>
                  </div>

                  <div className="flex min-w-[260px] flex-1 flex-wrap items-center justify-end gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-[300px] max-w-full rounded-xl border border-neutral-300 bg-white pl-8 pr-3 text-sm text-neutral-800 outline-none ring-0 transition placeholder:text-neutral-400 focus:border-neutral-400"
                        placeholder="Buscar remetente, assunto, conteúdo"
                      />
                    </div>
                    <input
                      value={labelsFilter}
                      onChange={(e) => setLabelsFilter(e.target.value)}
                      className="h-10 w-[240px] max-w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      placeholder="Filtrar labels"
                    />
                    <select
                      value={activeInboxId}
                      onChange={(e) => setActiveInboxId(e.target.value)}
                      className="h-10 min-w-[220px] rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none transition focus:border-neutral-400"
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
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-700">Inbox: {activeInboxLabel || 'não selecionada'}</span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1">Mensagens visíveis: {visibleMessages.length}</span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1">Página: {prevTokens.length + 1}</span>
                </div>
                {error ? <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}
              </div>

              <div className="min-h-0 grid grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
                <aside className="hidden min-h-0 rounded-2xl border border-neutral-200/80 bg-white/90 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur md:flex md:flex-col">
                  <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">Pastas</div>
                  <div className="space-y-1">
                    {FOLDERS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFolder(f.key)}
                        className={`group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm transition ${
                          folder === f.key
                            ? 'bg-neutral-900 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <f.icon className="size-4" />
                          {f.name}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          folder === f.key ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700 group-hover:bg-neutral-300'
                        }`}>
                          {folderCounts[f.key]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-neutral-200 pt-3">
                    <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">Labels</div>
                    <div className="space-y-1">
                      {['Work', 'Finance', 'Personal'].map((l) => (
                        <button
                          key={l}
                          onClick={() => setLabelsFilter(l)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
                        >
                          <span className="inline-flex items-center gap-2"><Tag className="size-3.5" /> {l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>

                <section className="min-h-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                  <div className="border-b border-neutral-200 px-3 py-2 md:hidden">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {FOLDERS.map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setFolder(f.key)}
                          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                            folder === f.key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {f.name} ({folderCounts[f.key]})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-full overflow-auto">
                    <table className="w-full table-fixed text-sm">
                      <thead className="sticky top-0 z-10 bg-white/95 text-[11px] uppercase tracking-[0.06em] text-neutral-500 backdrop-blur">
                        <tr className="border-b border-neutral-200">
                          <th className="w-9 px-3 py-2 text-left"><input type="checkbox" className="size-4 rounded border-neutral-300" /></th>
                          <th className="w-10 px-2 py-2 text-left">★</th>
                          <th className="w-[260px] px-2 py-2 text-left">Remetente</th>
                          <th className="px-2 py-2 text-left">Mensagem</th>
                          <th className="w-12 px-2 py-2 text-right">📎</th>
                          <th className="w-28 px-3 py-2 text-right">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingMessages ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-10 text-center text-sm text-neutral-500">Carregando mensagens…</td>
                          </tr>
                        ) : visibleMessages.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-10 text-center text-sm text-neutral-500">Nenhuma mensagem encontrada para esse filtro.</td>
                          </tr>
                        ) : (
                          visibleMessages.map((m: any, index: number) => {
                            if (!m || typeof m !== 'object') return null
                            const id = m.id || m.messageId || m.message_id
                            const fromName = getSenderName(m)
                            const senderInitial = getSenderInitial(fromName)
                            const subject = m.subject || 'Sem assunto'
                            const snippet = m.snippet || m.preview || ''
                            const hasAttach = Array.isArray(m.attachments) ? m.attachments.length > 0 : (m.hasAttachments || false)
                            const date = formatDateLabel(m.date || m.createdAt || m.created_at || m.timestamp)
                            const starred = !!(m.starred || m.isStarred)
                            const unread = !!(m.unread || m.isUnread)
                            const labels = Array.isArray(m.labels) ? m.labels : []
                            const goto = id ? `/email/${encodeURIComponent(id)}?inboxId=${encodeURIComponent(activeInboxId)}` : ''
                            return (
                              <tr
                                key={id || `msg-${index}`}
                                onClick={() => goto && router.push(goto)}
                                className={`cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50 ${unread ? 'bg-[#fcfcfd]' : 'bg-white'}`}
                              >
                                <td className="px-3 py-3 align-top"><input type="checkbox" className="size-4 rounded border-neutral-300" /></td>
                                <td className="px-2 py-3 align-top text-amber-500">{starred ? '★' : '☆'}</td>
                                <td className="px-2 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${unread ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
                                      {senderInitial}
                                    </div>
                                    <div className="min-w-0">
                                      <div className={`truncate text-sm ${unread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-800'}`}>{fromName}</div>
                                      {m?.from?.email ? <div className="truncate text-xs text-neutral-500">{m.from.email}</div> : null}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-3">
                                  <div className={`truncate text-sm ${unread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-800'}`}>{subject}</div>
                                  <div className="truncate text-xs text-neutral-500">{snippet || 'Sem prévia disponível'}</div>
                                  {labels.length > 0 ? (
                                    <div className="mt-1.5 inline-flex flex-wrap gap-1">
                                      {labels.slice(0, 3).map((label: string) => (
                                        <span key={label} className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                                          {label}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-2 py-3 text-right align-top text-neutral-400">{hasAttach ? <Paperclip className="ml-auto size-4" /> : ''}</td>
                                <td className="px-3 py-3 text-right align-top text-xs text-neutral-500">{date}</td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600">
                    <div>
                      Página {prevTokens.length + 1}
                      {nextPageToken ? <span className="ml-1 text-neutral-400">• há próxima página</span> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={prevTokens.length === 0 || loadingMessages}
                        onClick={goPrevPage}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={!nextPageToken || loadingMessages}
                        onClick={goNextPage}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {composeOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-950/35 p-4 backdrop-blur-sm">
          <div className="mt-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_30px_60px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-neutral-900">Nova mensagem</h2>
              <button onClick={() => { setComposeOpen(false); resetCompose() }} className="rounded-md p-1 text-neutral-500 transition hover:bg-neutral-100"><X className="size-4" /></button>
            </div>

            <div className="grid grid-cols-1 gap-3 bg-white px-4 py-4">
              <input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400" placeholder="To (separe por vírgula)" />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input value={composeCc} onChange={(e) => setComposeCc(e.target.value)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400" placeholder="CC (opcional)" />
                <input value={composeBcc} onChange={(e) => setComposeBcc(e.target.value)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400" placeholder="BCC (opcional)" />
              </div>
              <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400" placeholder="Subject" />
              <input value={composeLabels} onChange={(e) => setComposeLabels(e.target.value)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400" placeholder="Labels (ex.: follow-up, q4)" />
              <textarea value={composeText} onChange={(e) => setComposeText(e.target.value)} className="h-32 rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400" placeholder="Texto (plain text)" />
              <textarea value={composeHtml} onChange={(e) => setComposeHtml(e.target.value)} className="h-24 rounded-xl border border-neutral-300 px-3 py-2 font-mono text-xs outline-none transition focus:border-neutral-400" placeholder="HTML (opcional)" />

              <div className="rounded-xl border border-neutral-300 p-2.5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">Anexos</div>
                <input type="file" multiple onChange={onComposeFileChange} className="text-xs" />
                {composeAttachments.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {composeAttachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-2 py-1.5 text-xs">
                        <span className="truncate">{a.filename} ({Math.ceil(a.size / 1024)} KB)</span>
                        <button onClick={() => setComposeAttachments((prev) => prev.filter((x) => x.id !== a.id))} className="font-medium text-red-600">Remover</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {composeError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{composeError}</div> : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3">
              <button onClick={() => { setComposeOpen(false); resetCompose() }} className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700">Cancelar</button>
              <button onClick={sendCompose} disabled={composeSending} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-60">
                {composeSending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Suspense>
  )
}
