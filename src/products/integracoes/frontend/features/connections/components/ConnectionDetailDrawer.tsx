'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Bot, CheckCircle2, Database, RefreshCw, RotateCcw } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { renderIntegrationLogo } from '@/products/integracoes/shared/iconMaps'
import type { IntegrationPluginPermissions } from '@/products/integracoes/shared/contracts/pluginPermissionContracts'
import type { IntegrationDestination } from '@/products/integracoes/destinations/shared/destinationContracts'
import type { IntegrationPipeline } from '@/products/integracoes/shared/contracts/pipelineContracts'
import type {
  IntegrationConnectionWithUi,
  IntegrationEventWithUi,
  IntegrationSyncRunWithUi,
} from '@/products/integracoes/frontend/services/integracoesApi'
import {
  createIntegrationDestination,
  createIntegrationPipeline,
  fetchIntegrationDestinations,
  fetchIntegrationPluginPermissions,
  fetchIntegrationPipelines,
  updateIntegrationPluginPermissions,
} from '@/products/integracoes/frontend/services/integracoesApi'
import IntegrationEventTimeline from '@/products/integracoes/frontend/features/connections/components/IntegrationEventTimeline'
import SyncRunsTable from '@/products/integracoes/frontend/features/connections/components/SyncRunsTable'

type ConnectionDetailDrawerProps = {
  connection: IntegrationConnectionWithUi | null
  events: IntegrationEventWithUi[]
  syncRuns: IntegrationSyncRunWithUi[]
  open: boolean
  busy?: boolean
  onOpenChange: (open: boolean) => void
  onSync: (connection: IntegrationConnectionWithUi) => void
  onReconnect: (connection: IntegrationConnectionWithUi) => void
}

type ResourcePermissionKey = 'readResources' | 'liveReadResources' | 'writeResources' | 'destructiveResources'

const RESOURCE_PERMISSION_SECTIONS: Array<[string, ResourcePermissionKey]> = [
  ['Leitura sincronizada', 'readResources'],
  ['Leitura live', 'liveReadResources'],
  ['Escrita', 'writeResources'],
  ['Ações sensíveis', 'destructiveResources'],
]

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toggleResource(resources: string[], resource: string) {
  return resources.includes(resource)
    ? resources.filter((item) => item !== resource)
    : [...resources, resource]
}

