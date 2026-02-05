"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React, { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { ArrowLeft, Reply, Forward, Trash2 } from 'lucide-react'

export default function EmailReadPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [qsInboxId, setQsInboxId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState<any>(null)

  // Read inboxId from query string (client only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const v = new URL(window.location.href).searchParams.get('inboxId') || ''
        setQsInboxId(v)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const id = params?.id
    if (!id) return
    let ignore = false
    ;(async () => {
      setLoading(true); setError(''); setData(null)
      try {
        const inboxId = qsInboxId || ''
        const url = `/api/email/messages/${encodeURIComponent(id)}${inboxId ? `?inboxId=${encodeURIComponent(inboxId)}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha: ${res.status}`)
          setData(json?.data)
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || String(e))
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [params?.id, qsInboxId])

  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-500">Carregando…</div>}>
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="px-2 md:px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push('/email' + (qsInboxId ? `?inboxId=${encodeURIComponent(qsInboxId)}` : ''))} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><ArrowLeft className="mr-1 inline size-3.5" /> Inbox</button>
                  <h1 className="truncate text-lg font-semibold text-gray-900">{data?.subject || 'Email'}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Reply className="mr-1 inline size-3.5" /> Reply</button>
                  <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Forward className="mr-1 inline size-3.5" /> Forward</button>
                  <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-red-600 hover:bg-gray-50"><Trash2 className="mr-1 inline size-3.5" /> Delete</button>
                </div>
              </div>
            </div>
          </div>
          <div className="min-h-0 overflow-auto">
            <div className="px-3 md:px-4 py-4">
              {loading ? (
                <div className="text-xs text-gray-500">Carregando…</div>
              ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : data ? (
                <article className="prose prose-sm max-w-none">
                  <div className="mb-3 text-xs text-gray-500">
                    From: <span className="font-medium text-gray-800">{data?.from?.name || data?.from_name || '—'}</span> &lt;{data?.from?.email || data?.from_email || data?.from || '—'}&gt;
                  </div>
                  {data?.html ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.html as string }} />
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-gray-800">{data?.text || data?.snippet || 'Sem conteúdo'}</pre>
                  )}
                </article>
              ) : (
                <div className="text-sm text-gray-500">Mensagem não encontrada.</div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </Suspense>
  )
}
