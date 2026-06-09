'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, RotateCcw } from 'lucide-react'

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
import type {
  IntegrationConnectionWithUi,
  IntegrationEventWithUi,
  IntegrationSyncRunWithUi,
} from '@/products/integracoes/frontend/services/integracoesApi'
import {
  fetchIntegrationPluginPermissions,
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
                <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Recursos ativos</div>
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
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-[14px] font-semibold text-[#24304A]">Permissões MCP</div>
                  {permissions ? (
                    <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#475569]">
                      <input
                        type="checkbox"
                        checked={permissions.enabled}
                        disabled={permissionsBusy}
                        onChange={(event) => {
                          void savePermissions({ ...permissions, enabled: event.target.checked })
                        }}
                        className="h-4 w-4"
                      />
                      Habilitado
                    </label>
                  ) : null}
                </div>
                <div className="rounded-[16px] border border-[#E6EAF4] bg-[#FAFBFD] p-4">
                  {permissions ? (
                    <div className="space-y-4">
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
