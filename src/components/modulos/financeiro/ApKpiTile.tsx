"use client"

import * as React from 'react'

type Color = 'danger' | 'warning' | 'info' | 'success'

export type ApKpiTileProps = {
  title: string
  value?: number | string
  color?: Color
  tooltip?: string
  onClick?: () => void
  className?: string
}

function formatBRL(value?: number | string) {
  if (typeof value === 'number') return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const n = Number(value ?? 0)
  if (!isNaN(n)) return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return String(value ?? '')
}

const COLOR_MAP: Record<Color, { border: string; text: string }> = {
  danger: { border: 'border-red-500', text: 'text-red-600' },
  warning: { border: 'border-amber-500', text: 'text-amber-600' },
  info: { border: 'border-sky-500', text: 'text-sky-600' },
  success: { border: 'border-green-600', text: 'text-green-600' },
}

export default function ApKpiTile({ title, value = 0, color = 'info', tooltip, onClick, className }: ApKpiTileProps) {
  const colors = COLOR_MAP[color]
  return (
    <div
      className={[
        'bg-white rounded-md border border-gray-200 overflow-hidden',
        'flex flex-col justify-center min-h-[66px]',
        onClick ? 'cursor-pointer hover:bg-gray-50' : '',
        className || '',
      ].join(' ')}
      onClick={onClick}
      title={tooltip}
      role={onClick ? 'button' : undefined}
      aria-label={title}
    >
      <div className={[colors.border, 'border-t-2 w-full'].join(' ')} />
      <div className="px-3 py-2">
        <div className="text-[11px] uppercase tracking-wide text-gray-600 font-medium select-none">{title}</div>
        <div className={[colors.text, 'text-lg md:text-xl font-semibold leading-tight mt-0.5'].join(' ')}>
          {formatBRL(value)}
        </div>
      </div>
    </div>
  )
}

