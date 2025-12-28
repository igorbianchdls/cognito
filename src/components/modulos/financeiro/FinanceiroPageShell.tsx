"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import NexusHeader from "@/components/navigation/nexus/NexusHeader"
import NexusPageContainer from "@/components/navigation/nexus/NexusPageContainer"

type Props = React.PropsWithChildren<{
  rightActions?: React.ReactNode
}>

export default function FinanceiroPageShell({ rightActions, children }: Props) {
  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden bg-gray-100">
          <div className="flex flex-col h-full w-full">
            <NexusHeader
              viewMode={'dashboard'}
              onChangeViewMode={() => { /* no-op for financeiro */ }}
              borderless
              size="sm"
              showBreadcrumb={false}
              rightActions={rightActions}
            />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2">
              <NexusPageContainer className="h-full">
                {children}
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
