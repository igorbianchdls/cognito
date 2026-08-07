import { authServerMetadataHandlerClerk, metadataCorsOptionsRequestHandler } from '@clerk/mcp-tools/next'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const handleMetadata = authServerMetadataHandlerClerk()
export function GET(_request?: Request) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return Response.json({ error: 'clerk_not_configured' }, { status: 503 })
  }
  return handleMetadata()
}
export const OPTIONS = metadataCorsOptionsRequestHandler()
