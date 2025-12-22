export function addDays(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10))
  if (!y || !m || !d) return dateStr
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

