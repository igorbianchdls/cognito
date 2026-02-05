import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const ELEVEN_STT_ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text/convert'

async function convertWithElevenLabs(input: {
  file: File,
  model_id?: string,
  language_code?: string | null,
  diarize?: boolean,
  tag_audio_events?: boolean,
}) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured')

  const fd = new FormData()
  fd.append('file', input.file)
  if (input.model_id) fd.append('model_id', input.model_id)
  if (typeof input.diarize === 'boolean') fd.append('diarize', String(input.diarize))
  if (typeof input.tag_audio_events === 'boolean') fd.append('tag_audio_events', String(input.tag_audio_events))
  if (input.language_code) fd.append('language_code', input.language_code)

  const res = await fetch(ELEVEN_STT_ENDPOINT, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: fd,
    // @ts-ignore — Next runtime supports standard fetch
    cache: 'no-store',
  })
  const text = await res.text()
  let json: any = null
  try { json = JSON.parse(text) } catch { /* leave as text */ }
  if (!res.ok) {
    throw new Error((json && (json.error || json.message)) || text || `HTTP ${res.status}`)
  }
  return json ?? text
}

async function fileFromUrl(url: string, filename?: string): Promise<File> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)
  try {
    const r = await fetch(url, { signal: controller.signal })
    if (!r.ok) throw new Error(`download failed: ${r.status}`)
    const ab = await r.arrayBuffer()
    const ct = r.headers.get('content-type') || 'audio/mpeg'
    const name = filename || url.split('/').pop() || 'audio'
    return new File([ab], name, { type: ct })
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  try {
    const ct = req.headers.get('content-type') || ''
    let file: File | null = null
    let model_id: string | undefined = 'scribe_v2'
    let language_code: string | null | undefined = undefined
    let diarize: boolean | undefined = undefined
    let tag_audio_events: boolean | undefined = undefined

    if (ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      const maybeFile = fd.get('file')
      if (maybeFile && maybeFile instanceof File) file = maybeFile
      const m = fd.get('modelId') || fd.get('model_id')
      if (typeof m === 'string' && m.trim()) model_id = m.trim()
      const lc = fd.get('languageCode') || fd.get('language_code')
      if (typeof lc === 'string' && lc.trim()) language_code = lc.trim()
      const d = fd.get('diarize')
      if (typeof d === 'string') diarize = ['1','true','on','yes'].includes(d.toLowerCase())
      const tae = fd.get('tagAudioEvents') || fd.get('tag_audio_events')
      if (typeof tae === 'string') tag_audio_events = ['1','true','on','yes'].includes(tae.toLowerCase())
      const url = fd.get('url')
      if (!file && typeof url === 'string' && url.trim()) {
        file = await fileFromUrl(url.trim())
      }
    } else {
      const body = await req.json().catch(() => ({})) as any
      const url: string | undefined = typeof body.url === 'string' ? body.url : undefined
      const m: string | undefined = typeof body.modelId === 'string' ? body.modelId : (typeof body.model_id === 'string' ? body.model_id : undefined)
      const lc: string | null | undefined = (typeof body.languageCode === 'string' ? body.languageCode : (typeof body.language_code === 'string' ? body.language_code : undefined))
      const d: boolean | undefined = typeof body.diarize === 'boolean' ? body.diarize : undefined
      const tae: boolean | undefined = (typeof body.tagAudioEvents === 'boolean' ? body.tagAudioEvents : (typeof body.tag_audio_events === 'boolean' ? body.tag_audio_events : undefined))
      if (url) file = await fileFromUrl(url)
      if (m) model_id = m
      if (typeof lc !== 'undefined') language_code = lc
      if (typeof d === 'boolean') diarize = d
      if (typeof tae === 'boolean') tag_audio_events = tae
    }

    if (!file) {
      return Response.json({ success: false, error: 'Missing file or url' }, { status: 400 })
    }

    // Size guard ~25MB
    try {
      if (typeof (file as any).size === 'number' && (file as any).size > 25 * 1024 * 1024) {
        return Response.json({ success: false, error: 'Arquivo muito grande (>25MB)' }, { status: 413 })
      }
    } catch {}

    const result = await convertWithElevenLabs({ file, model_id, language_code: language_code ?? undefined, diarize, tag_audio_events })
    const durationMs = Date.now() - startedAt
    return Response.json({ success: true, transcription: result, meta: { durationMs, model_id, language_code, diarize, tag_audio_events } })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /apikey|key|auth/i.test(msg) ? 401 : 500
    return Response.json({ success: false, error: msg }, { status })
  }
}
