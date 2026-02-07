import type { NextRequest } from 'next/server'
import { createInboxes, deleteInbox, listInboxes } from '@/features/email/backend/controllers/inboxesController'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return listInboxes(req)
}

export async function POST(req: NextRequest) {
  return createInboxes(req)
}

export async function DELETE(req: NextRequest) {
  return deleteInbox(req)
}
