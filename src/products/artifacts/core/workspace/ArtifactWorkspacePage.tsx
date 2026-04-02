'use client'

import { ReactNode } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'

interface ArtifactWorkspacePageProps {
  children: ReactNode
  initialData: Record<string, unknown>
}

export function ArtifactWorkspacePage({ children, initialData }: ArtifactWorkspacePageProps) {
  return <DataProvider initialData={initialData}>{children}</DataProvider>
}
