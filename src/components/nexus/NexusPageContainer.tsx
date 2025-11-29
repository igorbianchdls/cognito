"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Props = React.PropsWithChildren<{
  className?: string
  style?: React.CSSProperties
}>

export default function NexusPageContainer({ className, style, children }: Props) {
  return (
    <div
      className={cn(
        "border border-gray-200 rounded-md bg-white h-full w-full overflow-hidden p-0 m-2",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}
