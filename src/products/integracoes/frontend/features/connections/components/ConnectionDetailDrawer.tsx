'use client'

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
import type {
  IntegrationConnectionWithUi,
  IntegrationEventWithUi,
  IntegrationSyncRunWithUi,
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
                  disabled={busy}
                  onClick={() => onSync(connection)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#17203A] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0F172C] disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sincronizar agora
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
