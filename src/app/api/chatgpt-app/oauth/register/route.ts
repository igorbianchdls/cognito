import crypto from 'node:crypto'
import { asJsonRecord, readOAuthRequestBody } from '@/products/chatgpt-app/server/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item)).filter(Boolean)
    : []
}

export async function POST(req: Request) {
  const body = asJsonRecord(await readOAuthRequestBody(req))
  const redirectUris = asStringArray(body.redirect_uris)
  const clientId = `cognito-chatgpt-${crypto.randomUUID()}`
  const clientSecret = crypto.randomBytes(32).toString('base64url')

  return Response.json(
    {
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0,
      redirect_uris: redirectUris,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: body.token_endpoint_auth_method || 'client_secret_post',
      scope: 'dashboards:read dashboards:write',
    },
    { status: 201 },
  )
}

