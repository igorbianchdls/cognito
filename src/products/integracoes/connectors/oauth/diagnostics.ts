export const OAUTH_DIAGNOSTIC_REFRESH_AND_SAVE_FLAG = '--refresh-and-save'

export function assertSafeOAuthDiagnosticRefresh(input: {
  wantsRefresh?: boolean
  willPersist?: boolean
  provider?: string
}) {
  if (!input.wantsRefresh || input.willPersist) return
  const provider = input.provider ? ` ${input.provider}` : ''
  throw new Error(
    `Refresh OAuth${provider} sem persistencia e bloqueado. `
    + `Providers com refresh token rotativo podem invalidar a conexao; use ${OAUTH_DIAGNOSTIC_REFRESH_AND_SAVE_FLAG}.`,
  )
}
