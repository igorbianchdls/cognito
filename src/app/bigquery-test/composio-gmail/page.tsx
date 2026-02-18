"use client"

import React, { useEffect, useMemo, useState } from 'react'

type FetchState = 'idle' | 'loading' | 'error' | 'done'

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function ComposioGmailTestPage() {
  const [q, setQ] = useState<string>('')
  const [labelIds, setLabelIds] = useState<string>('')
  const [maxResults, setMaxResults] = useState<number>(5)
  const [includeSpamTrash, setIncludeSpamTrash] = useState<boolean>(false)
  const [includePayload, setIncludePayload] = useState<boolean>(false)
  const [verbose, setVerbose] = useState<boolean>(false)
  const [pageToken, setPageToken] = useState<string>('')

  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string>('')
  const [data, setData] = useState<any>(null)
  const [nextToken, setNextToken] = useState<string>('')

  const payload = useMemo(() => {
    const out: any = { user_id: 'me', max_results: maxResults, include_spam_trash: includeSpamTrash, include_payload: includePayload, verbose }
    if (q.trim()) out.q = q.trim()
    const labels = labelIds.split(',').map(s => s.trim()).filter(Boolean)
    if (labels.length) out.labelIds = labels
    if (pageToken.trim()) out.page_token = pageToken.trim()
    return out
  }, [q, labelIds, maxResults, includeSpamTrash, includePayload, verbose, pageToken])

  const doFetch = async (merge = false) => {
    setState('loading'); setError('')
    try {
      const res = await fetch('/api/composio/gmail/fetch-emails', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json().catch(()=>({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || 'Falha na busca')

      setData((prev: any) => {
        if (!merge) return json
        try {
          const prevMsgs = prev?.data?.results?.[0]?.response?.data?.messages || []
          const newMsgs = json?.data?.results?.[0]?.response?.data?.messages || []
          const wrapped = { ...json }
          if (wrapped.data?.results?.[0]?.response?.data) {
            wrapped.data.results[0].response.data.messages = [...prevMsgs, ...newMsgs]
          }
          return wrapped
        } catch {
          return json
        }
      })

      const token = json?.data?.results?.[0]?.response?.data?.nextPageToken || ''
      setNextToken(typeof token === 'string' ? token : '')
      setState('done')
    } catch (e: any) {
      setError(e?.message || String(e))
      setState('error')
    }
  }

  useEffect(() => { doFetch(false).catch(()=>{}) }, [])

  const messages = data?.data?.results?.[0]?.response?.data?.messages || []

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teste — Gmail (Composio)</h1>
        <p className="text-sm text-slate-600">Busca emails via Composio sem UI legada do Nexus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-600">Query (q)</label>
          <input value={q} onChange={(e)=> setQ(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" placeholder="ex: label:UNREAD in:inbox newer_than:7d" />
        </div>
        <div>
          <label className="block text-xs text-slate-600">Labels (vírgula)</label>
          <input value={labelIds} onChange={(e)=> setLabelIds(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" placeholder="UNREAD,INBOX" />
        </div>
        <div>
          <label className="block text-xs text-slate-600">Max results</label>
          <input type="number" min={1} max={100} value={maxResults} onChange={(e)=> setMaxResults(Number(e.target.value||5))} className="w-full rounded border px-2 py-1 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input id="spam" type="checkbox" checked={includeSpamTrash} onChange={(e)=> setIncludeSpamTrash(e.target.checked)} />
          <label htmlFor="spam" className="text-xs text-slate-600">Incluir Spam/Lixeira</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="payload" type="checkbox" checked={includePayload} onChange={(e)=> setIncludePayload(e.target.checked)} />
          <label htmlFor="payload" className="text-xs text-slate-600">Incluir payload</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="verbose" type="checkbox" checked={verbose} onChange={(e)=> setVerbose(e.target.checked)} />
          <label htmlFor="verbose" className="text-xs text-slate-600">Verbose</label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={()=> doFetch(false)} disabled={state==='loading'} className="px-3 py-1.5 rounded bg-black text-white text-sm disabled:opacity-60">{state==='loading' ? 'Buscando…' : 'Buscar'}</button>
        <button onClick={()=> { if (nextToken) { setPageToken(nextToken); doFetch(true) } }} disabled={!nextToken || state==='loading'} className="px-3 py-1.5 rounded border text-sm disabled:opacity-60">Carregar mais</button>
      </div>

      {error && (<div className="text-sm text-red-600">{error}</div>)}

      <div className="rounded border border-gray-200 p-4">
        <div className="text-sm font-medium mb-2">Mensagens: {Array.isArray(messages) ? messages.length : 0}</div>
        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[60vh]">{pretty(data)}</pre>
      </div>
    </div>
  )
}
