"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { Inbox, Star, Send, FileText, Trash2, Archive, Tag, Plus, Search, Paperclip, RefreshCcw } from 'lucide-react'

const FOLDERS = [
  { key: 'inbox', name: 'Inbox', icon: Inbox, count: 4 },
  { key: 'starred', name: 'Starred', icon: Star, count: 1 },
  { key: 'sent', name: 'Sent', icon: Send, count: 12 },
  { key: 'drafts', name: 'Drafts', icon: FileText, count: 3 },
  { key: 'archive', name: 'Archive', icon: Archive, count: 32 },
  { key: 'trash', name: 'Trash', icon: Trash2, count: 2 },
]

export default function EmailPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [folder, setFolder] = useState('inbox')
  const [inboxes, setInboxes] = useState<any[]>([])
  const [activeInboxId, setActiveInboxId] = useState<string>('')
  const [loadingInboxes, setLoadingInboxes] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string>('')

  // load inboxes
  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoadingInboxes(true); setError('')
      try {
        const res = await fetch('/api/email/inboxes', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha inboxes: ${res.status}`)
          const list = (json?.data?.items || json?.data || []) as any[]
          setInboxes(list)
          // pick inbox from URL or storage or first
          const q = params?.get('inboxId') || ''
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
  }, [])

  // load messages when inbox changes
  useEffect(() => {
    if (!activeInboxId) return
    if (typeof window !== 'undefined') localStorage.setItem('email.activeInboxId', activeInboxId)
    const url = new URL(window.location.href); url.searchParams.set('inboxId', activeInboxId); history.replaceState(null, '', url.toString())
    let ignore = false
    ;(async () => {
      setLoadingMessages(true); setError(''); setMessages([])
      try {
        const u = `/api/email/messages?inboxId=${encodeURIComponent(activeInboxId)}&limit=50`
        const res = await fetch(u, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha messages: ${res.status}`)
          const list = (json?.data?.items || json?.data || []) as any[]
          setMessages(list)
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || String(e))
      } finally {
        if (!ignore) setLoadingMessages(false)
      }
    })()
    return () => { ignore = true }
  }, [activeInboxId])

  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-500">Carregando…</div>}>
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="px-3 md:px-4 py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Plus className="size-3.5" /> Compose</button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Inbox selector */}
                  <div className="relative">
                    <select value={activeInboxId} onChange={(e)=> setActiveInboxId(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none">
                      <option value="" disabled>{loadingInboxes ? 'Carregando inboxes…' : 'Selecione uma inbox'}</option>
                      {inboxes.map((ib: any) => (
                        <option key={ib.inboxId || ib.id} value={ib.inboxId || ib.id}>
                          {(ib.displayName || ib.username || ib.email || '').toString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button onClick={()=> activeInboxId && setActiveInboxId(activeInboxId)} title="Recarregar" className="hidden md:inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><RefreshCcw className="size-3.5" /> Atualizar</button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input className="h-9 w-96 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none ring-0 placeholder:text-gray-400 focus:border-gray-300" placeholder="Search in mail" />
                </div>
                <div />
              </div>
            </div>
          </div>

          {/* Content: Gmail-like (left categories + main list) */}
          <div className="min-h-0 overflow-hidden">
            <div className="grid h-full grid-cols-1 md:grid-cols-[240px_1fr]">
              {/* Column 1: categories */}
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
                      <button key={l} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"><span className="inline-flex items-center gap-2"><Tag className="size-4" /> {l}</span></button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Column 2: list (table-like) */}
              <section className="min-h-0 overflow-auto bg-white">
                <table className="w-full table-fixed text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50/80 text-xs text-gray-500 backdrop-blur">
                    <tr>
                      <th className="w-10 px-3 py-2 text-left"><input type="checkbox" className="size-4 rounded border-gray-300" /></th>
                      <th className="w-10 px-3 py-2 text-left">★</th>
                      <th className="w-1/5 px-3 py-2 text-left">From</th>
                      <th className="px-3 py-2 text-left">Subject</th>
                      <th className="w-10 px-3 py-2 text-right">📎</th>
                      <th className="w-32 px-3 py-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMessages ? (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-gray-500">Carregando mensagens…</td></tr>
                    ) : messages.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-gray-500">Sem mensagens</td></tr>
                    ) : (
                      messages.map((m: any) => {
                        const id = m.id || m.messageId || m.message_id
                        const fromName = m.from?.name || m.from_name || m.from || '—'
                        const subject = m.subject || '—'
                        const snippet = m.snippet || m.preview || ''
                        const hasAttach = Array.isArray(m.attachments) ? m.attachments.length > 0 : (m.hasAttachments || false)
                        const date = m.date || m.createdAt || m.created_at || ''
                        const starred = !!(m.starred || m.isStarred)
                        const unread = !!(m.unread || m.isUnread)
                        return (
                          <tr key={id} onClick={() => id && router.push(`/email/${id}`)} className={`cursor-pointer border-b hover:bg-gray-50 ${unread?'font-medium':''}`}>
                            <td className="px-3 py-2"><input type="checkbox" className="size-4 rounded border-gray-300" /></td>
                            <td className="px-3 py-2 text-amber-500">{starred ? '★' : '☆'}</td>
                            <td className="truncate px-3 py-2 text-gray-900">{fromName}</td>
                            <td className="truncate px-3 py-2 text-gray-700"><span className="text-gray-900">{subject}</span> — <span className="text-gray-500">{snippet}</span></td>
                            <td className="px-3 py-2 text-right text-gray-500">{hasAttach ? <Paperclip className="ml-auto size-4" /> : ''}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{date}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </Suspense>
  )
}
