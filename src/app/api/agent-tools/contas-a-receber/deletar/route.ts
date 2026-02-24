import { NextRequest } from 'next/server'
import { handleContaDeleteBlocked } from '@/app/api/agent-tools/_shared/contasCrud'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handleContaDeleteBlocked(req, 'ar')
}
