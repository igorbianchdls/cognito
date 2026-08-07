import { metadataCorsOptionsRequestHandler, protectedResourceHandlerClerk } from '@clerk/mcp-tools/next'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const handleMetadata = protectedResourceHandlerClerk({ scopes_supported: ['openid', 'profile', 'email', 'user:org:read'] })
export function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return Response.json({ error: 'clerk_not_configured' }, { status: 503 })
  }
  return handleMetadata(request)
}
export const OPTIONS = metadataCorsOptionsRequestHandler()
