'use client'

import { useEffect, useState } from 'react'

import type { ErpCapability } from '@/products/erp/shared/professionalContracts'

export function useErpAccess() {
  const [capabilities, setCapabilities] = useState<ErpCapability[] | null>(null)
  useEffect(() => {
    let active = true
    void fetch('/api/erp/acesso', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((body: { capabilities?: ErpCapability[] } | null) => { if (active) setCapabilities(body?.capabilities || []) })
      .catch(() => { if (active) setCapabilities([]) })
    return () => { active = false }
  }, [])
  return {
    loading: capabilities === null,
    capabilities: capabilities || [],
    can: (capability: ErpCapability) => capabilities === null || capabilities.includes(capability),
  }
}
