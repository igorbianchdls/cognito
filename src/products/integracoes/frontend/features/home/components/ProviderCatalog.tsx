'use client'

import type { ReactNode } from 'react'

type ProviderCatalogProps = {
  children: ReactNode
}

export default function ProviderCatalog({ children }: ProviderCatalogProps) {
  return <>{children}</>
}
