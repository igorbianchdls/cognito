'use client'

import { ChevronDown, Database, Loader2, RefreshCw } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { SYNC_FREQUENCY_OPTIONS, type SyncFrequencyOption } from '@/products/integracoes/frontend/features/configuration/lib/syncFrequencyOptions'
import type { IntegrationConnectionWithUi } from '@/products/integracoes/frontend/services/integracoesApi'

type DataWarehouseSettings = {
  enabled: boolean
  selectedResources: string[]
  syncFrequency: SyncFrequencyOption
}

type DataWarehouseSettingsPanelProps = {
  value: DataWarehouseSettings
  resources: string[]
  datasets?: {
    projectId?: string
    rawDataset: string
    normalizedDataset: string
    analyticsDataset: string
  }
  connection?: IntegrationConnectionWithUi | null
  canSync?: boolean
  syncing?: boolean
  syncDisabledReason?: string | null
  syncFeedback?: {
    tone: 'success' | 'error' | 'info'
    message: string
  } | null
  onSyncNow?: () => void | Promise<void>
  onChange: (value: DataWarehouseSettings) => void
}

function formatResourceLabel(resource: string) {
  return resource
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toggleResource(resources: string[], resource: string) {
  return resources.includes(resource)
    ? resources.filter((item) => item !== resource)
    : [...resources, resource]
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Ainda não sincronizado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Ainda não sincronizado'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatFrequency(value: SyncFrequencyOption) {
  return SYNC_FREQUENCY_OPTIONS.find((option) => option.value === value)?.label || value
}

export default function DataWarehouseSettingsPanel({
  value,
  resources,
  datasets,
  connection,
  canSync = false,
  syncing = false,
  syncDisabledReason,
  syncFeedback,
  onSyncNow,
  onChange,
}: DataWarehouseSettingsPanelProps) {
  const selectedCount = value.selectedResources.length
  const syncButtonDisabled = !canSync || syncing || Boolean(syncDisabledReason)
  const syncFeedbackClassName = syncFeedback?.tone === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : syncFeedback?.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-[#DCE3F0] bg-[#F7F8FC] text-[#66748D]'

  return (
    <section className="rounded-[16px] border border-[#E6EAF4] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#ECF8F1] text-[#178654]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[16px] font-semibold text-[#1B2440]">Data warehouse</div>
            <div className="mt-1 text-[13px] leading-5 text-[#66748D]">
              Envia os dados autorizados para o BigQuery do tenant.
            </div>
          </div>
        </div>
        <Switch
          checked={value.enabled}
          onCheckedChange={(checked) => onChange({ ...value, enabled: checked })}
          aria-label="Ativar envio para data warehouse"
        />
      </div>

      {datasets ? (
        <div className="mt-4 grid gap-2 rounded-[12px] bg-[#F7F8FC] p-3 text-[12px] text-[#5F6D85] sm:grid-cols-3">
          <div className="min-w-0">
            <span className="font-semibold text-[#33405A]">Raw:</span> {datasets.rawDataset}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-[#33405A]">Normalized:</span> {datasets.normalizedDataset}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-[#33405A]">Analytics:</span> {datasets.analyticsDataset}
          </div>
          {datasets.projectId ? (
            <div className="min-w-0 sm:col-span-3">
              <span className="font-semibold text-[#33405A]">Projeto:</span> {datasets.projectId}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px]">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A4BA]">
            Recursos
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {resources.map((resource) => (
              <label
                key={resource}
                className="flex min-h-10 items-center gap-2 rounded-[10px] border border-[#E7EAF2] px-3 py-2 text-[13px] font-medium text-[#33405A]"
              >
                <input
                  type="checkbox"
                  checked={value.selectedResources.includes(resource)}
                  disabled={!value.enabled}
                  onChange={() => onChange({ ...value, selectedResources: toggleResource(value.selectedResources, resource) })}
                  className="h-4 w-4 accent-[#17203A]"
                />
                <span className="min-w-0 truncate">{formatResourceLabel(resource)}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-[12px] text-[#7B879B]">{selectedCount} selecionados</div>
        </div>

        <label className="relative">
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A4BA]">
            Frequência
          </div>
          <select
            value={value.syncFrequency}
            disabled={!value.enabled}
            onChange={(event) => onChange({ ...value, syncFrequency: event.target.value as SyncFrequencyOption })}
            className="h-11 w-full appearance-none rounded-[12px] border border-[#E1E6F0] bg-white px-3 pr-9 text-[14px] font-medium text-[#2A3550] outline-none transition disabled:bg-[#F7F8FC] disabled:text-[#98A4BA] focus:border-[#B3BDED]"
          >
            {SYNC_FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-[#95A1B8]" />
        </label>
      </div>

      <div className="mt-5 rounded-[14px] border border-[#E6EAF4] bg-[#FBFCFE] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A4BA]">
              Sincronização
            </div>
            <div className="mt-2 space-y-1 text-[13px] text-[#66748D]">
              <div>
                <span className="font-semibold text-[#33405A]">Última execução:</span>{' '}
                {formatDateTime(connection?.lastSyncAt)}
              </div>
              <div>
                <span className="font-semibold text-[#33405A]">Frequência:</span>{' '}
                {formatFrequency(value.syncFrequency)}
              </div>
              {connection?.lastError ? (
                <div className="text-red-700">
                  <span className="font-semibold">Último erro:</span> {connection.lastError}
                </div>
              ) : null}
              {syncDisabledReason ? (
                <div className="text-[#7B879B]">{syncDisabledReason}</div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onSyncNow?.()}
            disabled={syncButtonDisabled}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#17203A] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0F172C] disabled:cursor-not-allowed disabled:bg-[#D8DEE9] disabled:text-[#748199]"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </button>
        </div>

        {syncFeedback ? (
          <div className={`mt-3 rounded-[10px] border px-3 py-2 text-[12px] ${syncFeedbackClassName}`}>
            {syncFeedback.message}
          </div>
        ) : null}
      </div>
    </section>
  )
}
