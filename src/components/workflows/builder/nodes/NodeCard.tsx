"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export default function NodeCard({
  children,
  className,
  variant = 'solid',
  selected,
  onClick,
}: React.PropsWithChildren<{ className?: string; variant?: 'solid' | 'outline' | 'dashed'; selected?: boolean; onClick?: (e?: React.MouseEvent) => void }>) {
  const borderStyle = variant === 'dashed' ? 'border-dashed' : 'border'
  const ringStyle = selected ? 'ring-2 ring-purple-300' : variant === 'solid' ? 'ring-1 ring-purple-200' : ''
  return (
    <div
      className={cn(
        "relative bg-white rounded-xl shadow-sm px-4 py-3 flex items-start justify-between gap-3 cursor-pointer",
        borderStyle,
        "border-gray-200 hover:shadow-md transition-all",
        ringStyle,
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
    >
      {children}
    </div>
  )
}