function oauthErrorFromConnection(connection: IntegrationConnectionWithUi | null) {
  const value = connection?.metadata?.oauthRefreshError
  const source = connection?.metadata?.lastAuthErrorSource
  if (source && source !== 'provider_oauth' && source !== 'provider_api') return null
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function infraErrorFromConnection(connection: IntegrationConnectionWithUi | null) {
  const value = connection?.metadata?.lastInfraErrorMessage
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export default function ConnectionDetailDrawer({
  connection,
  events,
  syncRuns,
  open,
  busy = false,
  onOpenChange,
  onSync,
  onReconnect,
}: ConnectionDetailDrawerProps) {
  const toolkitSlug = String(connection?.metadata?.toolkitSlug || connection?.provider || '').toUpperCase()
  const canSync = Boolean(connection && ['connected', 'syncing', 'warning'].includes(connection.status))
  const [permissions, setPermissions] = useState<IntegrationPluginPermissions | null>(null)
  const [permissionsBusy, setPermissionsBusy] = useState(false)
  const [permissionsError, setPermissionsError] = useState<string | null>(null)
  const [destinations, setDestinations] = useState<IntegrationDestination[]>([])
  const [pipelines, setPipelines] = useState<IntegrationPipeline[]>([])
  const [dataWarehouseBusy, setDataWarehouseBusy] = useState(false)
  const [dataWarehouseError, setDataWarehouseError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !connection) {
      setPermissions(null)
      setPermissionsError(null)
      return
    }

    let active = true
    setPermissionsBusy(true)
    setPermissionsError(null)
    void fetchIntegrationPluginPermissions(connection.id, connection.tenantId)
      .then((nextPermissions) => {
        if (active) setPermissions(nextPermissions)
      })
      .catch((error) => {
        if (active) setPermissionsError(error instanceof Error ? error.message : 'Erro ao carregar permissões MCP')
      })
      .finally(() => {
        if (active) setPermissionsBusy(false)
      })

    return () => {
      active = false
    }
  }, [connection, open])

  useEffect(() => {
    if (!open || !connection) {
      setDestinations([])
      setPipelines([])
      setDataWarehouseError(null)
      return
    }

    let active = true
    setDataWarehouseBusy(true)
    setDataWarehouseError(null)
    void Promise.all([
      fetchIntegrationDestinations({ tenantId: connection.tenantId, type: 'bigquery' }),
      fetchIntegrationPipelines({ tenantId: connection.tenantId, sourceConnectionId: connection.id }),
    ])
      .then(([nextDestinations, nextPipelines]) => {
        if (!active) return
        setDestinations(nextDestinations)
        setPipelines(nextPipelines)
      })
      .catch((error) => {
        if (active) setDataWarehouseError(error instanceof Error ? error.message : 'Erro ao carregar data warehouse')
      })
      .finally(() => {
        if (active) setDataWarehouseBusy(false)
      })

    return () => {
      active = false
    }
  }, [connection, open])

  async function savePermissions(nextPermissions: IntegrationPluginPermissions) {
    if (!connection) return
    setPermissions(nextPermissions)
    setPermissionsBusy(true)
    setPermissionsError(null)
    try {
      const saved = await updateIntegrationPluginPermissions(connection.id, {
        tenantId: connection.tenantId,
        enabled: nextPermissions.enabled,
        readResources: nextPermissions.readResources,
        liveReadResources: nextPermissions.liveReadResources,
        writeResources: nextPermissions.writeResources,
        destructiveResources: nextPermissions.destructiveResources,
        requireConfirmation: nextPermissions.requireConfirmation,
      })
      setPermissions(saved)
    } catch (error) {
      setPermissionsError(error instanceof Error ? error.message : 'Erro ao salvar permissões MCP')
    } finally {
      setPermissionsBusy(false)
    }
  }

  async function enableBigQuery() {
    if (!connection) return
    setDataWarehouseBusy(true)
    setDataWarehouseError(null)
    try {
      let destination = destinations.find((item) => item.type === 'bigquery' && item.status === 'active')
      if (!destination) {
        destination = await createIntegrationDestination({
          tenantId: connection.tenantId,
          type: 'bigquery',
          name: 'BigQuery padrao',
          status: 'active',
          config: {},
          metadata: { createdFrom: 'integracoes-ui' },
        })
      }

      const existingPipeline = pipelines.find((pipeline) => pipeline.destinationId === destination?.id && pipeline.status !== 'disabled')
      if (!existingPipeline) {
        await createIntegrationPipeline({
          tenantId: connection.tenantId,
          sourceConnectionId: connection.id,
          destinationId: destination.id,
          name: `${connection.displayName} -> ${destination.name}`,
          status: 'active',
          syncFrequency: connection.syncFrequency,
          syncEnabled: true,
          metadata: { createdFrom: 'integracoes-ui' },
        })
      }

      const [nextDestinations, nextPipelines] = await Promise.all([
        fetchIntegrationDestinations({ tenantId: connection.tenantId, type: 'bigquery' }),
        fetchIntegrationPipelines({ tenantId: connection.tenantId, sourceConnectionId: connection.id }),
      ])
      setDestinations(nextDestinations)
      setPipelines(nextPipelines)
    } catch (error) {
      setDataWarehouseError(error instanceof Error ? error.message : 'Erro ao ativar BigQuery')
    } finally {
      setDataWarehouseBusy(false)
    }
  }

  const bigQueryDestination = destinations.find((item) => item.type === 'bigquery' && item.status === 'active') || null
  const bigQueryPipeline = bigQueryDestination
    ? pipelines.find((pipeline) => pipeline.destinationId === bigQueryDestination.id && pipeline.status !== 'disabled') || null
    : null
  const bigQueryEnabled = Boolean(bigQueryDestination && bigQueryPipeline)
  const ottoEnabled = Boolean(permissions?.enabled)
  const oauthError = oauthErrorFromConnection(connection)
  const infraError = infraErrorFromConnection(connection)
  const needsReconnect = Boolean(connection && (connection.status === 'pending_auth' || oauthError))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto bg-white p-0 sm:max-w-[560px]">
        {connection ? (
          <>
            <SheetHeader className="border-b border-[#EEF1F6] px-6 py-6 text-left">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#F7F8FC] ring-1 ring-[#E8ECF4]">
                  {renderIntegrationLogo(toolkitSlug, connection.displayName)}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-[24px] font-semibold tracking-[-0.04em] text-[#17203A]">
                    {connection.displayName}
                  </SheetTitle>
                  <SheetDescription className="mt-2 text-[14px] leading-6 text-[#66748D]">
                    {connection.domain.toUpperCase()} · {connection.provider}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-6 py-6">
              {needsReconnect ? (
                <section className="rounded-[16px] border border-[#FED7AA] bg-[#FFF7ED] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-white text-[#C2410C] ring-1 ring-[#FDBA74]">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-[#7C2D12]">
                        {connection.displayName} precisa ser reautenticada.
                      </div>
                      <div className="mt-1 text-[13px] leading-5 text-[#9A3412]">
                        {oauthError || connection.uiStatus?.description || 'A autorização OAuth expirou ou foi recusada pelo provider.'}
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onReconnect(connection)}
                        className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-[12px] bg-[#C2410C] px-3 text-[12px] font-semibold text-white transition hover:bg-[#9A3412] disabled:opacity-60"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reconectar {connection.displayName}
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}
              {!needsReconnect && infraError ? (
                <section className="rounded-[16px] border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                  <div className="text-[14px] font-semibold text-[#1E3A8A]">
                    Falha interna temporária na integração.
                  </div>
                  <div className="mt-1 text-[13px] leading-5 text-[#1D4ED8]">
                    {infraError}
                  </div>
                </section>
              ) : null}

              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-[#E6EAF4] bg-[#FAFBFD] p-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A4BA]">Status</div>
                  <div className="mt-2 text-[16px] font-semibold text-[#17203A]">{connection.uiStatus?.label || connection.status}</div>
                  <div className="mt-1 text-[13px] leading-5 text-[#66748D]">{connection.uiStatus?.description}</div>
                </div>
                <div className="rounded-[16px] border border-[#E6EAF4] bg-[#FAFBFD] p-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A4BA]">Último sync</div>
                  <div className="mt-2 text-[16px] font-semibold text-[#17203A]">{formatDate(connection.lastSyncAt)}</div>
                  <div className="mt-1 text-[13px] leading-5 text-[#66748D]">{connection.recordsSynced} registros sincronizados</div>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-[#E6EAF4] bg-[#FAFBFD] p-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A4BA]">Frequência</div>
                  <div className="mt-2 text-[16px] font-semibold text-[#17203A]">{connection.syncFrequency}</div>
                  <div className="mt-1 text-[13px] leading-5 text-[#66748D]">
                    {connection.syncEnabled === false ? 'Sincronização pausada.' : 'Frequência planejada para esta conexão.'}
                  </div>
                </div>
                <div className="rounded-[16px] border border-[#E6EAF4] bg-[#FAFBFD] p-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A4BA]">Próximo sync</div>
                  <div className="mt-2 text-[16px] font-semibold text-[#17203A]">{formatDate(connection.nextSyncAt)}</div>
                  <div className="mt-1 text-[13px] leading-5 text-[#66748D]">
                    {canSync ? 'Disponível quando houver agenda configurada.' : 'Disponível somente após autorização real.'}
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Dados sincronizados</div>
                <div className="flex flex-wrap gap-2">
                  {connection.selectedResources.length ? connection.selectedResources.map((resource) => (
                    <span key={resource} className="rounded-full bg-[#F2F4FA] px-3 py-1 text-[12px] font-medium text-[#475569]">
                      {resource}
                    </span>
                  )) : (
                    <span className="text-[13px] text-[#66748D]">Nenhum recurso selecionado.</span>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Data warehouse</div>
                <div className="rounded-[16px] border border-[#E6EAF4] bg-[#FAFBFD] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white text-[#2563EB] ring-1 ring-[#E1E8F8]">
                        <Database className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[14px] font-semibold text-[#24304A]">BigQuery</div>
                          <span className={[
                            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                            bigQueryEnabled ? 'bg-[#E9FDF3] text-[#108A55]' : 'bg-white text-[#66748D]',
                          ].join(' ')}>
                            {bigQueryEnabled ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="mt-1 text-[13px] leading-5 text-[#66748D]">
                          {bigQueryEnabled
                            ? `Enviando dados para ${bigQueryDestination?.name || 'BigQuery'}.`
                            : 'Envie os dados desta conexão para o data warehouse.'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={dataWarehouseBusy || bigQueryEnabled}
                      onClick={() => void enableBigQuery()}
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-[12px] bg-[#17203A] px-3 text-[12px] font-semibold text-white transition hover:bg-[#0F172C] disabled:bg-[#E5EAF3] disabled:text-[#7B879B]"
                    >
                      {dataWarehouseBusy ? 'Ativando...' : bigQueryEnabled ? 'Ativo' : 'Ativar'}
                    </button>
                  </div>
                  {dataWarehouseError ? <div className="mt-3 text-[12px] font-medium text-red-600">{dataWarehouseError}</div> : null}
                </div>
              </section>

              <section>
                <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Otto IA</div>
                <div className="rounded-[16px] border border-[#E6EAF4] bg-[#FAFBFD] p-4">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white text-[#6A50F0] ring-1 ring-[#E1E8F8]">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[14px] font-semibold text-[#24304A]">Acesso da IA</div>
                          <span className={[
                            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                            ottoEnabled ? 'bg-[#E9FDF3] text-[#108A55]' : 'bg-white text-[#66748D]',
                          ].join(' ')}>
                            {ottoEnabled ? 'Permitido' : 'Bloqueado'}
                          </span>
                        </div>
                        <div className="mt-1 text-[13px] leading-5 text-[#66748D]">
                          Permita que a Otto consulte os dados desta conexão e respeite confirmações para ações sensíveis.
                        </div>
                      </div>
                    </div>
                    {permissions ? (
                      <label className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[12px] border border-[#DCE3F0] bg-white px-3 text-[12px] font-semibold text-[#475569]">
                      <input
                        type="checkbox"
                        checked={permissions.enabled}
                        disabled={permissionsBusy}
                        onChange={(event) => {
                          void savePermissions({ ...permissions, enabled: event.target.checked })
                        }}
                        className="h-4 w-4"
                      />
                      Permitir
                    </label>
                  ) : null}
                  </div>
                  {permissions ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 rounded-[14px] bg-white px-3 py-2 text-[12px] font-medium text-[#66748D] ring-1 ring-[#E4E8F0]">
                        <CheckCircle2 className="h-4 w-4 text-[#168256]" />
                        Configuração avançada por tipo de permissão
                      </div>
                      {RESOURCE_PERMISSION_SECTIONS.map(([label, key]) => {
                        const resources = permissions[key]
                        return (
                          <div key={key}>
                            <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7B879B]">{label}</div>
                            <div className="flex flex-wrap gap-2">
                              {connection.selectedResources.length ? connection.selectedResources.map((resource) => (
                                <label
                                  key={`${key}-${resource}`}
                                  className={[
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium',
                                    resources.includes(resource)
                                      ? 'border-[#9DB4FF] bg-[#F5F8FF] text-[#24417C]'
                                      : 'border-[#E1E6F0] bg-white text-[#64748B]',
                                  ].join(' ')}
                                >
                                  <input
                                    type="checkbox"
                                    checked={resources.includes(resource)}
                                    disabled={permissionsBusy}
                                    onChange={() => {
                                      void savePermissions({
                                        ...permissions,
                                        [key]: toggleResource(resources, resource),
                                      })
                                    }}
                                    className="h-3.5 w-3.5"
                                  />
                                  {resource}
                                </label>
                              )) : (
                                <span className="text-[12px] text-[#66748D]">Nenhum recurso selecionado.</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#475569]">
                        <input
                          type="checkbox"
                          checked={permissions.requireConfirmation}
                          disabled={permissionsBusy}
                          onChange={(event) => {
                            void savePermissions({ ...permissions, requireConfirmation: event.target.checked })
                          }}
                          className="h-4 w-4"
                        />
                        Exigir confirmação
                      </label>
                    </div>
                  ) : (
                    <div className="text-[13px] text-[#66748D]">{permissionsBusy ? 'Carregando permissões...' : 'Permissões indisponíveis.'}</div>
                  )}
                  {permissionsError ? <div className="mt-3 text-[12px] font-medium text-red-600">{permissionsError}</div> : null}
                </div>
              </section>

              <section>
                <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Últimas sincronizações</div>
                <SyncRunsTable runs={syncRuns} />
              </section>

              <section>
                <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Eventos operacionais</div>
                <IntegrationEventTimeline events={events} />
              </section>
            </div>

            <SheetFooter className="border-t border-[#EEF1F6] px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={busy || !canSync}
                  onClick={() => onSync(connection)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#17203A] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0F172C] disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" />
                  {canSync ? 'Sincronizar agora' : 'Aguardando autorização'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReconnect(connection)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] border border-[#DCE3F0] bg-white px-4 text-[14px] font-semibold text-[#334155] transition hover:bg-[#F7F8FC] disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reconectar
                </button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
