type StatusBadgeProps = {
  value: unknown
}

function getTone(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('pago') || normalized.includes('aprov') || normalized.includes('ativo')) return 'success'
  if (normalized.includes('venc') || normalized.includes('erro') || normalized.includes('cancel')) return 'danger'
  if (normalized.includes('pend') || normalized.includes('abert') || normalized.includes('process')) return 'warning'
  return 'neutral'
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const text = String(value || '-')
  return <span className={`status-badge status-badge--${getTone(text)}`}>{text}</span>
}
