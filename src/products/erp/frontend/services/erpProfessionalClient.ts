import type { ErpErrorBody, ErpRecovery } from '@/products/erp/shared/erpErrors'
import { decimalNumber } from '@/products/erp/shared/erpMoney'

export class ErpRequestError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number,
    public readonly details?: unknown, public readonly correlationId?: string,
    public readonly recovery: ErpRecovery = 'none') { super(message); this.name = 'ErpRequestError' }
}

export function getErpErrorMessage(body: unknown, fallback = 'Nao foi possivel concluir a operacao.') {
  if (!body || typeof body !== 'object') return fallback
  const value = body as { error?: string | { message?: string }; message?: string }
  if (typeof value.error === 'string') return value.error
  if (value.error && typeof value.error.message === 'string') return value.error.message
  return value.message || fallback
}

export function parseErpPayload<T>(body: unknown, schema?: { parse: (input: unknown) => unknown }): T {
  if (!schema) return body as T
  try { return schema.parse(body) as T } catch {
    throw new ErpRequestError('A resposta recebida está incompleta. Confira o resultado antes de repetir.', 'INVALID_RESPONSE', 200, undefined, undefined, 'verify')
  }
}

export async function parseErpResponse<T>(response: Response, schema?: { parse: (input: unknown) => unknown }): Promise<T> {
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = (body as ErpErrorBody | null)?.error
    const structured = error && typeof error === 'object' ? error : undefined
    const recovery = structured?.recovery || (response.status >= 500 ? 'verify' : 'none')
    throw new ErpRequestError(getErpErrorMessage(body), structured?.code || 'ERP_OPERATION_ERROR', response.status,
      structured?.details, structured?.correlationId || response.headers.get('x-correlation-id') || undefined, recovery)
  }
  if (body === null) throw new ErpRequestError('A resposta não pôde ser confirmada. Confira o resultado antes de repetir.', 'INVALID_RESPONSE', response.status, undefined, response.headers.get('x-correlation-id') || undefined, 'verify')
  return parseErpPayload<T>(body, schema)
}

export function formatErpCurrency(value: unknown) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(decimalNumber(value ?? 0))
}

export function formatErpValue(value: unknown) {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(value)
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return new Date(`${text.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')
  return text
}
