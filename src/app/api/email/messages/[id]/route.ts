import type { NextRequest } from 'next/server'
import { deleteMessage, getMessage, runMessageAction } from '@/features/email/backend/controllers/messagesController'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, context: any) {
  return getMessage(req, context)
}

export async function POST(req: NextRequest, context: any) {
  return runMessageAction(req, context)
}

export async function DELETE(req: NextRequest, context: any) {
  return deleteMessage(req, context)
}
