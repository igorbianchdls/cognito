'use client'

import type { ReactNode } from 'react'

type ProviderCardProps = {
  children: ReactNode
}

export default function ProviderCard({ children }: ProviderCardProps) {
  return <>{children}</>
}
