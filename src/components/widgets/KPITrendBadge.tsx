"use client"

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

type KPITrendBadgeProps = {
  current: number
  previous: number
  invert?: boolean // ignorado: mantido por compatibilidade
  label?: string
  className?: string
}

function formatPct(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function KPITrendBadge({ current, previous, label = 'vs período anterior', className }: KPITrendBadgeProps) {
  const prevSafe = Number.isFinite(previous) ? previous : 0
  const currSafe = Number.isFinite(current) ? current : 0
  const diff = currSafe - prevSafe
  // Regra: se não houver base (previous <= 0) ou for inválida, mostrar 0%
  const pct = prevSafe === 0 ? 0 : (diff / Math.abs(prevSafe)) * 100

  // Cores/ícones pelo sinal do percentual
  const isPos = pct !== null && pct > 0
  const isNeg = pct !== null && pct < 0
  const isZero = pct === 0 || pct === null

  const color = isPos
    ? 'bg-emerald-50 text-emerald-700'
    : isNeg
      ? 'bg-rose-50 text-rose-700'
      : 'bg-gray-100 text-gray-500'

  return (
    <div className={`flex items-center gap-2 mt-1 ${className || ''}`}>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {!isZero && (isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />)}
        {pct === null ? '—' : formatPct(pct)}
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
