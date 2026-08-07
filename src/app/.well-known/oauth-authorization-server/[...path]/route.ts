import { GET as handleGet, OPTIONS as handleOptions } from '@/app/.well-known/oauth-authorization-server/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export function GET() {
  return handleGet()
}

export function OPTIONS() {
  return handleOptions()
}
