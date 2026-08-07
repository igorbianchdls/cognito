import { GET as handleGet, OPTIONS as handleOptions } from '@/app/.well-known/oauth-protected-resource/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export function GET(req: Request) {
  return handleGet(req)
}

export function OPTIONS() {
  return handleOptions()
}
