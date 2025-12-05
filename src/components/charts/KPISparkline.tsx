"use client"

import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useId } from 'react'
import { useStore } from '@nanostores/react'
import { $kpiSparklines } from '@/stores/modulos/kpiSparklineStore'

type KPISparklineProps = {
  id: string
  height?: number
  className?: string
}

export function KPISparkline({ id, height = 36, className }: KPISparklineProps) {
  // Hooks must be called unconditionally
  const uid = useId().replace(/[:]/g, '')
  const all = useStore($kpiSparklines)
  const serie = all[id]

  if (!serie || !Array.isArray(serie.data) || serie.data.length === 0) {
    return null
  }

  const data = serie.data.map((v, i) => ({ i, v }))
  // Critério de cor: comparação explícita (se houver), senão inclinação da série
  let up = (data[data.length - 1]?.v ?? 0) >= (data[0]?.v ?? 0)
  if (typeof serie.currentTotal === 'number' && typeof serie.previousTotal === 'number') {
    up = (serie.currentTotal ?? 0) >= (serie.previousTotal ?? 0)
  }

  const colorUp = serie.colorUp || '#10b981' // emerald-500
  const colorDown = serie.colorDown || '#ef4444' // rose-500
  const isGood = serie.invert ? !up : up
  const color = isGood ? colorUp : colorDown

  const gradId = `kpi-spark-${id.replace(/[^a-zA-Z0-9_-]/g, '')}-${uid}`

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
