const currencyFields = new Set(['valor', 'preco', 'custo', 'valor_total', 'valor_unitario', 'saldo_inicial', 'desconto', 'total'])
const money = (value: unknown) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (value: unknown) => {
  const text = String(value).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text.split('-').reverse().join('/') : text
}

export function ReviewValue({ field, value, names = {} }: { field: string; value: unknown; names?: Record<string, string> }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">Sem preenchimento</span>
  if (Array.isArray(value)) return value.length ? <ul className="space-y-2">{value.map((item, index) => {
    if (!item || typeof item !== 'object') return <li key={index}>{String(item)}</li>
    const row = item as Record<string, unknown>
    if (field === 'parcelas') return <li key={index}>Parcela {index + 1} · {date(row.data_vencimento ?? row.vencimento)} · {money(row.valor)}</li>
    const id = String(row.item_id ?? row.produto_id ?? row.servico_id ?? '')
    const type = String(row.tipo ?? (row.servico_id ? 'servico' : 'produto'))
    const name = row.descricao || names[`${type}:${id}`] || `${type === 'servico' ? 'Serviço' : 'Produto'} ${id}`
    return <li key={index}>{String(name)} · {Number(row.quantidade).toLocaleString('pt-BR')} × {money(row.valor_unitario)}{Number(row.desconto) > 0 && ` · Desconto ${money(row.desconto)}`}</li>
  })}</ul> : <span>Sem itens</span>
  if (typeof value === 'boolean') return <span>{value ? 'Sim' : 'Não'}</span>
  if (currencyFields.has(field)) return <span>{money(value)}</span>
  if (field.startsWith('data_')) return <span>{date(value)}</span>
  if (field.endsWith('_id')) return <span>{names[`${field}:${value}`] || `Cadastro ${value}`}</span>
  if (typeof value === 'object') return <span>Dados preenchidos</span>
  return <span>{String(value).replaceAll('_', ' ')}</span>
}
