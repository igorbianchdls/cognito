export function formatBRL(v: unknown) {
  const n = Number(v ?? 0)
  if (Number.isNaN(n)) return String(v ?? '')
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fontVar(name?: string) {
  if (!name) return undefined
  if (name === 'Inter') return 'var(--font-inter)'
  if (name === 'Geist') return 'var(--font-geist-sans)'
  if (name === 'Roboto Mono') return 'var(--font-roboto-mono)'
  if (name === 'Geist Mono') return 'var(--font-geist-mono)'
  if (name === 'IBM Plex Mono') return 'var(--font-ibm-plex-mono), "IBM Plex Mono", monospace'
  if (name === 'Avenir') return 'var(--font-avenir), Avenir, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
  if (name === 'Space Mono') return 'var(--font-space-mono), "Space Mono", monospace'
  if (name === 'EB Garamond') return 'var(--font-eb-garamond), "EB Garamond", serif'
  if (name === 'Libre Baskerville') return 'var(--font-libre-baskerville), "Libre Baskerville", serif'
  if (name === 'Barlow') return 'var(--font-barlow), "Barlow", sans-serif'
  return name
}

export function toDateOnly(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function parseDate(value?: string) {
  if (!value) return null
  if (typeof value === 'string') {
    const mIso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (mIso) {
      const yyyy = parseInt(mIso[1], 10)
      const mm = parseInt(mIso[2], 10)
      const dd = parseInt(mIso[3], 10)
      const d = new Date(yyyy, mm - 1, dd)
      if (!Number.isNaN(d.getTime())) return d
    }
    const mBr = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (mBr) {
      const dd = parseInt(mBr[1], 10)
      const mm = parseInt(mBr[2], 10)
      const yyyy = parseInt(mBr[3], 10)
      const d = new Date(yyyy, mm - 1, dd)
      if (!Number.isNaN(d.getTime())) return d
    }
  }
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? null : d
}

export function daysDiffFromToday(dateStr?: string) {
  const d = parseDate(dateStr)
  if (!d) return null
  const today = new Date()
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const ms = b.getTime() - a.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function isPaid(status?: string) {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('pago') || s.includes('liquidado') || s.includes('baixado')
}

export function toNum(v: unknown) {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim().replace(/\./g, '').replace(/,/g, '.')
    const n = parseFloat(s)
    return Number.isNaN(n) ? 0 : n
  }
  const n = Number(v || 0)
  return Number.isNaN(n) ? 0 : n
}
