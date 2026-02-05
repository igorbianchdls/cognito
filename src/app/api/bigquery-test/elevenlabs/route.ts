import type { NextRequest } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getClient() {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured')
  return new ElevenLabsClient({ apiKey })
}

async function blobFromUrl(url: string): Promise<Blob> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download failed: ${r.status}`)
  const ab = await r.arrayBuffer()
  const ct = r.headers.get('content-type') || 'audio/mpeg'
  return new Blob([ab], { type: ct })
}

function parseBool(val: unknown, def = false): boolean {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return ['1','true','yes','on'].includes(val.toLowerCase())
  return def
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url') || 'https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3'
    const modelId = searchParams.get('modelId') || 'scribe_v2'
    const languageCode = searchParams.get('languageCode') || 'por'
    const diarize = parseBool(searchParams.get('diarize'), false)
    const tagAudioEvents = parseBool(searchParams.get('tagAudioEvents'), false)

    const client = getClient()
    const file = await blobFromUrl(url)
    const transcription = await client.speechToText.convert({
      file,
      modelId: modelId as any,
      languageCode: languageCode as any,
      diarize,
      tagAudioEvents,
    } as any)
    return Response.json({ success: true, transcription })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ success: false, error: msg }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || ''
    const client = getClient()

    if (ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      const maybeFile = fd.get('file')
      let file: Blob | null = null
      let size: number | undefined
      let type: string | undefined
      if (maybeFile && typeof (maybeFile as any).arrayBuffer === 'function') {
        const ab = await (maybeFile as any).arrayBuffer()
        type = (maybeFile as any).type || 'audio/mpeg'
        size = (maybeFile as any).size
        file = new Blob([ab], { type })
      }
      const url = fd.get('url')
      if (!file && typeof url === 'string' && url.trim()) file = await blobFromUrl(url.trim())
      if (!file) return Response.json({ success: false, error: 'Missing file or url' }, { status: 400 })

      const modelId = (fd.get('modelId') || fd.get('model_id') || 'scribe_v2') as string
      const languageCode = (fd.get('languageCode') || fd.get('language_code') || 'por') as string
      const diarize = parseBool(fd.get('diarize'), false)
      const tagAudioEvents = parseBool(fd.get('tagAudioEvents') || fd.get('tag_audio_events'), false)

      const transcription = await client.speechToText.convert({
        file,
        modelId: modelId as any,
        languageCode: (languageCode || undefined) as any,
        diarize,
        tagAudioEvents,
      } as any)
      return Response.json({ success: true, transcription, meta: { size, type, modelId, languageCode: languageCode || undefined, diarize, tagAudioEvents } })
    }

    const body = await req.json().catch(() => ({})) as any
    const url = body.url as string | undefined
    const modelId = (body.modelId || body.model_id || 'scribe_v2') as string
    const languageCode = ((body.languageCode || body.language_code) ?? 'por') as string | undefined
    const diarize = parseBool(body.diarize, false)
    const tagAudioEvents = parseBool(body.tagAudioEvents ?? body.tag_audio_events, false)

    if (!url) return Response.json({ success: false, error: 'Missing url' }, { status: 400 })
    const file = await blobFromUrl(url)
    const transcription = await client.speechToText.convert({
      file,
      modelId: modelId as any,
      languageCode: languageCode as any,
      diarize,
      tagAudioEvents,
    } as any)
    return Response.json({ success: true, transcription })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ success: false, error: msg }, { status })
  }
}
