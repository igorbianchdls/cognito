"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import { Inbox, Star, Send, FileText, Trash2, Archive, Tag, Plus, Search, Paperclip, RefreshCcw, X } from 'lucide-react'

const FOLDERS = [
  { key: 'inbox', name: 'Inbox', icon: Inbox, count: 4 },
  { key: 'starred', name: 'Starred', icon: Star, count: 1 },
  { key: 'sent', name: 'Sent', icon: Send, count: 12 },
  { key: 'drafts', name: 'Drafts', icon: FileText, count: 3 },
  { key: 'archive', name: 'Archive', icon: Archive, count: 32 },
  { key: 'trash', name: 'Trash', icon: Trash2, count: 2 },
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

export default function EmailPage() {
  const router = useRouter()
  const [folder, setFolder] = useState('inbox')
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

  const filteredMessages = useMemo(() => {
    const base = Array.isArray(messages) ? messages : []
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter((m: any) => {
      if (!m || typeof m !== 'object') return false
      const fromName = String(m.from?.name || m.from_name || m.from || '').toLowerCase()
      const subject = String(m.subject || '').toLowerCase()
      const snippet = String(m.snippet || m.preview || '').toLowerCase()
      return fromName.includes(q) || subject.includes(q) || snippet.includes(q)
    })
  }, [messages, search])

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
        <SidebarInset className="h-screen overflow-hidden">
          <div className="h-full grid grid-rows-[auto_1fr]">
            <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
              <div className="px-3 md:px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setComposeOpen(true); setComposeError('') }}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="size-3.5" /> Compose
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select value={activeInboxId} onChange={(e) => setActiveInboxId(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none">
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
                    <button
                      onClick={() => setReloadKey((v) => v + 1)}
                      title="Recarregar"
                      className="hidden md:inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCcw className="size-3.5" /> Atualizar
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={labelsFilter}
                      onChange={(e) => setLabelsFilter(e.target.value)}
                      className="h-9 w-56 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none placeholder:text-gray-400 focus:border-gray-300"
                      placeholder="Labels: follow-up, q4"
                    />
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-72 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-gray-300"
                        placeholder="Buscar por remetente/assunto"
                      />
                    </div>
                  </div>
                </div>
                {error ? <div className="mt-2 text-xs text-red-600">{error}</div> : null}
              </div>
            </div>

            <div className="min-h-0 overflow-hidden">
              <div className="grid h-full grid-cols-1 md:grid-cols-[240px_1fr]">
                <aside className="hidden min-h-0 border-r border-gray-200 bg-white/70 p-2 md:block">
                  <div className="space-y-1">
                    {FOLDERS.map(f => (
                      <button key={f.key} onClick={() => setFolder(f.key)} className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 ${folder===f.key?'bg-gray-100 text-gray-900':'text-gray-700'}`}>
                        <span className="inline-flex items-center gap-2"><f.icon className="size-4" /> {f.name}</span>
                        <span className="text-xs text-gray-500">{f.count}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Labels</div>
                    <div className="space-y-1">
                      {['Work','Finance','Personal'].map(l => (
                        <button key={l} onClick={() => setLabelsFilter(l)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"><span className="inline-flex items-center gap-2"><Tag className="size-4" /> {l}</span></button>
                      ))}
                    </div>
                  </div>
                </aside>

                <section className="min-h-0 overflow-auto bg-white">
                  <table className="w-full table-fixed text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50/80 text-xs text-gray-500 backdrop-blur">
                      <tr>
                        <th className="w-10 px-3 py-2 text-left"><input type="checkbox" className="size-4 rounded border-gray-300" /></th>
                        <th className="w-10 px-3 py-2 text-left">★</th>
                        <th className="w-1/5 px-3 py-2 text-left">From</th>
                        <th className="px-3 py-2 text-left">Subject</th>
                        <th className="w-10 px-3 py-2 text-right">📎</th>
                        <th className="w-40 px-3 py-2 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingMessages ? (
                        <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-gray-500">Carregando mensagens…</td></tr>
                      ) : filteredMessages.length === 0 ? (
                        <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-gray-500">Sem mensagens</td></tr>
                      ) : (
                        filteredMessages.map((m: any, index: number) => {
                          if (!m || typeof m !== 'object') return null
                          const id = m.id || m.messageId || m.message_id
                          const fromName = m.from?.name || m.from_name || m.from || '—'
                          const subject = m.subject || '—'
                          const snippet = m.snippet || m.preview || ''
                          const hasAttach = Array.isArray(m.attachments) ? m.attachments.length > 0 : (m.hasAttachments || false)
                          const date = m.date || m.createdAt || m.created_at || m.timestamp || ''
                          const starred = !!(m.starred || m.isStarred)
                          const unread = !!(m.unread || m.isUnread)
                          const labels = Array.isArray(m.labels) ? m.labels : []
                          const goto = id ? `/email/${encodeURIComponent(id)}?inboxId=${encodeURIComponent(activeInboxId)}` : ''
                          return (
                            <tr key={id || `msg-${index}`} onClick={() => goto && router.push(goto)} className={`cursor-pointer border-b hover:bg-gray-50 ${unread?'font-medium':''}`}>
                              <td className="px-3 py-2"><input type="checkbox" className="size-4 rounded border-gray-300" /></td>
                              <td className="px-3 py-2 text-amber-500">{starred ? '★' : '☆'}</td>
                              <td className="truncate px-3 py-2 text-gray-900">{fromName}</td>
                              <td className="truncate px-3 py-2 text-gray-700">
                                <span className="text-gray-900">{subject}</span>
                                <span className="text-gray-500"> — {snippet}</span>
                                {labels.length > 0 ? (
                                  <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                                    {labels.slice(0, 3).map((label: string) => (
                                      <span key={label} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{label}</span>
                                    ))}
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-500">{hasAttach ? <Paperclip className="ml-auto size-4" /> : ''}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{String(date)}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>

                  <div className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-white px-3 py-2 text-xs text-gray-600">
                    <div>Página: {prevTokens.length + 1}</div>
                    <div className="flex items-center gap-2">
                      <button disabled={prevTokens.length === 0 || loadingMessages} onClick={goPrevPage} className="rounded border px-2 py-1 disabled:opacity-50">Anterior</button>
                      <button disabled={!nextPageToken || loadingMessages} onClick={goNextPage} className="rounded border px-2 py-1 disabled:opacity-50">Próxima</button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {composeOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4">
          <div className="mt-8 w-full max-w-3xl rounded-lg border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Nova mensagem</h2>
              <button onClick={() => { setComposeOpen(false); resetCompose() }} className="rounded p-1 text-gray-500 hover:bg-gray-100"><X className="size-4" /></button>
            </div>

            <div className="grid grid-cols-1 gap-3 px-4 py-3">
              <input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="To (separe por vírgula)" />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input value={composeCc} onChange={(e) => setComposeCc(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="CC (opcional)" />
                <input value={composeBcc} onChange={(e) => setComposeBcc(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="BCC (opcional)" />
              </div>
              <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="Subject" />
              <input value={composeLabels} onChange={(e) => setComposeLabels(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="Labels (ex.: follow-up, q4)" />
              <textarea value={composeText} onChange={(e) => setComposeText(e.target.value)} className="h-32 rounded border px-2 py-1.5 text-sm" placeholder="Texto (plain text)" />
              <textarea value={composeHtml} onChange={(e) => setComposeHtml(e.target.value)} className="h-24 rounded border px-2 py-1.5 font-mono text-xs" placeholder="HTML (opcional)" />

              <div className="rounded border p-2">
                <div className="mb-2 text-xs font-medium text-gray-700">Anexos</div>
                <input type="file" multiple onChange={onComposeFileChange} className="text-xs" />
                {composeAttachments.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {composeAttachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-xs">
                        <span className="truncate">{a.filename} ({Math.ceil(a.size / 1024)} KB)</span>
                        <button onClick={() => setComposeAttachments((prev) => prev.filter((x) => x.id !== a.id))} className="text-red-600">Remover</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {composeError ? <div className="text-xs text-red-600">{composeError}</div> : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button onClick={() => { setComposeOpen(false); resetCompose() }} className="rounded border px-3 py-1.5 text-sm">Cancelar</button>
              <button onClick={sendCompose} disabled={composeSending} className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60">
                {composeSending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Suspense>
  )
}
