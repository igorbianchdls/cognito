"use client"

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

export type AcoesDropdownButtonProps = {
  label?: string
  open?: boolean
  disabled?: boolean
  className?: string
}

export default function AcoesDropdownButton({ label = 'Ações', open, disabled, className }: AcoesDropdownButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'inline-flex items-center gap-1.5 select-none',
        'h-7 px-2.5 rounded-full text-xs font-medium',
        'border border-gray-300 bg-white',
        'text-blue-700 hover:bg-gray-50',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'focus:outline-hidden focus:ring-2 focus:ring-blue-500/40',
        className || '',
      ].join(' ')}
      aria-haspopup="menu"
      aria-expanded={open ? true : false}
    >
      <span>{label}</span>
      <ChevronDown className={[
        'h-3.5 w-3.5 transition-transform',
        open ? 'rotate-180' : '',
      ].join(' ')} />
    </button>
  )
}

