type ClerkErrorLike = {
  code?: string
  errors?: Array<{ code?: string; longMessage?: string; message?: string }>
  longMessage?: string
  message?: string
}

const messages: Record<string, string> = {
  captcha_invalid: 'Não foi possível validar a segurança. Atualize a página e tente novamente.',
  form_code_incorrect: 'O código informado está incorreto.',
  form_code_expired: 'Este código expirou. Solicite um novo código.',
  form_identifier_exists: 'Já existe uma conta com este email.',
  form_identifier_not_found: 'Não encontramos uma conta com este email.',
  form_param_format_invalid: 'Confira os dados informados e tente novamente.',
  form_password_compromised: 'Esta senha apareceu em um vazamento. Escolha uma senha diferente.',
  form_password_incorrect: 'Email ou senha incorretos.',
  form_password_length_too_short: 'A senha precisa ter pelo menos 8 caracteres.',
  form_password_pwned: 'Esta senha não é segura. Escolha uma senha diferente.',
  session_exists: 'Você já está conectado.',
  too_many_requests: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.',
}

export function getAuthErrorMessage(error: unknown, fallback = 'Não foi possível continuar. Tente novamente.') {
  const value = error as ClerkErrorLike | null | undefined
  const detail = value?.errors?.[0]
  const code = detail?.code || value?.code || ''

  if (code && messages[code]) return messages[code]
  if (detail?.longMessage) return detail.longMessage
  if (detail?.message) return detail.message
  if (value?.longMessage) return value.longMessage
  if (value?.message && !value.message.toLowerCase().includes('clerk')) return value.message
  return fallback
}
