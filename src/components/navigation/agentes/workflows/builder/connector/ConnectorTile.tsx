"use client"

import * as React from "react"

export default function ConnectorTile({
  icon,
  label,
  hint,
  onClick,
}: {
  icon?: React.ReactNode
  label: string
  hint?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer select-none min-h-[68px] text-left w-full"
    >
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 text-gray-700 flex-shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="truncate text-gray-800 font-medium" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>
          {label}
        </div>
        {hint ? (
          <div className="text-[11px] text-gray-500 truncate">{hint}</div>
        ) : null}
      </div>
    </button>
  )
}
