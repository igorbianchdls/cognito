import { getChatGptAppOAuthAuthorizationServerMetadata } from '@/products/chatgpt-app/server/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  const metadata = getChatGptAppOAuthAuthorizationServerMetadata(req)
  if (!metadata) {
    return Response.json({ error: 'server_not_configured' }, { status: 500 })
  }

  return Response.json(metadata)
}

