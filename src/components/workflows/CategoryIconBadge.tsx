"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Tone = 'lime' | 'green' | 'amber' | 'violet' | 'blue' | 'indigo' | 'slate' | 'gray'

const toneClasses: Record<Tone, string> = {
  lime: "bg-lime-100 border-lime-200 text-lime-700",
  green: "bg-green-100 border-green-200 text-green-700",
  amber: "bg-amber-100 border-amber-200 text-amber-700",
  violet: "bg-violet-100 border-violet-200 text-violet-700",
  blue: "bg-blue-100 border-blue-200 text-blue-700",
  indigo: "bg-indigo-100 border-indigo-200 text-indigo-700",
  slate: "bg-slate-100 border-slate-200 text-slate-700",
  gray: "bg-gray-100 border-gray-200 text-gray-700",
}

export function CategoryIconBadge({
  tone = 'gray',
  icon,
  size = 'md',
  className,
  ariaLabel,
}: {
  tone?: Tone
  icon: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
  ariaLabel?: string
}) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 rounded-md' : 'w-10 h-10 rounded-md'
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center border shadow-sm",
        sizeClasses,
        toneClasses[tone],
        className
      )}
    >
      <div className="[&>svg]:w-4 [&>svg]:h-4">{icon}</div>
    </div>
  )
}

export type { Tone as CategoryTone }

export default CategoryIconBadge
