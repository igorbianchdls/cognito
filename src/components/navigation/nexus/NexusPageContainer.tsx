"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"

type Props = React.PropsWithChildren<{
  className?: string
  style?: React.CSSProperties
  showSidebarTrigger?: boolean
}>

export default function NexusPageContainer({ className, style, children, showSidebarTrigger = false }: Props) {
  return (
    <div
      className={cn(
        "relative border border-gray-200 rounded-md bg-white h-full w-full overflow-hidden p-0",
        className,
      )}
      style={style}
    >
      {showSidebarTrigger && (
        <div className="absolute top-2 left-2 z-10">
          <SidebarTrigger />
        </div>
      )}
      {children}
    </div>
  )
}
