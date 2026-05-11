import { COGNITO_CLAUDE_APP_SERVER_INFO } from '@/products/claude-app/server/claudeAppServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return Response.json({
    ok: true,
    product: 'claude-app',
    status: 'ready',
    server: COGNITO_CLAUDE_APP_SERVER_INFO,
    mcp_url: '/api/claude-app/mcp',
  })
}
