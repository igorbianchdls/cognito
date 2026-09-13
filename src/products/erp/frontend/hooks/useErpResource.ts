'use client'
import { useEffect, useState } from 'react'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'

/** A response belongs only to its URL; changing document/page never displays stale data. */
export function useErpResource<T>(url: string) {
  const [result, setResult] = useState<{ url: string; data: T | null; error: string } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void fetch(url, { cache: 'no-store', signal: controller.signal })
      .then((response) => parseErpResponse<T>(response))
      .then((data) => {
        if (!controller.signal.aborted) setResult({ url, data, error: '' })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            url,
            data: null,
            error:
              error instanceof Error ? error.message : 'Não foi possível carregar os registros.',
          })
      })
    return () => controller.abort()
  }, [url])
  const current = result?.url === url ? result : null
  return { data: current?.data ?? null, error: current?.error ?? '', loading: !current }
}
