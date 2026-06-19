import type { IntegrationConnectionStatus } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationSyncRunStatus } from '@/products/integracoes/shared/contracts/syncContracts'

export type IntegrationStatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'progress'

export type IntegrationUiStatus = {
  label: string
  tone: IntegrationStatusTone
  description: string
}

export const CONNECTION_STATUS_UI: Record<IntegrationConnectionStatus, IntegrationUiStatus> = {
  draft: {
    label: 'Rascunho',
    tone: 'neutral',
    description: 'Configuracao iniciada, mas ainda nao ativada.',
  },
  pending_auth: {
    label: 'Reautenticar',
    tone: 'warning',
    description: 'A conexão precisa de nova autorização para continuar.',
  },
  connected: {
    label: 'Conectado',
    tone: 'success',
    description: 'Conexao ativa e pronta para sincronizacao.',
  },
  syncing: {
    label: 'Sincronizando',
    tone: 'progress',
    description: 'Uma sincronizacao esta em andamento.',
  },
  warning: {
    label: 'Atencao',
    tone: 'warning',
    description: 'A conexao funciona, mas precisa de revisao.',
  },
  error: {
    label: 'Erro',
    tone: 'danger',
    description: 'A conexao falhou e requer acao.',
  },
  disabled: {
    label: 'Desativado',
    tone: 'neutral',
    description: 'A conexao esta desativada.',
  },
}

export const SYNC_RUN_STATUS_UI: Record<IntegrationSyncRunStatus, IntegrationUiStatus> = {
  queued: {
    label: 'Na fila',
    tone: 'neutral',
    description: 'Sincronizacao aguardando execucao.',
  },
  running: {
    label: 'Executando',
    tone: 'progress',
    description: 'Sincronizacao em andamento.',
  },
  success: {
    label: 'Sucesso',
    tone: 'success',
    description: 'Sincronizacao concluida.',
  },
  warning: {
    label: 'Atencao',
    tone: 'warning',
    description: 'Sincronizacao concluida com pontos de atencao.',
  },
  error: {
    label: 'Erro',
    tone: 'danger',
    description: 'Sincronizacao falhou.',
  },
  cancelled: {
    label: 'Cancelada',
    tone: 'neutral',
    description: 'Sincronizacao cancelada antes da conclusao.',
  },
}
