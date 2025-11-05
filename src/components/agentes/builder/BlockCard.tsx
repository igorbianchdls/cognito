"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export default function BlockCard({
  children,
  className,
  variant = 'solid',
  selected,
  onClick,
}: React.PropsWithChildren<{ className?: string; variant?: 'solid' | 'outline' | 'dashed'; selected?: boolean; onClick?: (e?: React.MouseEvent) => void }>) {
  const borderStyle = variant === 'dashed' ? 'border border-dashed' : 'border'
  const ringStyle = selected ? 'ring-1 ring-gray-300 border-gray-400' : ''
  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl px-5 py-4 flex items-start justify-between gap-3 cursor-pointer w-fit min-w-[32ch] max-w-[56ch] shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-md transition-all",
        borderStyle,
        "border-gray-200 hover:border-gray-300",
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
  )}

