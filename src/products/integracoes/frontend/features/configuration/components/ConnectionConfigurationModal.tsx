'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, RotateCcw, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { renderIntegrationLogo } from '@/products/integracoes/shared/iconMaps'
import DataWarehouseSettingsPanel from '@/products/integracoes/frontend/features/configuration/components/DataWarehouseSettingsPanel'
import McpPermissionsSettingsPanel from '@/products/integracoes/frontend/features/configuration/components/McpPermissionsSettingsPanel'
import {
  normalizeMcpPermissionPreset,
  type McpPermissionPreset,
} from '@/products/integracoes/frontend/features/configuration/lib/mcpPermissionPresets'
import {
  isSupportedSyncFrequency,
  type SyncFrequencyOption,
} from '@/products/integracoes/frontend/features/configuration/lib/syncFrequencyOptions'
import {
  fetchIntegrationConnectionConfiguration,
  saveIntegrationConnectionConfiguration,
  type IntegrationConnectionConfiguration,
  type IntegrationConnectionWithUi,
} from '@/products/integracoes/frontend/services/integracoesApi'

type DataWarehouseSettings = {
  enabled: boolean
  selectedResources: string[]
  syncFrequency: SyncFrequencyOption
}

type McpSettings = {
  preset: McpPermissionPreset
  enabled: boolean
  readResources: string[]
  liveReadResources: string[]
  writeResources: string[]
  destructiveResources: string[]
  requireConfirmation: boolean
}

type ConnectionConfigurationModalProps = {
  connection: IntegrationConnectionWithUi | null
  open: boolean
  busy?: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (configuration: IntegrationConnectionConfiguration) => void | Promise<void>
  onSync?: (connection: IntegrationConnectionWithUi, configuration?: IntegrationConnectionConfiguration) => void | Promise<void>
  onReconnect?: (connection: IntegrationConnectionWithUi) => void
}

function normalizeResources(resources?: string[]) {
  return Array.from(new Set((resources || []).map((resource) => String(resource || '').trim()).filter(Boolean)))
}

function normalizeMcpCapability(resources?: string[]) {
  return normalizeResources(resources).length ? ['*'] : []
}

function getFrequency(value: unknown): SyncFrequencyOption {
  return isSupportedSyncFrequency(value) ? value : 'manual'
}

function buildState(configuration: IntegrationConnectionConfiguration): {
  dataWarehouse: DataWarehouseSettings
  mcp: McpSettings
} {
  const connectionResources = normalizeResources(configuration.connection.selectedResources)
  const pipelineResources = normalizeResources(configuration.pipeline?.selectedResources)
  const selectedResources = pipelineResources.length ? pipelineResources : connectionResources
  const metadata = configuration.permissions.metadata || {}
  const preset = normalizeMcpPermissionPreset(metadata.mcpPreset)

  return {
    dataWarehouse: {
      enabled: Boolean(configuration.pipeline && configuration.pipeline.status === 'active' && configuration.pipeline.syncEnabled),
      selectedResources,
      syncFrequency: getFrequency(configuration.pipeline?.syncFrequency || configuration.connection.syncFrequency),
    },
    mcp: {
      preset,
      enabled: configuration.permissions.enabled,
      readResources: normalizeMcpCapability(configuration.permissions.readResources),
      liveReadResources: normalizeMcpCapability(configuration.permissions.liveReadResources),
      writeResources: normalizeMcpCapability(configuration.permissions.writeResources),
      destructiveResources: normalizeMcpCapability(configuration.permissions.destructiveResources),
      requireConfirmation: configuration.permissions.requireConfirmation,
    },
  }
}

