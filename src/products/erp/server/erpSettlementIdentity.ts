import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { decimalText, scaledDecimal } from '@/products/erp/shared/erpMoney'
import { erpDateSchema, erpIdempotencyKeySchema } from '@/products/erp/shared/erpTransport'

export function settlementIdentity(side: 'receber' | 'pagar', installmentId: string | number, values: Record<string, unknown>) {
  const decimal = (key: string, fallback: string) => {
    const value = values[key]
    if (value === undefined || value === null || value === '') return fallback
    if (/^-/.test(String(value).trim())) throw new ErpDomainError('INVALID_AMOUNT', 'O valor não pode ser negativo.')
    return decimalText(scaledDecimal(value, 2))
  }
  const id = (key: string) => {
    const value = values[key]
    if (value === undefined || value === null || value === '') return 'default'
    const number = Number(value)
    if (!Number.isSafeInteger(number) || number <= 0) throw new ErpDomainError('INVALID_REFERENCE', 'Identificação de conta ou método inválida.')
    return String(number)
  }
  const parsedDate = values.data_pagamento === undefined || values.data_pagamento === null || values.data_pagamento === ''
    ? null : erpDateSchema.safeParse(values.data_pagamento)
  if (parsedDate && !parsedDate.success) throw new ErpDomainError('INVALID_DATE', 'Data de pagamento inválida.')
  const date = parsedDate?.success ? parsedDate.data : 'default'
  const origin = String(values.origem || 'manual').trim().toLowerCase()
  if (!['manual', 'conciliacao', 'boleto', 'pix', 'cartao', 'api'].includes(origin)) throw new ErpDomainError('INVALID_ORIGIN', 'Origem de pagamento inválida.')
  return {
    version: 1, side, installmentId: String(installmentId), amount: decimal('valor', 'remaining'),
    interest: decimal('juros', '0.00'), fine: decimal('multa', '0.00'), discount: decimal('desconto', '0.00'), fee: decimal('taxa', '0.00'),
    account: id('conta_financeira_id'), method: id('metodo_pagamento_id'), date, origin,
  }
}
export function assertSettlementReplay(metadata: unknown, expected: ReturnType<typeof settlementIdentity>) {
  const saved = metadata && typeof metadata === 'object' ? (metadata as { settlementRequest?: unknown }).settlementRequest : undefined
  if (!saved || JSON.stringify(saved, Object.keys(expected).sort()) !== JSON.stringify(expected, Object.keys(expected).sort())) {
    throw new ErpDomainError('IDEMPOTENCY_CONFLICT', 'Esta identificação já foi usada com outro conteúdo ou não possui uma solicitação verificável. Confira a operação original.', 409, undefined, 'verify')
  }
}
export function requireOperationKey(value: unknown): string {
  const parsed = erpIdempotencyKeySchema.safeParse(value)
  if (!parsed.success) throw new ErpDomainError('INVALID_OPERATION_KEY', 'A identificação da operação está ausente ou é inválida.')
  return parsed.data
}
