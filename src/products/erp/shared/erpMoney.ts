import { ErpDomainError } from './erpErrors'
export type ErpDecimal = string | number
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)
/** Decimal sem separador de milhar; aceita ponto ou virgula decimal na entrada. */
export function scaledDecimal(value: unknown, scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0 || scale > 8) throw new RangeError('Escala inválida.')
  if ((typeof value !== 'string' && typeof value !== 'number') || (typeof value === 'number' && !Number.isFinite(value))) throw new ErpDomainError('INVALID_AMOUNT', 'Informe um valor numérico válido.')
  const text = String(value).trim().replace(',', '.')
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text)
  if (!match || text.length > 40) throw new ErpDomainError('INVALID_AMOUNT', 'Informe o valor sem separador de milhar.')
  const fraction = match[3] || ''
  let units = BigInt(match[2]) * BigInt(10) ** BigInt(scale) + BigInt(fraction.slice(0, scale).padEnd(scale, '0') || '0')
  if (Number(fraction[scale] || 0) >= 5) units += BigInt(1)
  return match[1] === '-' ? -units : units
}
export function decimalText(units: bigint, scale = 2): string {
  const sign = units < BigInt(0) ? '-' : ''
  const absolute = (units < BigInt(0) ? -units : units).toString().padStart(scale + 1, '0')
  return scale ? sign + absolute.slice(0, -scale) + '.' + absolute.slice(-scale) : sign + absolute
}
export function decimalNumber(value: unknown, scale = 2): number {
  const units = scaledDecimal(value, scale)
  if (units > MAX_SAFE || units < -MAX_SAFE) throw new ErpDomainError('AMOUNT_OUT_OF_RANGE', 'O valor excede o limite suportado pela aplicação.')
  const result = Number(units) / 10 ** scale
  if (scaledDecimal(result.toFixed(scale), scale) !== units) throw new ErpDomainError('AMOUNT_OUT_OF_RANGE', 'O valor perderia precisão na aplicação.')
  return result
}
export function nonNegativeDecimal(value: unknown, scale = 2): number {
  if (/^-/.test(String(value).trim())) throw new ErpDomainError('INVALID_AMOUNT', 'O valor não pode ser negativo.')
  const result = decimalNumber(value, scale)
  if (result < 0) throw new ErpDomainError('INVALID_AMOUNT', 'O valor não pode ser negativo.')
  return result
}
export function sumMoney(values: ErpDecimal[]): number {
  return decimalNumber(decimalText(values.reduce((sum, value) => sum + scaledDecimal(value, 2), BigInt(0))))
}
export function paymentTotal(principal: ErpDecimal, interest: ErpDecimal, fine: ErpDecimal, discount: ErpDecimal, fee: ErpDecimal, side: 'receber' | 'pagar'): number {
  const cents = scaledDecimal(principal, 2) + scaledDecimal(interest, 2) + scaledDecimal(fine, 2)
    - scaledDecimal(discount, 2) + (side === 'pagar' ? BigInt(1) : -BigInt(1)) * scaledDecimal(fee, 2)
  return decimalNumber(decimalText(cents))
}
export function lineTotal(quantity: ErpDecimal, unitPrice: ErpDecimal, discount: ErpDecimal = 0): number {
  const qty = scaledDecimal(quantity, 4), price = scaledDecimal(unitPrice, 2), reduction = scaledDecimal(discount, 2)
  if (qty <= BigInt(0) || price < BigInt(0) || reduction < BigInt(0)) throw new ErpDomainError('INVALID_AMOUNT', 'Confira quantidade, preço e desconto.')
  const total = (qty * price + BigInt(5000)) / BigInt(10000) - reduction
  if (total < BigInt(0)) throw new ErpDomainError('INVALID_AMOUNT', 'O desconto supera o valor do item.')
  return decimalNumber(decimalText(total))
}
export function discountAmount(subtotal: ErpDecimal, discount: ErpDecimal, type: 'valor' | 'percentual'): number {
  const base = scaledDecimal(subtotal, 2), input = scaledDecimal(discount, type === 'percentual' ? 4 : 2)
  if (base < BigInt(0) || input < BigInt(0) || (type === 'percentual' && input > BigInt(1000000))) throw new ErpDomainError('INVALID_AMOUNT', 'Desconto inválido.')
  const amount = type === 'percentual' ? (base * input + BigInt(500000)) / BigInt(1000000) : input
  if (amount > base) throw new ErpDomainError('INVALID_AMOUNT', 'O desconto supera o subtotal.')
  return decimalNumber(decimalText(amount))
}
