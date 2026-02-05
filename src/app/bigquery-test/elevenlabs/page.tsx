"use client"

import React, { useMemo, useState } from 'react'

type FetchState = 'idle' | 'loading' | 'error' | 'done'

export default function ElevenLabsSttTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string>('')
  const [modelId, setModelId] = useState<string>('scribe_v2')
  const [languageCode, setLanguageCode] = useState<string>('eng')
  const [diarize, setDiarize] = useState<boolean>(true)
  const [tagAudioEvents, setTagAudioEvents] = useState<boolean>(true)
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<any>(null)

  const formDisabled = useMemo(() => state === 'loading', [state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('loading'); setError(''); setResult(null)
    try {
      const useMultipart = !!file || !url.trim()
      let res: Response
      if (useMultipart) {
        const fd = new FormData()
        if (file) fd.append('file', file)
        if (!file && url.trim()) fd.append('url', url.trim())
        fd.append('modelId', modelId)
        if (languageCode.trim()) fd.append('languageCode', languageCode.trim())
        if (diarize) fd.append('diarize', 'true')
        if (tagAudioEvents) fd.append('tagAudioEvents', 'true')
        res = await fetch('/api/bigquery-test/elevenlabs', { method: 'POST', body: fd })
      } else {
        const body: any = {
          url: url.trim(),
          modelId,
          languageCode: languageCode.trim() || undefined,
          diarize,
          tagAudioEvents,
        }
        res = await fetch('/api/bigquery-test/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      }
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Falha: ${res.status}`)
      }
      setResult(json)
      setState('done')
    } catch (e: any) {
      setError(e?.message || String(e))
      setState('error')
    }
  }

  const loadSample = () => {
    setUrl('https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3')
    setFile(null)
  }

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teste — ElevenLabs Speech‑to‑Text</h1>
        <p className="text-sm text-slate-600">Envie um áudio (ou URL) e valide a transcrição via API em <code>/api/bigquery-test/elevenlabs</code>. É necessário ELEVENLABS_API_KEY no servidor.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-600">Arquivo de áudio</label>
            <input
              type="file"
              accept="audio/*"
              disabled={formDisabled}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <div className="mt-1 text-xs text-slate-500">ou informe uma URL (ao lado)</div>
          </div>

          <div>
            <label className="block text-xs text-slate-600">URL do áudio</label>
            <input
              value={url}
              onChange={(e)=> setUrl(e.target.value)}
              disabled={formDisabled}
              className="w-full rounded border px-2 py-1 text-sm"
              placeholder="https://…/audio.mp3"
            />
            <button type="button" onClick={loadSample} className="mt-1 text-xs underline">Usar URL de exemplo</button>
          </div>

          <div>
            <label className="block text-xs text-slate-600">Modelo</label>
            <input
              value={modelId}
              onChange={(e)=> setModelId(e.target.value)}
              disabled={formDisabled}
              className="w-full rounded border px-2 py-1 text-sm"
              placeholder="scribe_v2"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600">Language code (opcional)</label>
            <input
              value={languageCode}
              onChange={(e)=> setLanguageCode(e.target.value)}
              disabled={formDisabled}
              className="w-full rounded border px-2 py-1 text-sm"
              placeholder="eng (auto se vazio)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="diarize" type="checkbox" checked={diarize} onChange={(e)=> setDiarize(e.target.checked)} disabled={formDisabled} />
            <label htmlFor="diarize" className="text-xs text-slate-600">Diarize</label>
          </div>

          <div className="flex items-center gap-2">
            <input id="tagAudioEvents" type="checkbox" checked={tagAudioEvents} onChange={(e)=> setTagAudioEvents(e.target.checked)} disabled={formDisabled} />
            <label htmlFor="tagAudioEvents" className="text-xs text-slate-600">Tag audio events</label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={formDisabled} className="px-3 py-1.5 rounded bg-black text-white text-sm disabled:opacity-60">
            {state==='loading' ? 'Transcrevendo…' : 'Transcrever'}
          </button>
        </div>
      </form>

      {error && (<div className="text-sm text-red-600">{error}</div>)}

      <div>
        {result ? (
          <pre className="text-xs overflow-auto bg-slate-50 p-3 rounded border"><code>{JSON.stringify(result, null, 2)}</code></pre>
        ) : (
          <div className="text-sm text-slate-500">Sem resultado ainda.</div>
        )}
      </div>
    </div>
  )
}

