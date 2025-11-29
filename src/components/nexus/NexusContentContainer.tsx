"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Props = React.PropsWithChildren<{
  className?: string
  style?: React.CSSProperties
}>

export default function NexusContentContainer({ className, style, children }: Props) {
  return (
    <div
      className={cn(
        "border border-gray-200 rounded-md h-full w-full bg-white",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}
