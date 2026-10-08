export type ErpReadPageQuery = { query?: string; page?: number; pageSize?: number; filters?: Record<string, string>; sort?: string }

/** Ordenações aceitas por lista; o valor recebido só escolhe uma entrada, nunca entra no SQL. */
export const ERP_LIST_SORTS = {
  financeiro: { vencimento: 'data_vencimento ASC NULLS LAST', '-vencimento': 'data_vencimento DESC NULLS LAST', '-saldo': 'saldo DESC', saldo: 'saldo ASC', '-valor': 'valor DESC' },
  comercial: { '-data': 'data DESC', data: 'data ASC', '-total': 'total DESC', total: 'total ASC' },
} as const
export function erpListOrder(kind: keyof typeof ERP_LIST_SORTS, sort: string | undefined, fallback: string) {
  const options = ERP_LIST_SORTS[kind] as Record<string, string>
  return sort && Object.hasOwn(options, sort) ? options[sort] : fallback
}
