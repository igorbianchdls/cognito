import type { IntegrationConnectionStatus } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationEventSeverity, IntegrationEventType } from '@/products/integracoes/shared/contracts/eventContracts'
import type { IntegrationSyncRunStatus } from '@/products/integracoes/shared/contracts/syncContracts'
import {
  CONNECTION_STATUS_UI,
  SYNC_RUN_STATUS_UI,
  type IntegrationUiStatus,
} from '@/products/integracoes/shared/contracts/statusContracts'

export function mapConnectionStatusToUi(status: IntegrationConnectionStatus): IntegrationUiStatus {
  return CONNECTION_STATUS_UI[status] || CONNECTION_STATUS_UI.draft
}

export function mapSyncRunStatusToUi(status: IntegrationSyncRunStatus): IntegrationUiStatus {
  return SYNC_RUN_STATUS_UI[status] || SYNC_RUN_STATUS_UI.queued
}

export function mapIntegrationEventTypeToUi(eventType: IntegrationEventType): IntegrationUiStatus {
  switch (eventType) {
    case 'connection.created':
      return {
        label: 'Conexão criada',
        tone: 'blue',
        description: 'Configuração local inicial registrada.',
      }
    case 'connection.updated':
      return {
        label: 'Conexão atualizada',
        tone: 'slate',
        description: 'Campos operacionais da conexão foram alterados.',
      }
    case 'connection.reconnect_requested':
      return {
        label: 'Reconexão solicitada',
        tone: 'amber',
        description: 'A autenticação precisa ser refeita.',
      }
    case 'sync.requested':
      return {
        label: 'Sync solicitado',
        tone: 'blue',
        description: 'Uma execução de sincronização foi pedida.',
      }
    case 'sync.completed':
      return {
        label: 'Sync concluído',
        tone: 'green',
        description: 'A execução terminou sem erro.',
      }
    case 'sync.failed':
      return {
        label: 'Sync com erro',
        tone: 'red',
        description: 'A execução terminou com falha.',
      }
    case 'auth.callback_received':
      return {
        label: 'Callback recebido',
        tone: 'blue',
        description: 'Retorno de autenticação recebido.',
      }
    default:
      return {
        label: 'Evento',
        tone: 'slate',
        description: 'Registro operacional da integração.',
      }
  }
}

export function mapIntegrationEventSeverityToUi(severity: IntegrationEventSeverity): IntegrationUiStatus {
  switch (severity) {
    case 'error':
      return {
        label: 'Erro',
        tone: 'red',
        description: 'Evento que exige investigação.',
      }
    case 'warning':
      return {
        label: 'Atenção',
        tone: 'amber',
        description: 'Evento que pode exigir ação.',
      }
    default:
      return {
        label: 'Informação',
        tone: 'blue',
        description: 'Evento informativo.',
      }
  }
}

export function normalizeConnectionStatus(status: unknown): IntegrationConnectionStatus {
  const value = String(status || '').trim().toLowerCase()
  if (
    value === 'draft' ||
    value === 'pending_auth' ||
    value === 'connected' ||
    value === 'syncing' ||
    value === 'warning' ||
    value === 'error' ||
    value === 'disabled'
  ) {
    return value
  }

  return 'draft'
}

export function normalizeSyncRunStatus(status: unknown): IntegrationSyncRunStatus {
  const value = String(status || '').trim().toLowerCase()
  if (
    value === 'queued' ||
    value === 'running' ||
    value === 'success' ||
    value === 'warning' ||
    value === 'error' ||
    value === 'cancelled'
  ) {
    return value
  }

  return 'queued'
}
