import type { NextRequest } from 'next/server'
import { getMessageAttachment } from '@/features/email/backend/controllers/attachmentsController'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, context: any) {
  return getMessageAttachment(req, context)
}
