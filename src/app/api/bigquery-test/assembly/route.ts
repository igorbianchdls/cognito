import type { NextRequest } from 'next/server'
import { AssemblyAI } from 'assemblyai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// TEMP: user-provided test key (remove after testing)
const TEST_ASSEMBLYAI_KEY = 'bd1609c15e71481e9fc12e080527d916'

function getClient() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY || TEST_ASSEMBLYAI_KEY
  if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY not configured')
  return new AssemblyAI({ apiKey })
}

async function transcribeWithAssembly(params: {
  audio: string | Buffer
  language_detection?: boolean
  speech_models?: string[]
}) {
  const client = getClient()
  const transcript = await client.transcripts.transcribe({
    audio: params.audio,
    language_detection: params.language_detection ?? true,
    speech_models: params.speech_models ?? ['universal-3-pro', 'universal-2'],
  } as any)
  return transcript
}

function shapeTranscript(raw: any, includeRaw: boolean) {
  const shaped: any = {
    id: raw?.id,
    status: raw?.status,
    text: raw?.text,
    language_code: raw?.language_code,
    audio_url: raw?.audio_url,
  }
  if (includeRaw) shaped.raw = raw
  return shaped
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const audio = searchParams.get('audio') || searchParams.get('url') || 'https://assembly.ai/wildfires.mp3'
    const ld = searchParams.get('language_detection')
    const models = searchParams.get('speech_models')
    const rawParam = searchParams.get('raw') || searchParams.get('full')

    const language_detection = typeof ld === 'string' ? ['1','true','yes','on'].includes(ld.toLowerCase()) : true
    const speech_models = typeof models === 'string' && models.trim()
      ? models.split(',').map(s => s.trim()).filter(Boolean)
      : ['universal-3-pro', 'universal-2']
    const includeRaw = typeof rawParam === 'string' ? ['1','true','yes','on'].includes(rawParam.toLowerCase()) : false

    const r = await transcribeWithAssembly({ audio, language_detection, speech_models })
    return Response.json({ success: true, transcript: shapeTranscript(r, includeRaw) })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ success: false, error: msg }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      const maybeFile = fd.get('file')
      let audio: string | Buffer | null = null
      if (maybeFile && maybeFile instanceof File) {
        const ab = await maybeFile.arrayBuffer()
        audio = Buffer.from(ab)
        // size guard ~25MB
        if ((maybeFile as any).size && (maybeFile as any).size > 25 * 1024 * 1024) {
          return Response.json({ success: false, error: 'Arquivo muito grande (>25MB)' }, { status: 413 })
        }
      }
      const url = fd.get('url')
      if (!audio && typeof url === 'string' && url.trim()) audio = url.trim()
      if (!audio) return Response.json({ success: false, error: 'Missing file or url' }, { status: 400 })

      const ld = fd.get('language_detection')
      const language_detection = typeof ld === 'string' ? ['1','true','yes','on'].includes(ld.toLowerCase()) : true
      const models = fd.get('speech_models')
      const speech_models = (typeof models === 'string' && models.trim())
        ? models.split(',').map(s => s.trim()).filter(Boolean)
        : ['universal-3-pro', 'universal-2']
      const full = fd.get('full')
      const includeRaw = typeof full === 'string' ? ['1','true','yes','on'].includes(full.toLowerCase()) : false

      const r = await transcribeWithAssembly({ audio, language_detection, speech_models })
      return Response.json({ success: true, transcript: shapeTranscript(r, includeRaw) })
    }

    // JSON fallback
    const body = await req.json().catch(() => ({})) as any
    const audio = body.audio || body.url || 'https://assembly.ai/wildfires.mp3'
    const language_detection = typeof body.language_detection === 'boolean' ? body.language_detection : true
    const speech_models = Array.isArray(body.speech_models) ? body.speech_models : ['universal-3-pro', 'universal-2']
    const includeRaw = typeof body.full !== 'undefined' ? !!body.full : (typeof body.raw !== 'undefined' ? !!body.raw : false)

    const r = await transcribeWithAssembly({ audio, language_detection, speech_models })
    return Response.json({ success: true, transcript: shapeTranscript(r, includeRaw) })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ success: false, error: msg }, { status })
  }
}
