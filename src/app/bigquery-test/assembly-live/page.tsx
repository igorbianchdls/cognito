"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type RecState = 'idle' | 'recording' | 'stopping' | 'error'

export default function AssemblyLiveChunkPage() {
  const [state, setState] = useState<RecState>('idle')
  const [error, setError] = useState<string>('')
  const [partial, setPartial] = useState<string>('')
  const [fullJson, setFullJson] = useState<boolean>(false)
  const [languageDetection, setLanguageDetection] = useState<boolean>(true)
  const [models, setModels] = useState<string>('universal-3-pro,universal-2')
  const [events, setEvents] = useState<Array<{ id: number, size?: number, type?: string, ok: boolean, status: number, textLen: number }>>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const queueRef = useRef<Blob[]>([])
  const uploadingRef = useRef<boolean>(false)
  const stoppedRef = useRef<boolean>(false)
  const chunkIdRef = useRef<number>(0)

  const formDisabled = useMemo(() => state === 'stopping', [state])

  const stopAll = useCallback(async () => {
    setState('stopping')
    stoppedRef.current = true
    try {
      mediaRecorderRef.current?.stop()
    } catch {}
    try {
      streamRef.current?.getTracks().forEach(t => t.stop())
    } catch {}
    mediaRecorderRef.current = null
    streamRef.current = null
    setState('idle')
  }, [])

  useEffect(() => {
    return () => { // cleanup on unmount
      try { mediaRecorderRef.current?.stop() } catch {}
      try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
      mediaRecorderRef.current = null
      streamRef.current = null
      stoppedRef.current = true
    }
  }, [])

  const processQueue = useCallback(async () => {
    if (uploadingRef.current) return
    uploadingRef.current = true
    try {
      while (!stoppedRef.current) {
        const blob = queueRef.current.shift()
        if (!blob) {
          // small wait before polling again
          await new Promise(r => setTimeout(r, 100))
          continue
        }

        const fd = new FormData()
        fd.append('file', blob, 'chunk.webm')
        fd.append('language_detection', String(languageDetection))
        fd.append('speech_models', models)
        if (fullJson) fd.append('full', 'true')

        try {
          const res = await fetch('/api/bigquery-test/assembly', { method: 'POST', body: fd })
          const json = await res.json().catch(() => ({}))
          if (!res.ok || json?.success === false) {
            throw new Error(json?.error || `Falha: ${res.status}`)
          }
          const text: string = json?.transcript?.text || ''
          if (text) setPartial(prev => (prev ? prev + '\n' : '') + text)
          const id = (chunkIdRef.current += 1)
          setEvents(prev => [...prev.slice(-40), { id, size: json?.meta?.size ?? blob.size, type: json?.meta?.type ?? blob.type, ok: res.ok, status: res.status, textLen: text.length }])
        } catch (e: any) {
          setError(e?.message || String(e))
          const id = (chunkIdRef.current += 1)
          setEvents(prev => [...prev.slice(-40), { id, size: blob.size, type: blob.type, ok: false, status: 0, textLen: 0 }])
          // keep going; this is best-effort streaming
        }
      }
    } finally {
      uploadingRef.current = false
    }
  }, [fullJson, languageDetection, models])

  const start = useCallback(async () => {
    setError('')
    setPartial('')
    stoppedRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeOptions = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ]
      let mimeType = ''
      for (const m of mimeOptions) {
        if (MediaRecorder.isTypeSupported(m)) { mimeType = m; break }
      }
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mr

      mr.addEventListener('dataavailable', (ev) => {
        const b = ev.data
        if (b && b.size > 0) queueRef.current.push(b)
      })

      mr.addEventListener('stop', () => {
        // flush
      })

      setState('recording')
      mr.start(3000) // 3s chunks para melhorar a taxa de transcrição
      processQueue()
    } catch (e: any) {
      setError(e?.message || String(e))
      setState('error')
    }
  }, [processQueue])

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AssemblyAI — Live (chunks)</h1>
        <p className="text-sm text-slate-600">Transcrição quase em tempo real: envia chunks do microfone para a API /api/bigquery-test/assembly e agrega o texto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-600">Modelos (vírgula‑separados)</label>
          <input value={models} onChange={e=> setModels(e.target.value)} disabled={formDisabled || state==='recording'} className="w-full rounded border px-2 py-1 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-600 flex items-center gap-2">
            <input type="checkbox" checked={languageDetection} onChange={e=> setLanguageDetection(e.target.checked)} disabled={formDisabled || state==='recording'} />
            language_detection
          </label>
          <label className="text-xs text-slate-600 flex items-center gap-2">
            <input type="checkbox" checked={fullJson} onChange={e=> setFullJson(e.target.checked)} disabled={formDisabled || state==='recording'} />
            Resposta completa (raw)
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {state !== 'recording' ? (
          <button onClick={start} className="px-3 py-1.5 rounded bg-black text-white text-sm">Iniciar</button>
        ) : (
          <button onClick={stopAll} className="px-3 py-1.5 rounded bg-slate-800 text-white text-sm">Parar</button>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div>
        <div className="text-xs text-slate-600 mb-1">Transcrição agregada</div>
        <pre className="text-sm overflow-auto bg-slate-50 p-3 rounded border min-h-[160px]"><code>{partial || '…'}</code></pre>
      </div>

      <div>
        <div className="text-xs text-slate-600 mb-1">Debug dos chunks</div>
        <pre className="text-xs overflow-auto bg-slate-50 p-3 rounded border max-h-[200px]"><code>{events.map(e => `#${e.id} ${e.size ?? '?'} bytes ${e.type || ''} -> ${e.ok?'ok':'fail'} status=${e.status} textLen=${e.textLen}`).join('\n') || '…'}</code></pre>
      </div>
    </div>
  )
}
