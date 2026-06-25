'use client'

import React from 'react'

type DashboardQueryRuntimeContextValue = {
  artifactId: string | null
}

const DashboardQueryRuntimeContext = React.createContext<DashboardQueryRuntimeContextValue>({
  artifactId: null,
})

export function DashboardQueryRuntimeProvider({
  artifactId,
  children,
}: {
  artifactId?: string | null
  children: React.ReactNode
}) {
  return (
    <DashboardQueryRuntimeContext.Provider value={{ artifactId: artifactId || null }}>
      {children}
    </DashboardQueryRuntimeContext.Provider>
  )
}

export function useDashboardArtifactId() {
  return React.useContext(DashboardQueryRuntimeContext).artifactId
}
