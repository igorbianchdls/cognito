"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export default function NodeCard({
  children,
  className,
  variant = 'solid',
}: React.PropsWithChildren<{ className?: string; variant?: 'solid' | 'outline' | 'dashed' }>) {
  const borderStyle = variant === 'dashed' ? 'border-dashed' : 'border'
  const ringStyle = variant === 'solid' ? 'ring-1 ring-purple-200' : ''
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm px-4 py-3 flex items-start justify-between gap-3",
        borderStyle,
        "border-gray-200 hover:shadow-md transition-all",
        ringStyle,
        className
      )}
    >
      {children}
    </div>
  )
}

