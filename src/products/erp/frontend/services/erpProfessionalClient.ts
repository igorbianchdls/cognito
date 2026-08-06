export async function parseErpResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as {
    error?: string | { message?: string; correlationId?: string }
  }
  if (!response.ok) {
    const message = typeof body.error === 'string'
      ? body.error
      : body.error?.message || 'Nao foi possivel concluir a operacao.'
    throw new Error(message)
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
