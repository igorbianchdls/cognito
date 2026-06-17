'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createIntegrationConnection,
  fetchIntegrationConnectionDetail,
  fetchIntegrationConnections,
  requestIntegrationReconnect,
  requestIntegrationSync,
  type IntegrationConnectionWithUi,
  type IntegrationEventWithUi,
  type IntegrationSyncRunWithUi,
} from '@/products/integracoes/frontend/services/integracoesApi'

type SyncConnectionOptions = {
  pipelineId?: string
  destinationId?: string
  resources?: string[]
}

function toolkitKeyFromConnection(connection: IntegrationConnectionWithUi): string {
  const metadata = connection.metadata || {}
  const toolkitSlug = metadata.toolkitSlug || metadata.toolkit_slug
  return String(toolkitSlug || connection.provider || '').toUpperCase()
}

export default function useIntegrationConnections(tenantId = 0) {
  const [connections, setConnections] = useState<IntegrationConnectionWithUi[]>([])
  const [selectedConnection, setSelectedConnection] = useState<IntegrationConnectionWithUi | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<IntegrationEventWithUi[]>([])
  const [selectedSyncRuns, setSelectedSyncRuns] = useState<IntegrationSyncRunWithUi[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshConnections = useCallback(async () => {
    if (!tenantId) {
      setConnections([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await fetchIntegrationConnections({ tenantId, limit: 200 })
      setConnections(rows)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void refreshConnections()
  }, [refreshConnections])

  const connectionsByToolkit = useMemo(() => {
    const map = new Map<string, IntegrationConnectionWithUi>()
    for (const connection of connections) {
      map.set(toolkitKeyFromConnection(connection), connection)
    }
    return map
  }, [connections])

  const createConnection = useCallback(async (params: {
    provider: string
    displayName?: string
    selectedResources?: string[]
    syncFrequency?: string
    credentials?: Record<string, unknown>
  }) => {
    if (!tenantId) throw new Error('Tenant ainda nao carregado.')
    setBusyId(params.provider)
    setError(null)
    try {
      const connection = await createIntegrationConnection({
        tenantId,
        provider: params.provider,
        displayName: params.displayName,
        selectedResources: params.selectedResources,
        syncFrequency: params.syncFrequency,
        credentials: params.credentials,
      })
      await refreshConnections()
      return connection
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
      throw nextError
    } finally {
      setBusyId(null)
    }
  }, [refreshConnections, tenantId])

  const loadConnectionDetail = useCallback(async (id: string) => {
    if (!tenantId) throw new Error('Tenant ainda nao carregado.')
    setBusyId(id)
    setError(null)
    try {
      const detail = await fetchIntegrationConnectionDetail(id, tenantId)
      setSelectedConnection(detail.connection)
      setSelectedSyncRuns(detail.syncRuns)
      setSelectedEvents(detail.events)
      return detail
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
      throw nextError
    } finally {
      setBusyId(null)
    }
  }, [tenantId])

  const syncConnection = useCallback(async (connectionId: string, options?: SyncConnectionOptions) => {
    if (!tenantId) throw new Error('Tenant ainda nao carregado.')
    setBusyId(`sync:${connectionId}`)
    setError(null)
    try {
      const result = await requestIntegrationSync({
        tenantId,
        connectionId,
        pipelineId: options?.pipelineId,
        destinationId: options?.destinationId,
        trigger: 'manual',
        resources: options?.resources,
        requestedBy: 'integracoes-ui',
      })
      await refreshConnections()
      await loadConnectionDetail(connectionId)
      return result
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
      throw nextError
    } finally {
      setBusyId(null)
    }
  }, [loadConnectionDetail, refreshConnections, tenantId])

  const reconnectConnection = useCallback(async (connectionId: string) => {
    if (!tenantId) throw new Error('Tenant ainda nao carregado.')
    setBusyId(`reconnect:${connectionId}`)
    setError(null)
    try {
      await requestIntegrationReconnect(connectionId, tenantId)
      await refreshConnections()
      await loadConnectionDetail(connectionId)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
      throw nextError
    } finally {
      setBusyId(null)
    }
  }, [loadConnectionDetail, refreshConnections, tenantId])

  return {
    busyId,
    connections,
    connectionsByToolkit,
    error,
    loading,
    selectedConnection,
    selectedEvents,
    selectedSyncRuns,
    setError,
    setSelectedConnection,
    createConnection,
    loadConnectionDetail,
    reconnectConnection,
    refreshConnections,
    syncConnection,
  }
}
