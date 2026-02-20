function safeStringify(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    try {
      return String(value)
    } catch {
      return undefined
    }
  }
}

export function normalizeChatError(error: unknown, fallback = 'Erro inesperado'): { message: string; details?: string } {
  if (typeof error === 'string') {
    const msg = error.trim()
    return { message: msg || fallback }
  }

  if (error instanceof Error) {
    const message = (error.message || '').trim() || fallback
    const details = error.stack && error.stack !== error.message ? error.stack : undefined
    return { message, details }
  }

  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>
    const message =
      (typeof obj.message === 'string' && obj.message.trim()) ||
      (typeof obj.error === 'string' && obj.error.trim()) ||
      fallback
    const details = safeStringify(error)
    return { message, details }
  }

  return { message: fallback }
}

export function normalizeDetails(details: unknown): string | undefined {
  const txt = safeStringify(details)
  if (!txt) return undefined
  return txt.length > 6000 ? `${txt.slice(0, 6000)}\n…` : txt
}
