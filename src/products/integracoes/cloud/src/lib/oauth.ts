export type OAuthTokenSet = {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
}

export async function exchangeOAuthCode(_provider: string, _code: string): Promise<OAuthTokenSet | null> {
  return null
}
