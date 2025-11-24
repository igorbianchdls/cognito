"use client"

import * as React from 'react'

type Props = {
  icon: React.ReactNode
  label: string
  size?: number
  title?: string
  className?: string
}

export default function IconLabelHeader({ icon, label, size = 14, title, className }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap ${className ?? ''}`}
      title={title || label}
      style={{ lineHeight: 1 }}
    >
      {/* allow callers to control icon size via passed element or inherit via font-size */}
      <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      <span>{label}</span>
    </span>
  )
}
