"use client"

import * as React from 'react'

type NfeStatusBadgeProps = { value?: string }

export default function NfeStatusBadge({ value }: NfeStatusBadgeProps) {
  const v = String(value || '').toLowerCase()
  let bg = '#f3f4f6', fg = '#6b7280'
  if (v.includes('falha')) { bg = '#fee2e2'; fg = '#dc2626' }
  else if (v.includes('emitida')) { bg = '#dcfce7'; fg = '#16a34a' }
  else if (v.includes('espera') || v.includes('envio') || v.includes('transmiss')) { bg = '#dbeafe'; fg = '#2563eb' }
  else if (v.includes('cancel')) { bg = '#fef3c7'; fg = '#ca8a04' }

  return (
    <span style={{ backgroundColor: bg, color: fg, display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
      {String(value || '-')}
    </span>
  )
}

