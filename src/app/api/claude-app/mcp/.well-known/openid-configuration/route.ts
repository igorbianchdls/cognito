import { GET as handleGet } from '@/app/api/claude-app/.well-known/openid-configuration/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export function GET(req: Request) {
  return handleGet(req)
}
