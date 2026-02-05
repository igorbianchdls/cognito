"use client"

import React, { useMemo, useState } from 'react'

type FetchState = 'idle' | 'loading' | 'error' | 'done'

export default function AssemblySttTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string>('')
  const [languageDetection, setLanguageDetection] = useState<boolean>(false)
  const [languageCode, setLanguageCode] = useState<string>('pt')
  const [models, setModels] = useState<string>('universal-3-pro,universal-2')
  const [full, setFull] = useState<boolean>(false)
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
        fd.append('language_detection', String(languageDetection))
        if (languageCode.trim()) fd.append('language_code', languageCode.trim())
        fd.append('speech_models', models)
        if (full) fd.append('full', 'true')
        res = await fetch('/api/bigquery-test/assembly', { method: 'POST', body: fd })
      } else {
        const body: any = {
          url: url.trim(),
          language_detection: languageDetection,
          language_code: languageCode.trim() || undefined,
          speech_models: models.split(',').map(s => s.trim()).filter(Boolean),
          full,
        }
        res = await fetch('/api/bigquery-test/assembly', {
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
    setUrl('https://assembly.ai/wildfires.mp3')
    setFile(null)
  }

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teste — AssemblyAI Speech‑to‑Text</h1>
        <p className="text-sm text-slate-600">Informe uma URL de áudio e valide a transcrição via API. Esta página usa a rota <code>/api/bigquery-test/assembly</code>.</p>
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
          <label className="block text-xs text-slate-600">Language code</label>
          <input
            value={languageCode}
            onChange={(e)=> setLanguageCode(e.target.value)}
            disabled={formDisabled}
            className="w-full rounded border px-2 py-1 text-sm"
            placeholder="pt (força PT‑BR)"
          />
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
            <label className="block text-xs text-slate-600">Modelos (vírgula‑separados)</label>
            <input
              value={models}
              onChange={(e)=> setModels(e.target.value)}
              disabled={formDisabled}
              className="w-full rounded border px-2 py-1 text-sm"
              placeholder="universal-3-pro,universal-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <input id="ld" type="checkbox" checked={languageDetection} onChange={(e)=> setLanguageDetection(e.target.checked)} disabled={formDisabled} />
            <label htmlFor="ld" className="text-xs text-slate-600">language_detection</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="full" type="checkbox" checked={full} onChange={(e)=> setFull(e.target.checked)} disabled={formDisabled} />
            <label htmlFor="full" className="text-xs text-slate-600">Resposta completa (raw)</label>
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
