'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  fetchIntegracoesUsers,
  fetchToolkitStatusMap,
  requestIntegracaoAuthorize,
} from '@/features/integracoes/frontend/services/integracoesApi'
import type { IntegracaoUserItem, ToolkitStatusMap } from '@/features/integracoes/shared/types'

export default function useIntegracoesComposio() {
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tkStatus, setTkStatus] = useState<ToolkitStatusMap>({})
  const [userItems, setUserItems] = useState<IntegracaoUserItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const refreshStatus = useCallback(async (slug?: string) => {
    try {
      const map = await fetchToolkitStatusMap({ toolkit: slug, userId: selectedUserId || undefined })
      setTkStatus((prev) => ({ ...prev, ...map }))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    }
  }, [selectedUserId])

  const loadUsers = useCallback(async (query?: string) => {
    try {
      const users = await fetchIntegracoesUsers(query)
      setUserItems(users)
      if (users.length) {
        setSelectedUserId((prev) => prev || users[0].id)
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const handleIntegrate = useCallback(async (slug: string) => {
    if (!selectedUserId) {
      setError('Selecione um usuário')
      return
    }

    setBusySlug(slug)
    setError(null)

    try {
      const redirectUrl = await requestIntegracaoAuthorize(slug, selectedUserId)
      window.location.href = redirectUrl
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setBusySlug(null)
    }
  }, [selectedUserId])

  return {
    busySlug,
    error,
    tkStatus,
    userItems,
    selectedUserId,
    setError,
    setSelectedUserId,
    loadUsers,
    refreshStatus,
    handleIntegrate,
  }
}
