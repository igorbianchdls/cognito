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
        'h-7 px-2.5 rounded text-xs font-medium',
        // Azul claro de fundo e borda azul suave, como no exemplo
        'border bg-blue-50 border-blue-200 text-blue-700',
        // Hover mantém a família de cor azul
        'hover:bg-blue-100',
        // Estado disabled
        'disabled:opacity-60 disabled:cursor-not-allowed',
        // Foco acessível
        'focus:outline-hidden focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300',
        className || '',
      ].join(' ')}
      aria-haspopup="menu"
      aria-expanded={open ? true : false}
    >
      <span>{label}</span>
      <ChevronDown
        className={[
          'h-3.5 w-3.5 transition-transform text-blue-700',
          open ? 'rotate-180' : '',
        ].join(' ')}
      />
    </button>
  )
}
