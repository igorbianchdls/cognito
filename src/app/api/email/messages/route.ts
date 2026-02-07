import type { NextRequest } from 'next/server'
import { listMessages, sendMessage } from '@/features/email/backend/controllers/messagesController'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return listMessages(req)
}

export async function POST(req: NextRequest) {
  return sendMessage(req)
}
