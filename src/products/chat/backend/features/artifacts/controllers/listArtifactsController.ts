import { NextResponse } from 'next/server'

import { listArtifacts, type ArtifactType } from '@/products/chat/backend/features/artifacts/artifactStore'

function normalizeArtifactType(value?: string | null): ArtifactType | null {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'dashboard' || raw === 'report' || raw === 'slide') return raw
  return null
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const type = normalizeArtifactType(url.searchParams.get('type'))
    const limitRaw = url.searchParams.get('limit') || '50'
    const limit = Math.max(1, Math.min(200, parseInt(limitRaw, 10) || 50))
    const items = await listArtifacts({ type, limit })
    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
