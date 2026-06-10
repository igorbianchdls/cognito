import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'

import {
  markClerkUserDeleted,
  syncClerkProfile,
  type ClerkProfileInput,
} from '@/products/auth/server/clerkTenantBootstrap'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function toText(value: unknown) {
  return String(value ?? '').trim()
}

function getPrimaryEmail(data: JsonRecord) {
  const primaryId = toText(data.primary_email_address_id)
  const emails = Array.isArray(data.email_addresses) ? data.email_addresses.map(asRecord) : []
  const primary = emails.find((item) => toText(item.id) === primaryId) || emails[0]
  return toText(primary?.email_address)
}

function getWebhookProfile(data: JsonRecord): ClerkProfileInput | null {
  const clerkUserId = toText(data.id)
  const email = getPrimaryEmail(data)
  if (!clerkUserId || !email) return null

  const firstName = toText(data.first_name)
  const lastName = toText(data.last_name)
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || toText(data.full_name) || null

  return {
    clerkUserId,
    email,
    fullName,
    avatarUrl: toText(data.image_url) || toText(data.profile_image_url) || null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const signingSecret = process.env.CLERK_WEBHOOK_SECRET || process.env.CLERK_WEBHOOK_SIGNING_SECRET
    const event = await verifyWebhook(req, signingSecret ? { signingSecret } : undefined)
    const data = asRecord(event.data)

    if (event.type === 'user.deleted') {
      await markClerkUserDeleted(toText(data.id))
      return Response.json({ ok: true })
    }

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const profile = getWebhookProfile(data)
      if (!profile) {
        return Response.json({ ok: true, ignored: true, reason: 'missing_user_email' })
      }

      const state = await syncClerkProfile(profile)
      return Response.json({
        ok: true,
        user: {
          clerkUserId: state.clerkUserId,
          sharedUserId: state.sharedUserId,
          email: state.email,
        },
        memberships: state.memberships.length,
      })
    }

    return Response.json({ ok: true, ignored: true, type: event.type })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Webhook Clerk invalido.' },
      { status: 400 },
    )
  }
}
