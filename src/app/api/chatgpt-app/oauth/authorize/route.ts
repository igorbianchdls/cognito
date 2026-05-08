import { createOAuthAuthorizationCode } from '@/products/chatgpt-app/server/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

export async function GET(req: Request) {
  const url = new URL(req.url)
  const redirectUri = url.searchParams.get('redirect_uri') || ''

  if (!redirectUri) {
    return Response.json(
      {
        error: 'invalid_request',
        error_description: 'redirect_uri e obrigatorio',
      },
      { status: 400 },
    )
  }

  const code = createOAuthAuthorizationCode({
    clientId: url.searchParams.get('client_id') || undefined,
    redirectUri,
    scope: url.searchParams.get('scope') || undefined,
    codeChallenge: url.searchParams.get('code_challenge') || undefined,
    codeChallengeMethod: url.searchParams.get('code_challenge_method') || undefined,
  })

  const redirect = new URL(redirectUri)
  redirect.searchParams.set('code', code)

  const state = url.searchParams.get('state')
  if (state) redirect.searchParams.set('state', state)

  return Response.redirect(redirect, 302)
}

