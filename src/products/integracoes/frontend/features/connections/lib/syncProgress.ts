import type {
  IntegrationEventWithUi,
  IntegrationSyncRunWithUi,
} from '@/products/integracoes/frontend/services/integracoesApi'

export type SyncProgressTone = 'neutral' | 'progress' | 'success' | 'warning' | 'danger'

export type SyncProgressSummary = {
  tone: SyncProgressTone
  title: string
  detail: string
  recordsLabel: string
  stepsLabel?: string
  warningLabel?: string
  resourceLabel?: string
  isActive: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => isRecord(item))
    : []
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
}

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatResource(value?: string | null) {
  const resource = String(value || '').trim()
  if (!resource) return undefined
  return resource
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function plural(value: number, singular: string, pluralLabel: string) {
  return `${value} ${value === 1 ? singular : pluralLabel}`
}

function analyticsAuxiliaryWarning(value: string) {
  const warning = value.toLowerCase()
  return warning.includes('_analytics') || warning.includes('org_3_analytics') || warning.includes('bigquery.tables.update')
}

function runResources(run: IntegrationSyncRunWithUi) {
  return asRecordArray(run.metadata?.resources)
}

function warningMessages(run: IntegrationSyncRunWithUi) {
  const messages: string[] = []
  for (const resource of runResources(run)) {
    messages.push(...asStringArray(resource.normalizationWarnings))
    if (typeof resource.errorMessage === 'string' && resource.errorMessage.trim()) {
      messages.push(resource.errorMessage.trim())
    }
  }
  if (run.errorMessage) messages.push(run.errorMessage)
  return messages
}

function eventsForRun(run: IntegrationSyncRunWithUi, events: IntegrationEventWithUi[]) {
  return events.filter((event) => String(event.metadata?.runId || '') === run.id)
}

function chunkEvents(run: IntegrationSyncRunWithUi, events: IntegrationEventWithUi[]) {
  return eventsForRun(run, events).filter((event) => event.eventType === 'sync.resource.chunk_completed')
}

function latestResource(run: IntegrationSyncRunWithUi, events: IntegrationEventWithUi[]) {
  const resources = runResources(run)
  const resourceFromMetadata = resources
    .map((resource) => String(resource.resource || '').trim())
    .find(Boolean)
  if (resourceFromMetadata) return resourceFromMetadata

  const eventResource = eventsForRun(run, events)
    .map((event) => String(event.metadata?.resource || '').trim())
    .find(Boolean)
  return eventResource || run.resource || undefined
}

function processedRecords(run: IntegrationSyncRunWithUi, events: IntegrationEventWithUi[]) {
  const completed = chunkEvents(run, events)
  const latestEventRecords = completed
    .map((event) => asNumber(event.metadata?.recordsIn))
    .filter((value) => value > 0)
    .at(-1)
  if (latestEventRecords) return latestEventRecords

  return run.recordsIn || run.recordsUpdated || runResources(run).reduce((sum, resource) => {
    return sum + asNumber(resource.recordsIn || resource.recordsUpdated)
  }, 0)
}

export function buildSyncProgressSummary(
  run: IntegrationSyncRunWithUi,
  events: IntegrationEventWithUi[] = [],
): SyncProgressSummary {
  const records = processedRecords(run, events)
  const completedChunks = chunkEvents(run, events).length
  const resourceLabel = formatResource(latestResource(run, events))
  const recordsLabel = plural(records, 'registro', 'registros')
  const stepsLabel = completedChunks ? plural(completedChunks, 'etapa concluída', 'etapas concluídas') : undefined
  const warnings = warningMessages(run)
  const onlyAuxiliaryAnalyticsWarning = warnings.length > 0 && warnings.every(analyticsAuxiliaryWarning)
  const resourceSuffix = resourceLabel ? ` ${resourceLabel.toLowerCase()}` : ''

  if (run.status === 'queued' || run.status === 'running') {
    return {
      tone: 'progress',
      title: resourceLabel ? `Sincronizando ${resourceLabel}` : 'Sincronização em andamento',
      detail: [records ? `${recordsLabel} processados` : 'Preparando envio', stepsLabel].filter(Boolean).join(' • '),
      recordsLabel,
      stepsLabel,
      resourceLabel,
      isActive: true,
    }
  }

  if (run.status === 'success') {
    return {
      tone: 'success',
      title: 'Sincronização concluída',
      detail: `${recordsLabel} enviados para o BigQuery${stepsLabel ? ` • ${stepsLabel}` : ''}.`,
      recordsLabel,
      stepsLabel,
      resourceLabel,
      isActive: false,
    }
  }

  if (run.status === 'warning') {
    return {
      tone: onlyAuxiliaryAnalyticsWarning ? 'success' : 'warning',
      title: onlyAuxiliaryAnalyticsWarning ? 'Dados enviados' : 'Concluída com aviso',
      detail: onlyAuxiliaryAnalyticsWarning
        ? `${recordsLabel} sincronizados${resourceSuffix}. Uma etapa auxiliar não bloqueou os dados.`
        : `${recordsLabel} sincronizados${stepsLabel ? ` • ${stepsLabel}` : ''}. Verifique os avisos.`,
      recordsLabel,
      stepsLabel,
      warningLabel: warnings[0],
      resourceLabel,
      isActive: false,
    }
  }

  if (run.status === 'error') {
    return {
      tone: 'danger',
      title: 'Sincronização falhou',
      detail: records
        ? `Parou após ${recordsLabel}. A próxima execução pode retomar do último ponto salvo.`
        : 'Não foi possível iniciar o envio dos dados.',
      recordsLabel,
      stepsLabel,
      warningLabel: run.errorMessage || warnings[0],
      resourceLabel,
      isActive: false,
    }
  }

  return {
    tone: 'neutral',
    title: 'Sincronização registrada',
    detail: `${recordsLabel} registrados${stepsLabel ? ` • ${stepsLabel}` : ''}.`,
    recordsLabel,
    stepsLabel,
    resourceLabel,
    isActive: false,
  }
}

export function latestSyncProgress(
  runs: IntegrationSyncRunWithUi[],
  events: IntegrationEventWithUi[] = [],
) {
  const run = runs[0]
  return run ? buildSyncProgressSummary(run, events) : null
}
