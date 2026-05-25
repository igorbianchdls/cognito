export type RefreshTokenJobInput = {
  tenantId: number
  connectionId: string
}

export type RefreshTokenJobOutput = {
  ok: boolean
  mode: 'stub'
  connectionId: string
}

export async function refreshTokenJob(input: RefreshTokenJobInput): Promise<RefreshTokenJobOutput> {
  return {
    ok: true,
    mode: 'stub',
    connectionId: input.connectionId,
  }
}
