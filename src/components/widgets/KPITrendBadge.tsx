"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

type KPITrendBadgeProps = {
  current: number
  previous: number
  invert?: boolean
  label?: string
  className?: string
}

function formatPct(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function KPITrendBadge({ current, previous, invert, label = 'vs período anterior', className }: KPITrendBadgeProps) {
  const diff = current - previous
  const pct = previous === 0 ? (current === 0 ? 0 : null) : (diff / Math.abs(previous)) * 100

  // Direção da variação (independente de invert)
  const up = current >= previous
  const good = invert ? !up : up

  const color = pct === null
    ? 'bg-gray-100 text-gray-500'
    : good
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-rose-50 text-rose-700'

  const Icon = pct === null ? Minus : (up ? ArrowUpRight : ArrowDownRight)

  return (
    <div className={`flex items-center gap-2 mt-1 ${className || ''}`}>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        {pct === null ? '—' : formatPct(pct)}
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

