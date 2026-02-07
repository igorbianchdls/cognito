import type { NextRequest } from 'next/server'
import { getAgentMailClient } from '@/features/email/backend/integrations/agentmailClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    const cursor = searchParams.get('cursor') || undefined
    const client = await getAgentMailClient()
    // Try calling with pagination; fallback to simple list
    let data: any
    try {
      data = await client.inboxes.list({ limit, cursor })
    } catch {
      data = await client.inboxes.list()
    }
    return Response.json({ ok: true, data })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}

type CreateInboxInput = {
  username?: string
  domain?: string
  displayName?: string
}

function toInboxPayload(value: unknown): CreateInboxInput {
  const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const username = String(obj.username || '').trim()
  const domain = String(obj.domain || '').trim()
  const displayName = String(obj.displayName || '').trim()
  const out: CreateInboxInput = {}
  if (username) out.username = username
  if (domain) out.domain = domain
  if (displayName) out.displayName = displayName
  return out
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawItems = Array.isArray((body as any)?.items) ? (body as any).items : null
    const base = Date.now().toString().slice(-6)
    const defaults: CreateInboxInput[] = [
      { username: `fiscal-${base}`, displayName: 'Fiscal ACME' },
      { username: `compras-${base}`, displayName: 'Compras ACME' },
      { username: `vendas-${base}`, displayName: 'Vendas ACME' },
    ]
    const items = rawItems && rawItems.length > 0 ? rawItems.map(toInboxPayload) : defaults

    const client = await getAgentMailClient()
    const created: any[] = []
    const errors: Array<{ index: number; input: CreateInboxInput; error: string }> = []

    for (let i = 0; i < items.length; i += 1) {
      const input = items[i]
      try {
        const inbox = await client.inboxes.create(input)
        created.push(inbox)
      } catch (e: any) {
        errors.push({ index: i, input, error: e?.message || String(e) })
      }
    }

    return Response.json({
      ok: errors.length === 0,
      created,
      errors,
      requested: items.length,
      createdCount: created.length,
    }, { status: errors.length === 0 ? 200 : 207 })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const inboxId = String(body?.inboxId || url.searchParams.get('inboxId') || '').trim()
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })

    const client = await getAgentMailClient()
    let data: any = null

    if (typeof client?.inboxes?.delete === 'function') {
      data = await client.inboxes.delete(inboxId)
    } else {
      throw new Error('Inbox delete is not available in current SDK client')
    }

    return Response.json({ ok: true, data: data ?? null })
  } catch (e: any) {
    const msg = e?.message || String(e)
    const status = /key|auth/i.test(msg) ? 401 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}
