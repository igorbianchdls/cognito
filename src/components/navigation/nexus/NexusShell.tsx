"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import NexusPageContainer from "@/components/navigation/nexus/NexusPageContainer"
import { cn } from "@/lib/utils"

type NexusShellProps = React.PropsWithChildren<{
  className?: string
  style?: React.CSSProperties
  contentClassName?: string
  showSidebarTrigger?: boolean
  outerBg?: string
}>

export default function NexusShell({
  className,
  style,
  contentClassName,
  showSidebarTrigger,
  outerBg,
  children,
}: NexusShellProps) {
  const bg = outerBg ?? "#f9fafb" // gray-50
  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: bg }}>
          <div className="flex flex-col h-full w-full">
            <div className={cn("flex-1 min-h-0 pl-2 pr-2 pt-2 pb-2", contentClassName)} data-page="nexus">
              <NexusPageContainer className={cn("h-full", className)} style={style} showSidebarTrigger={showSidebarTrigger}>
                {children}
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
