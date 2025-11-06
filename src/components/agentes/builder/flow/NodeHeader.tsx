"use client"

import React from 'react'

type Props = {
  icon: React.ReactNode
  badgeBg: string
  badgeColor: string
  description: string
  title: string
}

export default function NodeHeader({ icon, badgeBg, badgeColor, description, title }: Props) {
  return (
    <div className="mb-0.5">
      {/* Top row: icon (left) + small gray description to the right */}
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="inline-flex items-center justify-center w-6 h-6 rounded-md border"
          style={{ background: badgeBg, color: badgeColor, borderColor: 'rgba(0,0,0,0.06)' }}
        >
          {icon}
        </div>
        <div className="text-[11px] leading-none text-gray-500">{description}</div>
      </div>
      {/* Bottom row: prominent title */}
      <div className="text-[13px] font-semibold text-gray-900">{title}</div>
    </div>
  )
}
