const moneyWords = [
  'amount',
  'custo',
  'faturamento',
  'gasto',
  'liquido',
  'lucro',
  'preco',
  'receita',
  'saldo',
  'ticket',
  'total',
  'valor',
]

const dateWords = ['date', 'data', 'dt_', '_dt', 'vencimento']

export function humanizeKey(value: string) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

export function isMoneyKey(key: string) {
  const normalized = key.toLowerCase()
  return moneyWords.some((word) => normalized.includes(word))
}

export function isDateKey(key: string) {
  const normalized = key.toLowerCase()
  return dateWords.some((word) => normalized.includes(word))
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value: unknown) {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatCellValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao'
  if (typeof value === 'number') return isMoneyKey(key) ? formatCurrency(value) : formatNumber(value)
  if (isDateKey(key)) return formatDate(value)
  return String(value)
}

export function getToolLabel(tool?: string) {
  if (tool === 'erp') return 'ERP'
  if (tool === 'sql' || tool === 'sql_execution') return 'SQL'
  if (tool === 'ecommerce') return 'Ecommerce'
  if (tool === 'marketing') return 'Marketing'
  return humanizeKey(tool || 'Resultado')
}
