export function fontVar(name?: string) {
  if (!name) return undefined
  if (name === 'Inter') return 'var(--font-inter)'
  if (name === 'Geist') return 'var(--font-geist-sans)'
  if (name === 'Barlow') return 'var(--font-barlow), "Barlow", sans-serif'
  return name
}

export function formatDate(value?: unknown) {
  if (!value) return ''
  try {
    const d = new Date(String(value))
    if (isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return String(value)
  }
}

export function formatBRL(value?: unknown) {
  const n = Number(value ?? 0)
  if (isNaN(n)) return String(value ?? '')
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
