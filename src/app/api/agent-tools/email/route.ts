import type { NextRequest } from 'next/server'
import { handleWorkspaceToolPost } from '@/app/api/agent-tools/_workspace/handler'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handleWorkspaceToolPost(req, 'email')
}
