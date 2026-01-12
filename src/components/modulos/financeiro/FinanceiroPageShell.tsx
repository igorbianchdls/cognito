"use client"

import * as React from "react"
import NexusShell from "@/components/navigation/nexus/NexusShell"

type Props = React.PropsWithChildren<{
  rightActions?: React.ReactNode
}>

export default function FinanceiroPageShell({ rightActions, children }: Props) {
  return (
    <NexusShell>
      {children}
    </NexusShell>
  )
}
