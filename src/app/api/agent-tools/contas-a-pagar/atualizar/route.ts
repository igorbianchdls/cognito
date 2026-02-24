import { NextRequest } from 'next/server'
import { handleContaUpdate } from '@/app/api/agent-tools/_shared/contasCrud'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handleContaUpdate(req, 'ap')
}
