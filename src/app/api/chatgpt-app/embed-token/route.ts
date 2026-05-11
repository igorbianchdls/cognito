import { verifyChatGptAppRequest } from '@/products/chatgpt-app/server/auth'
import { createDashboardEmbedToken } from '@/products/chatgpt-app/server/embedToken'
import { getChatGptAppOAuthWwwAuthenticateHeader } from '@/products/chatgpt-app/server/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

export async function POST(req: Request) {
  const auth = verifyChatGptAppRequest(req)
  if (!auth.ok) {
    return Response.json(
      {
        ok: false,
        code: auth.code,
        error: auth.error,
      },
      {
        status: auth.status,
        headers: auth.status === 401
          ? { 'WWW-Authenticate': getChatGptAppOAuthWwwAuthenticateHeader(req) }
          : undefined,
      },
    )
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const artifactId = String(body.artifact_id || body.artifactId || '').trim()
  if (!artifactId) {
    return Response.json(
      {
        ok: false,
        code: 'missing_artifact_id',
        error: 'artifact_id e obrigatorio',
      },
      { status: 400 },
    )
  }

  const ttlSeconds = Number.parseInt(String(body.ttl_seconds || '').trim(), 10)
  const token = createDashboardEmbedToken(
    artifactId,
    Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : undefined,
  )

  return Response.json({
    ok: true,
    artifact_id: artifactId,
    token,
  })
}

