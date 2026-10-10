export const QUOTE_SITUATIONS = ['em_andamento', 'enviada', 'aprovado', 'recusado', 'convertido', 'cancelado'] as const
export type QuoteSituation = typeof QUOTE_SITUATIONS[number]
export function quoteSituation(value: unknown): QuoteSituation {
  const aliases: Record<string, QuoteSituation> = {em_aberto:'em_andamento', aprovada:'aprovado', recusada:'recusado', cancelada:'cancelado'}
  const raw = String(value || 'em_andamento')
  return aliases[raw] || (QUOTE_SITUATIONS.includes(raw as QuoteSituation) ? raw as QuoteSituation : 'em_andamento')
}
export const quoteIsClosed = (value: unknown) => ['recusado', 'convertido', 'cancelado'].includes(quoteSituation(value))