export default function ConnectionConfigurationModal({
  connection,
  open,
  busy = false,
  onOpenChange,
  onSaved,
  onSync,
  onReconnect,
}: ConnectionConfigurationModalProps) {
  const [configuration, setConfiguration] = useState<IntegrationConnectionConfiguration | null>(null)
  const [dataWarehouse, setDataWarehouse] = useState<DataWarehouseSettings>({
    enabled: false,
    selectedResources: [],
    syncFrequency: 'manual',
  })
  const [mcp, setMcp] = useState<McpSettings>({
    preset: 'blocked',
    enabled: false,
    readResources: [],
    liveReadResources: [],
    writeResources: [],
    destructiveResources: [],
    requireConfirmation: true,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingAndSyncing, setSavingAndSyncing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<{
    tone: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toolkitSlug = String(connection?.metadata?.toolkitSlug || connection?.provider || '').toUpperCase()
  const resources = useMemo(() => {
    const providerResources = configuration?.provider.resources.map((resource) => resource.slug) || []
    const selectedResources = configuration?.connection.selectedResources || connection?.selectedResources || []
    return normalizeResources([...providerResources, ...selectedResources])
  }, [configuration, connection])
  const canSync = Boolean(connection && ['connected', 'syncing', 'warning'].includes(connection.status))
  const canReconnect = Boolean(connection && ['pending_auth', 'error', 'warning'].includes(connection.status))
  const canSaveAndSync = canSync && dataWarehouse.enabled
  const hasUnsavedChanges = useMemo(() => {
    if (!configuration) return false
    const baseline = buildState(configuration)
    return (
      JSON.stringify(baseline.dataWarehouse) !== JSON.stringify(dataWarehouse)
      || JSON.stringify(baseline.mcp) !== JSON.stringify(mcp)
    )
  }, [configuration, dataWarehouse, mcp])
  const syncDisabledReason = (() => {
    if (!dataWarehouse.enabled) return 'Ative o data warehouse para sincronizar os dados para o BigQuery.'
    if (!configuration) return 'Carregue a configuração antes de sincronizar.'
    if (!dataWarehouse.selectedResources.length) return 'Selecione pelo menos um recurso para sincronizar.'
    if (hasUnsavedChanges) return 'Salve as alterações antes de sincronizar, ou use "Salvar e enviar agora".'
    if (!onSync) return 'Sincronização manual indisponível nesta tela.'
    if (busy || saving || savingAndSyncing || syncing) return 'Aguarde a operação atual terminar antes de sincronizar.'
    if (!canSync) return 'A conexão precisa estar conectada antes de sincronizar.'
    return null
  })()

  useEffect(() => {
    if (!open || !connection) {
      setConfiguration(null)
      setError(null)
      setSyncFeedback(null)
      return
    }

    let active = true
    setLoading(true)
    setError(null)
    setSyncFeedback(null)
    void fetchIntegrationConnectionConfiguration(connection.id, connection.tenantId)
      .then((nextConfiguration) => {
        if (!active) return
        const nextState = buildState(nextConfiguration)
        setConfiguration(nextConfiguration)
        setDataWarehouse(nextState.dataWarehouse)
        setMcp(nextState.mcp)
      })
      .catch((nextError) => {
        if (active) setError(nextError instanceof Error ? nextError.message : 'Erro ao carregar configuracao')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [connection, open])

  async function saveConfiguration() {
    if (!connection) return
    setSaving(true)
    setError(null)
    setSyncFeedback(null)
    try {
      const saved = await saveIntegrationConnectionConfiguration(connection.id, {
        tenantId: connection.tenantId,
        dataWarehouse,
        mcp,
      })
      const nextState = buildState(saved)
      setConfiguration(saved)
      setDataWarehouse(nextState.dataWarehouse)
      setMcp(nextState.mcp)
      await onSaved?.(saved)
      onOpenChange(false)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao salvar configuracao')
    } finally {
      setSaving(false)
    }
  }

  async function saveConfigurationAndSync() {
    if (!connection) return
    setSavingAndSyncing(true)
    setError(null)
    setSyncFeedback(null)
    try {
      const saved = await saveIntegrationConnectionConfiguration(connection.id, {
        tenantId: connection.tenantId,
        dataWarehouse,
        mcp,
      })
      const nextState = buildState(saved)
      setConfiguration(saved)
      setDataWarehouse(nextState.dataWarehouse)
      setMcp(nextState.mcp)
      await onSaved?.(saved)
      await onSync?.(saved.connection, saved)
      onOpenChange(false)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao salvar e enviar dados')
    } finally {
      setSavingAndSyncing(false)
    }
  }

  async function syncNow() {
    if (!connection || !configuration || syncing || syncDisabledReason) return
    setSyncing(true)
    setError(null)
    setSyncFeedback(null)
    try {
      await onSync?.(connection, configuration)
      setSyncFeedback({
        tone: 'success',
        message: 'Sincronização enviada. O processamento roda em segundo plano e o BigQuery será atualizado quando o run terminar.',
      })
    } catch (nextError) {
      setSyncFeedback({
        tone: 'error',
        message: nextError instanceof Error ? nextError.message : 'Erro ao solicitar sincronização',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[980px] overflow-y-auto border-[#E6EAF4] bg-[#FAFBFD] p-0">
        {connection ? (
          <>
            <DialogHeader className="border-b border-[#E6EAF4] bg-white px-6 py-5 text-left">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#F7F8FC] ring-1 ring-[#E8ECF4]">
                  {renderIntegrationLogo(toolkitSlug, connection.displayName)}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-[24px] font-semibold tracking-[-0.03em] text-[#17203A]">
                    Configurar {connection.displayName}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-[14px] leading-6 text-[#66748D]">
                    {connection.uiStatus?.label || connection.status} · {connection.provider}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              {error ? (
                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-[#E6EAF4] bg-white text-[14px] text-[#66748D]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando configuracao...
                </div>
              ) : (
                <>
                  <DataWarehouseSettingsPanel
                    value={dataWarehouse}
                    resources={resources}
                    datasets={configuration?.datasets}
                    connection={connection}
                    canSync={canSync && dataWarehouse.enabled && Boolean(configuration) && Boolean(onSync)}
                    syncing={syncing}
                    syncDisabledReason={syncDisabledReason}
                    syncFeedback={syncFeedback}
                    onSyncNow={syncNow}
                    onChange={setDataWarehouse}
                  />
                  <McpPermissionsSettingsPanel
                    value={mcp}
                    onChange={setMcp}
                  />
                </>
              )}
            </div>

            <DialogFooter className="border-t border-[#E6EAF4] bg-white px-6 py-4 sm:justify-between sm:space-x-0">
              <div className="flex flex-col gap-2 sm:flex-row">
                {canReconnect ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onReconnect?.(connection)}
                    disabled={busy || saving || savingAndSyncing}
                    className="h-10 bg-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reconectar
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant={canSaveAndSync ? 'outline' : 'default'}
                  onClick={saveConfiguration}
                  disabled={loading || saving || savingAndSyncing || busy || !connection}
                  className={canSaveAndSync ? 'h-10 bg-white' : 'h-10'}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar configuração
                </Button>
                {canSaveAndSync ? (
                  <Button
                    type="button"
                    onClick={saveConfigurationAndSync}
                    disabled={loading || saving || savingAndSyncing || busy || !connection}
                    className="h-10"
                  >
                    {savingAndSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {savingAndSyncing ? 'Enviando dados...' : 'Salvar e enviar agora'}
                  </Button>
                ) : null}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
