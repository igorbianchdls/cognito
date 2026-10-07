'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'

import { ERP_CAPABILITIES, type ErpCapability } from '@/products/erp/shared/professionalContracts'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import { setErpTimeZone } from '@/products/erp/frontend/services/erpTimeZone'

const accessSchema = z.object({ capabilities: z.array(z.enum(ERP_CAPABILITIES)), fuso_horario: z.string().optional() })
type AccessState = { key: string; capabilities: ErpCapability[]; error: string | null }

export function useErpAccess() {
  const { isLoaded, isSignedIn, userId, orgId, sessionId, getToken } = useAuth()
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<AccessState | null>(null)
  const key = JSON.stringify([userId, orgId, sessionId, revision])
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    const controller = new AbortController()
    void (async () => {
      try {
        const token = await getToken({ skipCache: revision > 0 })
        if (controller.signal.aborted) return
        if (!token) throw new Error('Sua sessão expirou. Entre novamente para carregar o menu.')
        const response = await fetch('/api/erp/acesso', {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        })
        const body = await parseErpResponse<{ capabilities: ErpCapability[]; fuso_horario?: string }>(response, accessSchema)
        // Datas padrão das telas passam a usar o fuso da empresa ativa.
        setErpTimeZone(body.fuso_horario)
        if (!controller.signal.aborted) setState({ key, capabilities: body.capabilities, error: null })
      } catch (error) {
        if (!controller.signal.aborted) setState({
          key,
          capabilities: [],
          error: error instanceof Error ? error.message : 'Não foi possível carregar suas permissões.',
        })
      }
    })()
    return () => controller.abort()
  }, [isLoaded, isSignedIn, key, getToken, revision])

  // Never expose permissions from the previous user, session or company.
  const current = isLoaded && isSignedIn && state?.key === key ? state : null
  const capabilities = current?.capabilities ?? []
  return {
    loading: !isLoaded || Boolean(isSignedIn && !current),
    error: isLoaded && !isSignedIn ? 'Entre novamente para carregar o menu.' : current?.error ?? null,
    capabilities,
    refresh,
    can: (capability: ErpCapability) => capabilities.includes(capability),
  }
}
