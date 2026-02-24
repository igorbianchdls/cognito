import { NextRequest } from 'next/server'
import { handleContaAction } from '@/app/api/agent-tools/_shared/contasCrud'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handleContaAction(req, 'ar', 'baixar')
}
