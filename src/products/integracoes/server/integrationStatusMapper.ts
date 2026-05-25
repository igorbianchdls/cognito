import type { IntegrationConnectionStatus } from '@/products/integracoes/shared/contracts/connectionContracts'
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
