import {
  exchangeOAuthAuthorizationCode,
  readOAuthRequestBody,
} from '@/products/chatgpt-app/server/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

function readBasicClientId(req: Request) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.toLowerCase().startsWith('basic ')) return null

  try {
    const decoded = Buffer.from(auth.slice(6).trim(), 'base64').toString('utf8')
    const [clientId] = decoded.split(':')
    return clientId || null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const body = await readOAuthRequestBody(req)
  const grantType = String(body.grant_type || '')

  if (grantType !== 'authorization_code') {
    return Response.json(
      {
        error: 'unsupported_grant_type',
        error_description: 'Somente authorization_code e suportado',
      },
      { status: 400 },
    )
  }

  const token = exchangeOAuthAuthorizationCode({
    code: String(body.code || ''),
    redirectUri: body.redirect_uri == null ? undefined : String(body.redirect_uri),
    codeVerifier: body.code_verifier == null ? undefined : String(body.code_verifier),
    clientId: String(body.client_id || readBasicClientId(req) || ''),
  })

  if (!token) {
    return Response.json(
      {
        error: 'invalid_grant',
        error_description: 'Authorization code invalido ou expirado',
      },
      { status: 400 },
    )
  }

  return Response.json(token, {
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  })
}

