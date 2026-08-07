export function getErpErrorMessage(body: unknown, fallback = 'Nao foi possivel concluir a operacao.') {
  if (!body || typeof body !== 'object') return fallback
  const value = body as { error?: string | { message?: string }; message?: string }
  if (typeof value.error === 'string') return value.error
  if (value.error && typeof value.error.message === 'string') return value.error.message
  return value.message || fallback
}

export async function parseErpResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(getErpErrorMessage(body))
  }
  return body as T
}

export function formatErpCurrency(value: unknown) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(value || 0))
}

export function formatErpValue(value: unknown) {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(value)
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return new Date(`${text.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')
  return text
}
